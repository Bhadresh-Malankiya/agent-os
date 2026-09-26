import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import pg from "pg";
test(
  "durable queue, duplicate safety, pause/resume, decisions, limits and feedback isolation",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const admin = new pg.Pool({
      connectionString: process.env.TEST_DATABASE_URL,
    });
    const name = "agent_os_test_" + randomUUID().replaceAll("-", "");
    await admin.query(`CREATE DATABASE ${name}`);
    const url = new URL(process.env.TEST_DATABASE_URL!);
    url.pathname = "/" + name;
    process.env.DATABASE_URL = url.toString();
    const { pool } = await import("../lib/db");
    try {
      await pool.query(readFileSync("lib/schema.sql", "utf8"));
      const {
        saveProfile,
        seedDemo,
        queuePackage,
        resolveDecision,
        snapshot,
        editArtifact,
      } = await import("../lib/service");
      const { tick } = await import("../scripts/worker");
      await seedDemo();
      await seedDemo();
      assert.equal(
        (await pool.query("SELECT count(*)::int n FROM opportunities")).rows[0]
          .n,
        3,
      );
      const id = (await pool.query("SELECT id FROM opportunities LIMIT 1"))
        .rows[0].id;
      await assert.rejects(queuePackage(id));
      await saveProfile({
        name: "Test Owner",
        email: "owner@example.com",
        headline: "Full stack engineer",
        location: "Remote",
        summary:
          "Builds reliable applications with a product engineering team.",
        skills: ["TypeScript", "React"],
        evidence: ["Built a reporting application."],
      });
      await Promise.all(Array.from({ length: 10 }, () => queuePackage(id)));
      assert.equal(
        (await pool.query("SELECT count(*)::int n FROM runs")).rows[0].n,
        1,
      );
      await pool.query("UPDATE settings SET autopilot=false");
      await tick();
      assert.equal(
        (await pool.query("SELECT count(*)::int n FROM artifacts")).rows[0].n,
        0,
      );
      await pool.query("UPDATE settings SET autopilot=true");
      await Promise.all([tick(), tick(), tick()]);
      assert.equal(
        (await pool.query("SELECT count(*)::int n FROM artifacts")).rows[0].n,
        1,
      );
      assert.equal(
        (await pool.query("SELECT count(*)::int n FROM decisions")).rows[0].n,
        1,
      );
      const artifact = (
        await pool.query("SELECT id,content FROM artifacts LIMIT 1")
      ).rows[0];
      await editArtifact(
        artifact.id,
        "Owner revised the draft and retained its prior content.",
      );
      assert.equal(
        (
          await pool.query(
            "SELECT content FROM artifact_revisions WHERE artifact_id=$1",
            [artifact.id],
          )
        ).rows[0].content,
        artifact.content,
      );
      await queuePackage(id);
      assert.equal(
        (await pool.query("SELECT count(*)::int n FROM runs")).rows[0].n,
        1,
        "unchanged profile reuses completed package",
      );
      const d = (await pool.query("SELECT id FROM decisions LIMIT 1")).rows[0]
        .id;
      await resolveDecision(d, "Reviewed; manual submission pending.");
      await assert.rejects(resolveDecision(d, "Second answer"));
      assert.equal(
        (await pool.query("SELECT status FROM opportunities WHERE id=$1", [id]))
          .rows[0].status,
        "prepared",
        "answer never implies submitted",
      );
      await pool.query("UPDATE settings SET daily_limit=1");
      const other = (
        await pool.query("SELECT id FROM opportunities WHERE id<>$1 LIMIT 1", [
          id,
        ])
      ).rows[0].id;
      await assert.rejects(queuePackage(other), /Daily package limit/);
      await pool.query(
        "INSERT INTO feedback(id,opportunity_id,outcome) VALUES($1,$2,'rejected')",
        [randomUUID(), id],
      );
      assert.equal(
        (await snapshot()).learning.length,
        0,
        "synthetic rejections cannot contaminate real learning",
      );
      let overview = await snapshot();
      assert.equal(
        overview.agents.find((a) => a.id === "package")!.level,
        0,
        "demo runs cannot raise maturity",
      );
      const realId = randomUUID();
      await pool.query(
        "INSERT INTO opportunities(id,kind,title,company,country,source,description) VALUES($1,'job','Maturity fixture','Synthetic employer','Remote','Test','Isolated evidence test')",
        [realId],
      );
      for (let i = 0; i < 20; i++)
        await pool.query(
          "INSERT INTO runs(id,opportunity_id,kind,status,attempts) VALUES($1,$2,'package','completed',1)",
          [randomUUID(), realId],
        );
      overview = await snapshot();
      assert.equal(
        overview.agents.find((a) => a.id === "package")!.level,
        2,
        "twenty clean real runs reach consistent",
      );
      const failed = randomUUID();
      await pool.query(
        "INSERT INTO runs(id,opportunity_id,kind,status,attempts) VALUES($1,$2,'package','failed',3)",
        [failed, realId],
      );
      assert.equal(
        (await snapshot()).agents.find((a) => a.id === "package")!.level,
        1,
        "new failure lowers badge",
      );
      await pool.query(
        "UPDATE runs SET created_at=now()-interval '31 days' WHERE opportunity_id=$1",
        [realId],
      );
      assert.equal(
        (await snapshot()).agents.find((a) => a.id === "package")!.level,
        0,
        "expired history cannot inflate maturity",
      );
    } finally {
      await pool.end();
      // Give the server time to observe disconnected test clients before removal.
      for (let attempt = 0; attempt < 30; attempt++) {
        const active = await admin.query(
          "SELECT count(*)::int n FROM pg_stat_activity WHERE datname=$1",
          [name],
        );
        if (active.rows[0].n === 0) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await admin.query(`DROP DATABASE ${name}`);
      await admin.end();
    }
  },
);
