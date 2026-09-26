import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";
test(
  "external queue gates, account binding, duplicate prevention, reply/conflict checks and ambiguous delivery",
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
      const { createWork, workTick, workHash } = await import("../lib/work");
      let calls: string[] = [];
      let behavior = "success";
      const deps: any = {
        account: async () => ({
          accountId: "account-fixture",
          userId: "owner-fixture",
        }),
        execute: async (slug: string) => {
          calls.push(slug);
          if (behavior === "throw") throw new Error("timeout");
          return {
            successful: true,
            data:
              slug === "GMAIL_FETCH_EMAILS"
                ? { messages: behavior === "reply" ? [{ id: "reply" }] : [] }
                : slug === "GOOGLECALENDAR_FIND_EVENT"
                  ? {
                      items:
                        behavior === "conflict"
                          ? [{ status: "confirmed" }]
                          : [],
                    }
                  : { id: "receipt-fixture" },
          };
        },
      };
      async function draft(
        kind = "email",
        recipient = randomUUID() + "@example.com",
      ) {
        await createWork({
          kind,
          recipient,
          title: "Fixture outreach",
          body: "Synthetic content for isolated testing only.",
          due_at: kind === "meeting" ? "2035-01-01T12:00:00Z" : null,
        });
        const w = (
          await pool.query(
            "SELECT * FROM work_items WHERE recipient=$1 ORDER BY created_at DESC LIMIT 1",
            [recipient],
          )
        ).rows[0];
        return w;
      }
      async function approve(w: any) {
        await pool.query(
          "UPDATE work_items SET status='approved',approval_hash=$2,approved_account_id='account-fixture' WHERE id=$1",
          [w.id, workHash(w)],
        );
      }
      async function state(w: any) {
        return (
          await pool.query("SELECT status FROM work_items WHERE id=$1", [w.id])
        ).rows[0].status;
      }
      const w = await draft();
      await approve(w);
      await workTick(deps);
      assert.equal(calls.length, 0, "no access means no effects");
      await pool.query(
        "UPDATE settings SET access_confirmed=true,workspace_mode='outreach',autopilot=false",
      );
      await workTick(deps);
      assert.equal(calls.length, 0, "pause holds approvals");
      await pool.query("UPDATE settings SET autopilot=true");
      await Promise.all([workTick(deps), workTick(deps), workTick(deps)]);
      assert.equal(calls.length, 1);
      assert.equal(await state(w), "sent");
      await workTick(deps);
      assert.equal(calls.length, 1, "receipt is never resent");
      await createWork({
        kind: "email",
        recipient: w.recipient,
        title: w.title,
        body: w.body,
      });
      assert.equal(
        (await pool.query("SELECT count(*)::int n FROM work_items")).rows[0].n,
        1,
        "duplicate draft suppressed",
      );
      const cool = await draft("followup", w.recipient);
      await approve(cool);
      await workTick(deps);
      assert.equal(await state(cool), "blocked");
      const tampered = await draft();
      await approve(tampered);
      await pool.query(
        "UPDATE work_items SET body='Changed approved message' WHERE id=$1",
        [tampered.id],
      );
      await workTick(deps);
      assert.equal(await state(tampered), "blocked");
      const changed = await draft();
      await approve(changed);
      await pool.query(
        "UPDATE work_items SET approved_account_id='different' WHERE id=$1",
        [changed.id],
      );
      await workTick(deps);
      assert.equal(await state(changed), "blocked");
      const suppressed = await draft();
      await approve(suppressed);
      await pool.query(
        "INSERT INTO suppressed_contacts VALUES($1,'test',now())",
        [suppressed.recipient],
      );
      await workTick(deps);
      assert.equal(await state(suppressed), "blocked");
      const replied = await draft("followup");
      await approve(replied);
      behavior = "reply";
      await workTick(deps);
      assert.equal(await state(replied), "blocked");
      assert.equal(calls.at(-1), "GMAIL_FETCH_EMAILS");
      const conflict = await draft("meeting");
      await approve(conflict);
      behavior = "conflict";
      await workTick(deps);
      assert.equal(await state(conflict), "blocked");
      assert.equal(calls.at(-1), "GOOGLECALENDAR_FIND_EVENT");
      const meeting = await draft("meeting");
      await approve(meeting);
      behavior = "success";
      await workTick(deps);
      assert.equal(await state(meeting), "scheduled");
      const unknown = await draft();
      await approve(unknown);
      behavior = "throw";
      await workTick(deps);
      assert.equal(await state(unknown), "unknown");
      const n = calls.length;
      await workTick(deps);
      assert.equal(calls.length, n, "ambiguous send cannot auto-retry");
      const interrupted = await draft();
      await pool.query(
        "UPDATE work_items SET status='sending',updated_at=now()-interval '3 minutes' WHERE id=$1",
        [interrupted.id],
      );
      await workTick(deps);
      assert.equal(await state(interrupted), "unknown");
      const cancelled = await draft();
      await approve(cancelled);
      const race = {
        ...deps,
        account: async () => {
          await pool.query(
            "UPDATE work_items SET status='cancelled' WHERE id=$1",
            [cancelled.id],
          );
          return { accountId: "account-fixture", userId: "owner-fixture" };
        },
      };
      await workTick(race);
      assert.equal(await state(cancelled), "cancelled");
      assert.equal(calls.length, n, "cancel before dispatch holds effect");
      const malformed = await draft();
      await approve(malformed);
      await workTick({
        ...deps,
        execute: async () => ({ successful: true, data: {} }),
      });
      assert.equal(
        await state(malformed),
        "unknown",
        "success without a receipt is not confirmed delivery",
      );
      const held = await draft();
      await approve(held);
      for (let i = 0; i < 10; i++) {
        const item = await draft();
        await pool.query("UPDATE work_items SET status='sent' WHERE id=$1", [
          item.id,
        ]);
      }
      await workTick(deps);
      assert.equal(
        await state(held),
        "approved",
        "daily cap holds pending work without dispatch",
      );
      const { validateExtraction, acceptProfileImport } =
        await import("../lib/profile-import");
      const raw =
        "Test Owner\nowner@example.com\nSenior engineer\nBuilds tested software systems for product teams.\nTypeScript";
      const facts = [
        ["name", "Test Owner"],
        ["email", "owner@example.com"],
        ["headline", "Senior engineer"],
        ["summary", "Builds tested software systems for product teams."],
        ["skill", "TypeScript"],
      ].map(([field, value]) => ({ field, value, quote: value }));
      const preview = validateExtraction(raw, { facts, warnings: [] });
      const importId = randomUUID();
      await pool.query(
        "INSERT INTO profile_imports(id,source_hash,raw_text,preview,status) VALUES($1,$2,$3,$4,'ready')",
        [importId, randomUUID(), raw, JSON.stringify(preview)],
      );
      assert.deepEqual(
        (await pool.query("SELECT profile FROM settings")).rows[0].profile,
        {},
        "preview never overwrites profile",
      );
      await acceptProfileImport(importId);
      assert.equal(
        (await pool.query("SELECT profile FROM settings")).rows[0].profile.name,
        "Test Owner",
      );
      assert.equal(
        (await pool.query("SELECT count(*)::int n FROM knowledge_documents"))
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
