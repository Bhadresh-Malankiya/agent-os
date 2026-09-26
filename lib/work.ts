import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { pool, transaction, event } from "./db";
import { capabilityAccount, executeProvider } from "./composio";
export const WorkSchema = z.object({
  kind: z.enum(["email", "followup", "meeting"]),
  opportunity_id: z.uuid().nullable().optional(),
  recipient: z
    .union([z.email(), z.literal("")])
    .transform((v) => v.toLowerCase()),
  title: z
    .string()
    .min(3)
    .max(180)
    .refine((v) => !/[\r\n]/.test(v)),
  body: z.string().min(10).max(10000),
  due_at: z.iso.datetime({ offset: true }).nullable().optional(),
  minutes: z.number().int().min(15).max(120).default(30),
});
export function workHash(w: Record<string, any>) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        w.kind,
        w.recipient,
        w.title,
        w.body,
        w.due_at ? new Date(w.due_at).toISOString() : null,
        w.minutes,
      ]),
    )
    .digest("hex");
}
export async function createWork(input: unknown) {
  const w = WorkSchema.parse(input);
  if (
    w.kind === "meeting" &&
    (!w.due_at || new Date(w.due_at).getTime() < Date.now())
  )
    throw new Error("Choose a future meeting time with a timezone.");
  const result = await pool.query(
    "INSERT INTO work_items(id,opportunity_id,kind,recipient,title,body,due_at,minutes) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING RETURNING id",
    [
      randomUUID(),
      w.opportunity_id ?? null,
      w.kind,
      w.recipient,
      w.title,
      w.body,
      w.due_at ?? null,
      w.minutes,
    ],
  );
  await event(
    "work",
    "Saved a review-only outreach or meeting draft. Nothing sent.",
  );
  return { ok: true, duplicate: !result.rowCount };
}
export async function approveWork(id: string, hash: string) {
  return transaction(async (db) => {
    const w = (
      await db.query("SELECT * FROM work_items WHERE id=$1 FOR UPDATE", [id])
    ).rows[0];
    if (!w || w.status !== "draft" || hash !== workHash(w))
      throw new Error(
        "Draft changed or already handled. Refresh before approving.",
      );
    if (!z.email().safeParse(w.recipient).success)
      throw new Error("Add a verified recipient email before approving.");
    const approvedAccount = await capabilityAccount(
      w.kind === "meeting" ? "calendar" : "outreach",
    );
    if (!approvedAccount)
      throw new Error("Connect the required account before approving.");
    if (
      (
        await db.query("SELECT 1 FROM suppressed_contacts WHERE email=$1", [
          w.recipient,
        ])
      ).rowCount
    )
      throw new Error("This contact is suppressed.");
    await db.query(
      "UPDATE work_items SET approval_hash=$2,approved_account_id=$3,status='approved',updated_at=now() WHERE id=$1",
      [id, hash, approvedAccount.accountId],
    );
    await event(
      "approval",
      `Owner approved exact ${w.kind} payload ${id}.`,
      db,
    );
    return { ok: true };
  });
}
export type WorkDeps = {
  account: typeof capabilityAccount;
  execute: typeof executeProvider;
};
const defaultDeps: WorkDeps = {
  account: capabilityAccount,
  execute: executeProvider,
};
export async function workTick(deps: WorkDeps = defaultDeps) {
  const lease = await pool.connect();
  const interrupted = () => {};
  lease.on("error", interrupted);
  let w: any;
  let dispatched = false;
  try {
    if (
      !(await lease.query("SELECT pg_try_advisory_lock(8917344) locked"))
        .rows[0].locked
    )
      return false;
    const setting = (await lease.query("SELECT * FROM settings WHERE id=true"))
      .rows[0];
    if (
      !setting.autopilot ||
      !setting.access_confirmed ||
      setting.workspace_mode !== "outreach"
    )
      return false;
    await lease.query(
      "UPDATE work_items SET status='unknown',error='Worker interrupted after dispatch. Reconcile with provider; never auto-retry.',updated_at=now() WHERE status='sending' AND updated_at<now()-interval '2 minutes'",
    );
    w = (
      await lease.query(
        "SELECT * FROM work_items WHERE status='approved' AND (kind='meeting' OR due_at IS NULL OR due_at<=now()) ORDER BY created_at LIMIT 1",
      )
    ).rows[0];
    if (!w) return false;
    if (w.approval_hash !== workHash(w))
      throw new Error("Approved payload no longer matches");
    if (
      (
        await lease.query("SELECT 1 FROM suppressed_contacts WHERE email=$1", [
          w.recipient,
        ])
      ).rowCount
    )
      throw new Error("Contact suppressed");
    const recent = (
      await lease.query(
        "SELECT count(*)::int n FROM work_items WHERE recipient=$1 AND status IN ('sent','manual_sent','scheduled','sending','unknown') AND updated_at>now()-interval '7 days'",
        [w.recipient],
      )
    ).rows[0].n;
    if (recent && w.kind !== "meeting")
      throw new Error("Seven-day contact cooldown; no duplicate outreach");
    const daily = (
      await lease.query(
        "SELECT count(*)::int n FROM work_items WHERE status IN ('sent','manual_sent','scheduled','sending','unknown') AND updated_at>=date_trunc('day',now())",
      )
    ).rows[0].n;
    if (daily >= 10) return false;
    const account = await deps.account(
      w.kind === "meeting" ? "calendar" : "outreach",
    );
    if (!account) throw new Error("Required account disconnected");
    if (account.accountId !== w.approved_account_id)
      throw new Error("Connected account changed; approval must be renewed");
    if (w.kind === "followup") {
      const reply = await deps.execute("GMAIL_FETCH_EMAILS", account, {
        user_id: "me",
        query: `from:${w.recipient} newer_than:30d`,
        max_results: 1,
        include_payload: false,
      });
      const messages = (reply.data as any)?.messages;
      if (!reply.successful || !Array.isArray(messages))
        throw new Error("Could not verify reply status; follow-up held");
      if (messages.length)
        throw new Error("Reply found; follow-up stopped for review");
    }
    if (w.kind === "meeting") {
      const start = new Date(w.due_at),
        end = new Date(start.getTime() + w.minutes * 60000);
      if (start.getTime() < Date.now())
        throw new Error("Meeting time has passed");
      const found = await deps.execute("GOOGLECALENDAR_FIND_EVENT", account, {
        calendar_id: "primary",
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        max_results: 100,
        single_events: true,
      });
      const items = (found.data as any)?.items;
      if (
        !found.successful ||
        !Array.isArray(items) ||
        (found.data as any)?.nextPageToken
      )
        throw new Error("Calendar availability could not be verified");
      if (
        items.some(
          (e: any) =>
            e.status !== "cancelled" && e.transparency !== "transparent",
        )
      )
        throw new Error("Calendar conflict; meeting held");
    }
    // Commit dispatch before the network call. Unknown delivery is never retried automatically.
    const claimed = await lease.query(
      "UPDATE work_items SET status='sending',updated_at=now() WHERE id=$1 AND status='approved' AND approval_hash=$2 AND NOT EXISTS(SELECT 1 FROM suppressed_contacts WHERE email=$3) AND EXISTS(SELECT 1 FROM settings WHERE id=true AND autopilot AND access_confirmed AND workspace_mode='outreach') RETURNING id",
      [w.id, workHash(w), w.recipient],
    );
    if (!claimed.rowCount) return false;
    dispatched = true;
    const args =
      w.kind === "meeting"
        ? {
            calendar_id: "primary",
            summary: w.title,
            description: w.body,
            start_datetime: new Date(w.due_at).toISOString().slice(0, 19),
            timezone: "UTC",
            event_duration_hour: Math.floor(w.minutes / 60),
            event_duration_minutes: w.minutes % 60,
            attendees: [w.recipient],
            send_updates: true,
            create_meeting_room: false,
          }
        : {
            user_id: "me",
            recipient_email: w.recipient,
            subject: w.title,
            body: w.body,
            is_html: false,
          };
    const result = await deps.execute(
      w.kind === "meeting" ? "GOOGLECALENDAR_CREATE_EVENT" : "GMAIL_SEND_EMAIL",
      account,
      args,
    );
    const id = (result.data as any)?.id;
    if (!result.successful || typeof id !== "string" || !id)
      throw new Error("Provider receipt unavailable");
    await lease.query(
      "UPDATE work_items SET status=$2,provider_id=$3,updated_at=now() WHERE id=$1",
      [w.id, w.kind === "meeting" ? "scheduled" : "sent", id],
    );
    await event(
      "outreach",
      `Provider confirmed ${w.kind} action ${w.id}. Receipt stored.`,
      lease,
    );
    return true;
  } catch (e) {
    if (w)
      await lease
        .query(
          "UPDATE work_items SET status=$2,error=$3,updated_at=now() WHERE id=$1",
          [
            w.id,
            dispatched ? "unknown" : "blocked",
            dispatched
              ? "Delivery status unknown. Reconcile with provider before any retry."
              : e instanceof Error
                ? e.message
                : "Action held",
          ],
        )
        .catch(() => {});
    return false;
  } finally {
    await lease.query("SELECT pg_advisory_unlock(8917344)").catch(() => {});
    lease.removeListener("error", interrupted);
    lease.release();
  }
}
