import { batchTick } from "../lib/batches";
import { prepareOutreachDrafts } from "../lib/outreach";
import { workTick } from "../lib/work";
import { clarifyTick } from "../lib/clarifications";
import { observedLane, activity } from "../lib/activity";
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
import { packageConcurrency, retryDelay, runLane } from "../lib/runtime";
import { pathToFileURL } from "node:url";
const controller = new AbortController();
async function scheduledIntake() {
  await batchTick();
  await prepareOutreachDrafts();
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
        "SELECT * FROM runs WHERE status='queued' AND kind='package' AND next_attempt_at<=now() ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",
      )
    ).rows[0];
    if (!run) return false;
    await db.query("SAVEPOINT package_effects");
    try {
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
    } catch {
      await db.query("ROLLBACK TO SAVEPOINT package_effects");
      const attempts = run.attempts + 1;
      const failed = attempts >= 3;
      await db.query(
        "UPDATE runs SET attempts=$2,status=$3,error=$4,next_attempt_at=now()+$5*interval '1 second',updated_at=now() WHERE id=$1",
        [
          run.id,
          attempts,
          failed ? "failed" : "queued",
          failed
            ? "Local preparation failed after 3 attempts. Review this opportunity."
            : "Local preparation interrupted; retry scheduled.",
          retryDelay(attempts),
        ],
      );
      if (failed)
        await db.query(
          "INSERT INTO decisions(id,opportunity_id,kind,title,detail) VALUES($1,$2,'workflow-failure','A preparation workflow needs attention','Three attempts failed. Check the opportunity and worker logs. No partial package or external action was committed.') ON CONFLICT DO NOTHING",
          [randomUUID(), run.opportunity_id],
        );
      return true;
    }
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.on("SIGTERM", () => controller.abort());
  process.on("SIGINT", () => controller.abort());
  console.log(
    "Agent OS continuous worker started. Intake, preparation and AI run independently.",
  );
  await activity(
    "Preparer",
    "waiting",
    "Waiting for queued application packages.",
  );
  const signal = controller.signal;
  const report = (lane: string) => () =>
    console.error(`${lane} interrupted; next bounded pass will reconnect.`);
  await Promise.all([
    runLane(
      () =>
        observedLane(
          "Coordinator",
          "Checking approved outreach and calendar work",
          workTick,
        ),
      signal,
      60000,
      report("Outreach"),
    ),
    runLane(
      async () => {
        const settings = (
          await pool.query("SELECT * FROM settings WHERE id=true")
        ).rows[0];
        const concurrency = packageConcurrency(settings.execution_mode);
        await pool.query(
          "INSERT INTO worker_health(id,detail) VALUES(true,$1) ON CONFLICT(id) DO UPDATE SET heartbeat=now(),detail=$1",
          [
            JSON.stringify({
              mode: settings.execution_mode,
              package_concurrency: concurrency,
              ai_concurrency: 1,
              source_concurrency: 1,
              ai_daily_limit: settings.ai_daily_limit,
            }),
          ],
        );
      },
      signal,
      5000,
      report("Heartbeat"),
    ),
    runLane(
      () =>
        observedLane(
          "Scout",
          "Checking due sources and queuing eligible opportunities",
          scheduledIntake,
        ),
      signal,
      10000,
      report("Intake"),
    ),
    runLane(
      async () => {
        const settings = (
          await pool.query(
            "SELECT execution_mode,autopilot FROM settings WHERE id=true",
          )
        ).rows[0];
        if (!settings.autopilot) return;
        const ready = (
          await pool.query(
            "SELECT EXISTS(SELECT 1 FROM runs WHERE status='queued' AND kind='package' AND next_attempt_at<=now()) ready",
          )
        ).rows[0].ready;
        if (!ready) return;
        await observedLane(
          "Preparer",
          "Preparing queued application packages",
          () =>
            Promise.all(
              Array.from(
                { length: packageConcurrency(settings.execution_mode) },
                () => tick(),
              ),
            ),
        );
      },
      signal,
      500,
      report("Preparation"),
    ),
    runLane(
      () =>
        observedLane(
          "Analyst",
          "Checking eligible briefs and AI limits",
          aiTick,
        ),
      signal,
      5000,
      report("AI"),
    ),
    runLane(
      () =>
        observedLane(
          "Resolver",
          "Checking saved evidence for unanswered facts",
          clarifyTick,
        ),
      signal,
      10000,
      report("Clarification"),
    ),
  ]);
  await pool.end();
}
