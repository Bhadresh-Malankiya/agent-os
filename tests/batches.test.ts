import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import pg from "pg";
test(
  "batches persist cadence, deduplicate drafts, preserve edits and gate sending",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const admin = new pg.Pool({
      connectionString: process.env.TEST_DATABASE_URL,
    });
    const name = "agent_os_batch_" + randomUUID().replaceAll("-", "");
    await admin.query(`CREATE DATABASE ${name}`);
    const url = new URL(process.env.TEST_DATABASE_URL!);
    url.pathname = "/" + name;
    process.env.DATABASE_URL = url.toString();
    const { pool } = await import("../lib/db");
    try {
      await pool.query(readFileSync("lib/schema.sql", "utf8"));
      const { saveProfile, addOpportunity } = await import("../lib/service");
      const { batchTick } = await import("../lib/batches");
      const { tick } = await import("../scripts/worker");
      const { prepareOutreachDrafts, updateDraft, markManualSent } =
        await import("../lib/outreach");
      const { workHash, approveWork } = await import("../lib/work");
      await saveProfile({
        name: "Test Owner",
        email: "owner@example.com",
        headline: "Product engineer",
        location: "Remote",
        summary: "Builds reliable TypeScript applications for product teams.",
        skills: ["TypeScript"],
        evidence: ["Built a reporting application."],
      });
      await addOpportunity({
        kind: "job",
        company: "Test Co",
        title: "Product Engineer",
        country: "Remote",
        source: "Fixture",
        description:
          "TypeScript product engineering role for a synthetic team.",
        url: "https://example.com/job",
      });
      assert.equal(
        await batchTick(async () => ({ ok: true, imported: 0 })),
        true,
      );
      assert.equal(
        await batchTick(async () => ({ ok: true, imported: 0 })),
        false,
      );
      await tick();
      await Promise.all([prepareOutreachDrafts(), prepareOutreachDrafts()]);
      let w = (await pool.query("SELECT * FROM work_items")).rows[0];
      assert.equal(
        (await pool.query("SELECT count(*)::int n FROM work_items")).rows[0].n,
        1,
      );
      assert.equal(w.recipient, "");
      await assert.rejects(approveWork(w.id, workHash(w)), /recipient/);
      await updateDraft(
        w.id,
        {
          ...w,
          recipient: "known@example.com",
          body: "Owner edited this exact message.",
        },
        workHash(w),
      );
      await prepareOutreachDrafts();
      w = (await pool.query("SELECT * FROM work_items")).rows[0];
      assert.equal(w.body, "Owner edited this exact message.");
      await assert.rejects(
        updateDraft(
          w.id,
          { ...w, body: "stale update request" },
          "0".repeat(64),
        ),
        /changed/,
      );
      await markManualSent(w.id, workHash(w));
      await assert.rejects(approveWork(w.id, workHash(w)), /handled/);
      await prepareOutreachDrafts();
      assert.equal(
        (await pool.query("SELECT status FROM work_items")).rows[0].status,
        "manual_sent",
      );
      await pool.query(
        "UPDATE settings SET next_batch_at=now(),autopilot=false",
      );
      assert.equal(await batchTick(), false);
      assert.equal(
        (await pool.query("SELECT count(*)::int n FROM outreach_batches"))
          .rows[0].n,
        1,
      );
    } finally {
      await pool.end();
      await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
      await admin.end();
    }
  },
);
