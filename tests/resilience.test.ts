import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";
test(
  "rollback, poison job quarantine, idle reconnection and concurrent stress",
  { skip: !process.env.TEST_DATABASE_URL, timeout: 60000 },
  async () => {
    const admin = new pg.Pool({
      connectionString: process.env.TEST_DATABASE_URL,
    });
    const name = "agent_os_resilience_" + randomUUID().replaceAll("-", "");
    await admin.query(`CREATE DATABASE ${name}`);
    const url = new URL(process.env.TEST_DATABASE_URL!);
    url.pathname = "/" + name;
    process.env.DATABASE_URL = url.toString();
    const { pool } = await import("../lib/db");
    try {
      await pool.query(readFileSync("lib/schema.sql", "utf8"));
      const { saveProfile, addOpportunity, queuePackage } =
        await import("../lib/service");
      const { tick } = await import("../scripts/worker");
      await saveProfile({
        name: "Resilience Test",
        email: "test@example.com",
        headline: "Software engineer",
        location: "Remote",
        summary:
          "A synthetic profile for isolated failure and recovery testing.",
        skills: ["TypeScript"],
        evidence: ["Synthetic project."],
      });
      await pool.query("UPDATE settings SET daily_limit=1000");
      const create = (title: string) =>
        addOpportunity(
          {
            kind: "job",
            title,
            company: "Synthetic resilience",
            country: "Remote",
            source: "Fixture",
            description:
              "Build TypeScript applications. This is a synthetic job for a failure injection test.",
          },
          true,
        );
      const broken = await create("Broken fixture");
      const good = await create("Healthy fixture");
      await queuePackage(broken.id);
      await queuePackage(good.id);
      await pool.query(
        `CREATE FUNCTION inject_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.opportunity_id='${broken.id}'::uuid THEN RAISE EXCEPTION 'synthetic storage failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER fail_fixture BEFORE INSERT ON artifacts FOR EACH ROW EXECUTE FUNCTION inject_failure();`,
      );
      await tick();
      assert.equal(
        (
          await pool.query(
            "SELECT attempts FROM runs WHERE opportunity_id=$1",
            [broken.id],
          )
        ).rows[0].attempts,
        1,
      );
      assert.equal(
        (
          await pool.query("SELECT status FROM opportunities WHERE id=$1", [
            broken.id,
          ])
        ).rows[0].status,
        "new",
        "opportunity mutation rolled back",
      );
      await tick();
      assert.equal(
        (
          await pool.query(
            "SELECT count(*)::int n FROM artifacts WHERE opportunity_id=$1",
            [good.id],
          )
        ).rows[0].n,
        1,
        "healthy work bypasses poison retry delay",
      );
      for (let i = 0; i < 2; i++) {
        await pool.query(
          "UPDATE runs SET next_attempt_at=now() WHERE opportunity_id=$1",
          [broken.id],
        );
        await tick();
      }
      const badRun = (
        await pool.query(
          "SELECT status,attempts FROM runs WHERE opportunity_id=$1",
          [broken.id],
        )
      ).rows[0];
      assert.deepEqual(badRun, { status: "failed", attempts: 3 });
      assert.equal(
        (
          await pool.query(
            "SELECT count(*)::int n FROM decisions WHERE opportunity_id=$1 AND kind='workflow-failure'",
            [broken.id],
          )
        ).rows[0].n,
        1,
      );
      assert.equal(
        (
          await pool.query(
            "SELECT count(*)::int n FROM artifacts WHERE opportunity_id=$1",
            [broken.id],
          )
        ).rows[0].n,
        0,
      );
      const idle = await pool.connect();
      const idlePid = (await idle.query("SELECT pg_backend_pid() pid")).rows[0]
        .pid;
      idle.release();
      const idleGone = new Promise((resolve) => pool.once("error", resolve));
      await admin.query("SELECT pg_terminate_backend($1)", [idlePid]);
      await idleGone;
      assert.equal(
        (await pool.query("SELECT 1 n")).rows[0].n,
        1,
        "pool reconnects",
      );
      const held = await pool.connect();
      held.on("error", () => {});
      const pid = (await held.query("SELECT pg_backend_pid() pid")).rows[0].pid;
      await held.query("BEGIN");
      await held.query(
        "UPDATE opportunities SET status='partial' WHERE id=$1",
        [good.id],
      );
      const disconnected = new Promise((resolve) =>
        held.once("error", resolve),
      );
      await admin.query("SELECT pg_terminate_backend($1)", [pid]);
      await disconnected;
      held.release(true);
      assert.equal(
        (
          await pool.query("SELECT status FROM opportunities WHERE id=$1", [
            good.id,
          ])
        ).rows[0].status,
        "prepared",
        "connection loss rolls back incomplete transaction",
      );
      const ids = [];
      for (let i = 0; i < 200; i++)
        ids.push((await create("Stress fixture " + i)).id);
      await Promise.all(
        ids.flatMap((id) => [queuePackage(id), queuePackage(id)]),
      );
      for (let batch = 0; batch < 25; batch++)
        await Promise.all(Array.from({ length: 8 }, () => tick()));
      const result = (
        await pool.query(
          "SELECT (SELECT count(*)::int FROM artifacts WHERE opportunity_id=ANY($1::uuid[])) artifacts,(SELECT count(*)::int FROM runs WHERE opportunity_id=ANY($1::uuid[]) AND status='completed') completed",
          [ids],
        )
      ).rows[0];
      assert.deepEqual(result, { artifacts: 200, completed: 200 });
      const remaining = (
        await pool.query(
          "SELECT count(*)::int n FROM runs WHERE status='queued'",
        )
      ).rows[0].n;
      assert.equal(remaining, 0);
      const { addSource, syncSource } = await import("../lib/sources");
      await addSource({
        provider: "greenhouse",
        slug: "fixture",
        company: "Synthetic source",
        keywords: "engineer",
      });
      const sourceId = (await pool.query("SELECT id FROM sources LIMIT 1"))
        .rows[0].id;
      const originalFetch = globalThis.fetch;
      let entered!: () => void;
      const fetching = new Promise<void>((resolve) => {
        entered = resolve;
      });
      globalThis.fetch = async (_input, init) => {
        entered();
        return new Promise<Response>((_resolve, reject) => {
          init!.signal!.addEventListener(
            "abort",
            () => reject(new Error("Source lease lost")),
            { once: true },
          );
        });
      };
      try {
        const syncing = syncSource(sourceId);
        const rejected = assert.rejects(syncing, /Source lease lost/);
        await fetching;
        assert.deepEqual(
          await syncSource(sourceId),
          { ok: true, imported: 0, busy: true },
          "source sync is serialized",
        );
        const sourcePid = (
          await admin.query(
            "SELECT pid FROM pg_locks WHERE locktype='advisory' AND objid=8917342 AND database=(SELECT oid FROM pg_database WHERE datname=$1)",
            [name],
          )
        ).rows[0].pid;
        await admin.query("SELECT pg_terminate_backend($1)", [sourcePid]);
        await rejected;
        assert.equal(
          (await pool.query("SELECT 1 n")).rows[0].n,
          1,
          "source lease loss does not crash worker",
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
      const { aiTick } = await import("../scripts/ai-worker");
      const candidate = await addOpportunity({
        kind: "job",
        title: "AI circuit fixture",
        company: "Synthetic circuit",
        country: "Remote",
        source: "Synthetic read-only test",
        description:
          "TypeScript engineering opportunity for testing AI dispatch boundaries.",
      });
      await pool.query(
        "UPDATE opportunities SET status='prepared' WHERE id=$1",
        [candidate.id],
      );
      await pool.query("UPDATE settings SET ai_assist=true,ai_daily_limit=100");
      const lock = await pool.connect();
      await lock.query("SELECT pg_advisory_lock(8917341)");
      try {
        assert.equal(
          await aiTick(),
          false,
          "second AI worker cannot overlap an account session",
        );
      } finally {
        await lock.query("SELECT pg_advisory_unlock(8917341)");
        lock.release();
      }
      assert.equal(
        (
          await pool.query(
            "SELECT count(*)::int n FROM runs WHERE kind='ai-brief'",
          )
        ).rows[0].n,
        0,
      );
      for (let i = 0; i < 3; i++)
        await pool.query(
          "INSERT INTO runs(id,kind,status) VALUES($1,'ai-brief','failed')",
          [randomUUID()],
        );
      assert.equal(
        await aiTick(),
        false,
        "failure circuit stops new model attempts",
      );
      assert.equal(
        (
          await pool.query(
            "SELECT count(*)::int n FROM runs WHERE kind='ai-brief'",
          )
        ).rows[0].n,
        3,
      );
      const stale = randomUUID();
      await pool.query(
        "INSERT INTO runs(id,kind,status,created_at,updated_at) VALUES($1,'ai-brief','running',now()-interval '1 day',now()-interval '1 hour')",
        [stale],
      );
      await aiTick();
      assert.equal(
        (await pool.query("SELECT status FROM runs WHERE id=$1", [stale]))
          .rows[0].status,
        "failed",
        "interrupted inference is reconciled",
      );
    } finally {
      await pool.end();
      for (let i = 0; i < 30; i++) {
        if (
          (
            await admin.query(
              "SELECT count(*)::int n FROM pg_stat_activity WHERE datname=$1",
              [name],
            )
          ).rows[0].n === 0
        )
          break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await admin.query(`DROP DATABASE ${name}`);
      await admin.end();
    }
  },
);
