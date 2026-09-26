import { randomUUID } from "node:crypto";
import { z } from "zod";
import { pool, event, transaction } from "./db";
import { draftMessage } from "./text";
import { WorkSchema, workHash } from "./work";
export async function prepareOutreachDrafts() {
  const settings = (
    await pool.query("SELECT profile,autopilot FROM settings WHERE id=true")
  ).rows[0];
  if (!settings?.autopilot) return 0;
  const rows = (
    await pool.query(
      `SELECT DISTINCT ON(o.id) o.id,o.title,o.company,o.kind,a.id artifact_id,a.content FROM opportunities o JOIN artifacts a ON a.opportunity_id=o.id WHERE NOT o.sample AND a.kind IN ('package','ai-brief') ORDER BY o.id,(a.kind='ai-brief') DESC,a.created_at DESC`,
    )
  ).rows;
  const profile = settings.profile;
  let created = 0;
  for (const r of rows) {
    const body =
      r.kind === "client" &&
      r.title === "Engineering support — hiring signal" &&
      profile?.name
        ? `Hello ${r.company} team,

I noticed your public engineering hiring activity and wanted to ask whether external engineering support would be useful. ${profile.summary}

If this is relevant, I would welcome a discovery conversation to understand your priorities and scope before discussing an engagement.

Regards,
${profile.name}
${profile.website ?? ""}`
        : draftMessage(r.content);
    if (!body) continue;
    const result = await pool.query(
      `INSERT INTO work_items(id,opportunity_id,kind,recipient,title,body,auto_generated,auto_source_id) VALUES($1,$2,'email','',$3,$4,true,$5) ON CONFLICT DO NOTHING RETURNING id`,
      [
        randomUUID(),
        r.id,
        `${r.title} — ${r.company}`.slice(0, 180),
        body.slice(0, 10000),
        r.artifact_id,
      ],
    );
    if (result.rowCount) created++;
    else
      await pool
        .query(
          "UPDATE work_items SET body=$2,auto_source_id=$3,updated_at=now() WHERE opportunity_id=$1 AND auto_generated AND status='draft' AND NOT draft_edited AND (auto_source_id IS DISTINCT FROM $3 OR body IS DISTINCT FROM $2)",
          [r.id, body.slice(0, 10000), r.artifact_id],
        )
        .catch((error) => {
          if (error.code !== "23505") throw error;
        });
  }
  if (created)
    await event(
      "work",
      `Created ${created} editable outreach drafts. Recipients remain blank until verified; nothing sent.`,
    );
  return created;
}
export async function updateDraft(id: string, input: unknown, hash: string) {
  const w = WorkSchema.parse(input);
  return transaction(async (db) => {
    const old = (
      await db.query("SELECT * FROM work_items WHERE id=$1 FOR UPDATE", [id])
    ).rows[0];
    if (
      !old ||
      old.status !== "draft" ||
      workHash(old) !== hash ||
      old.kind !== w.kind
    )
      throw new Error("Draft changed. Refresh before editing.");
    if (
      w.recipient &&
      (
        await db.query("SELECT 1 FROM suppressed_contacts WHERE email=$1", [
          w.recipient,
        ])
      ).rowCount
    )
      throw new Error(
        "This recipient is suppressed. Choose a contact you may reach.",
      );
    await db.query(
      "UPDATE work_items SET recipient=$2,title=$3,body=$4,due_at=$5,minutes=$6,draft_edited=true,updated_at=now() WHERE id=$1",
      [id, w.recipient, w.title, w.body, w.due_at ?? null, w.minutes],
    );
    return { ok: true, hash: workHash({ ...old, ...w }) };
  });
}
export async function markManualSent(id: string, hash: string) {
  return transaction(async (db) => {
    const w = (
      await db.query("SELECT * FROM work_items WHERE id=$1 FOR UPDATE", [id])
    ).rows[0];
    if (
      !w ||
      w.status !== "draft" ||
      workHash(w) !== hash ||
      w.kind === "meeting" ||
      !z.email().safeParse(w.recipient).success
    )
      throw new Error("Save a valid recipient and unchanged draft first.");
    await db.query(
      "UPDATE work_items SET status='manual_sent',updated_at=now(),draft_edited=true WHERE id=$1",
      [id],
    );
    await event(
      "work",
      `Owner reported sending draft ${id} outside Agent OS. Delivery is unverified.`,
      db,
    );
    return { ok: true };
  });
}
