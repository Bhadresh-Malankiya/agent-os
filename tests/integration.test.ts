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
    } finally {
      await pool.end();
      await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
      await admin.end();
    }
  },
);
