import { aiTick } from "./ai-worker";
import { syncSource } from "../lib/sources";
import { queuePackage } from "../lib/service";
import { randomUUID } from "node:crypto";
import { pool, transaction, event } from "../lib/db";
import {
  ProfileSchema,
  assess,
  packageContent,
  profileHash,
} from "../lib/domain";
let stopping = false;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});
async function scheduledIntake() {
  const settings = (await pool.query("SELECT * FROM settings WHERE id=true"))
    .rows[0];
  if (!settings.autopilot) return;
  const due = (
    await pool.query(
      "SELECT id FROM sources WHERE enabled AND (last_sync IS NULL OR last_sync<now()-interval '6 hours') ORDER BY last_sync NULLS FIRST LIMIT 1",
    )
  ).rows[0];
  if (due) {
    try {
      await syncSource(due.id);
    } catch {
      await event(
        "source",
        "A job source needs attention. Check its status in Connections.",
      );
    }
  }
  if (!ProfileSchema.safeParse(settings.profile).success) return;
  const next = (
    await pool.query(
      "SELECT o.id FROM opportunities o WHERE NOT sample AND status='new' AND NOT EXISTS(SELECT 1 FROM runs r WHERE r.opportunity_id=o.id) ORDER BY created_at LIMIT 1",
    )
  ).rows[0];
  if (next) {
    try {
      await queuePackage(next.id);
    } catch {
      /* Daily limit is enforced by the same transaction as manual queues. */
    }
  }
}
export async function tick() {
  await pool.query(
    "INSERT INTO worker_health(id) VALUES(true) ON CONFLICT(id) DO UPDATE SET heartbeat=now()",
  );
  return transaction(async (db) => {
    const settings = (await db.query("SELECT * FROM settings WHERE id=true"))
      .rows[0];
    if (!settings.autopilot) return false;
    // Work is local and transactional. A crashed transaction rolls back and can be retried safely.
    const run = (
      await db.query(
        "SELECT * FROM runs WHERE status='queued' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",
      )
    ).rows[0];
    if (!run) return false;
    const profile = ProfileSchema.safeParse(settings.profile);
    if (!profile.success) {
      await db.query(
        "UPDATE runs SET status='failed',error='Complete your profile before running',updated_at=now() WHERE id=$1",
        [run.id],
      );
      return true;
    }
    const opportunity = (
      await db.query("SELECT * FROM opportunities WHERE id=$1", [
        run.opportunity_id,
      ])
    ).rows[0];
    const fit = assess(profile.data, opportunity);
    await db.query(
      "UPDATE opportunities SET score=$2,reasons=$3,status=$4 WHERE id=$1",
      [opportunity.id, fit.score, JSON.stringify(fit.reasons), "prepared"],
    );
    await db.query(
      "INSERT INTO artifacts(id,opportunity_id,kind,title,content,profile_hash) VALUES($1,$2,$3,$4,$5,$6)",
      [
        randomUUID(),
        opportunity.id,
        "package",
        `${opportunity.title} — ${opportunity.company}`,
        packageContent(profile.data, opportunity),
        profileHash(profile.data),
      ],
    );
    await db.query(
      "INSERT INTO decisions(id,opportunity_id,kind,title,detail) VALUES($1,$2,'submission',$3,$4) ON CONFLICT DO NOTHING",
      [
        randomUUID(),
        opportunity.id,
        `Review ${opportunity.company} package`,
        opportunity.sample
          ? "Synthetic demo: review the generated package. No real employer or client will be contacted."
          : "Confirm this role, compensation, availability and work authorization. This release prepares drafts; submission must be completed manually. Recording an answer does not send this application.",
      ],
    );
    const steps = [
      "Validated owner profile",
      "Matched skills without model tokens",
      "Prepared evidence-linked draft",
      "Created review item; nothing sent",
    ];
    await db.query(
      "UPDATE runs SET status='completed',steps=$2,attempts=attempts+1,updated_at=now() WHERE id=$1",
      [run.id, JSON.stringify(steps)],
    );
    await event("run", `Prepared package for ${opportunity.company}.`, db);
    return true;
  });
}
if (process.argv[1]?.endsWith("worker.ts")) {
  console.log("Agent OS local worker started (no external sending).");
  const heartbeat = setInterval(() => {
    pool
      .query(
        "INSERT INTO worker_health(id) VALUES(true) ON CONFLICT(id) DO UPDATE SET heartbeat=now()",
      )
      .catch(() => {});
  }, 5000);
  while (!stopping) {
    try {
      await scheduledIntake();
      await tick();
      await aiTick();
    } catch {
      console.error(
        "Worker tick failed; retrying in 5 seconds. Run npm run doctor.",
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  clearInterval(heartbeat);
  await pool.end();
}
