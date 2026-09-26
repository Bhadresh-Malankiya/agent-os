import { randomUUID } from "node:crypto";
import { pool, event } from "./db";
import { syncSource } from "./sources";
import { addOpportunity, queuePackage } from "./service";
import { ProfileSchema } from "./domain";
import { prepareOutreachDrafts } from "./outreach";
export async function batchTick(sync = syncSource) {
  const lease = await pool.connect();
  const controller = new AbortController();
  const disconnected = () => controller.abort();
  lease.on("error", disconnected);
  let locked = false;
  let id: string | undefined;
  try {
    locked = (await lease.query("SELECT pg_try_advisory_lock(8917350) locked"))
      .rows[0].locked;
    if (!locked) return false;
    const settings = (
      await lease.query(
        "SELECT *,next_batch_at<=now() due FROM settings WHERE id=true",
      )
    ).rows[0];
    if (!settings.autopilot || !settings.due) return false;
    await lease.query(
      "UPDATE outreach_batches SET status='interrupted',finished_at=now(),errors='[\"Worker restarted before batch finished; next batch will deduplicate existing work.\"]' WHERE status='running'",
    );
    id = randomUUID();
    await lease.query(
      "INSERT INTO outreach_batches(id,status) VALUES($1,'running')",
      [id],
    );
    await lease.query(
      "UPDATE settings SET next_batch_at=now()+batch_minutes*interval '1 minute' WHERE id=true",
    );
    let checked = 0,
      added = 0,
      queued = 0;
    const errors: string[] = [];
    const sources = (
      await pool.query(
        "SELECT * FROM sources WHERE enabled ORDER BY last_sync NULLS FIRST,company LIMIT 20",
      )
    ).rows;
    if (!sources.length)
      errors.push(
        "No lead sources are enabled. Add a public careers board in Leads.",
      );
    for (const source of sources) {
      controller.signal.throwIfAborted();
      if (
        !(await pool.query("SELECT autopilot FROM settings WHERE id=true"))
          .rows[0].autopilot
      ) {
        errors.push("Paused by owner.");
        break;
      }
      try {
        const result = await sync(source.id);
        if ("busy" in result && result.busy) {
          errors.push(`${source.company}: source already being checked.`);
          continue;
        }
        added += result.imported;
        checked++;
      } catch {
        errors.push(
          `${source.company}: source check failed; see source status.`,
        );
      }
      controller.signal.throwIfAborted();
      if (settings.client_prospecting) {
        const job = (
          await pool.query(
            "SELECT * FROM opportunities WHERE kind='job' AND source=$1 AND NOT sample ORDER BY created_at DESC LIMIT 1",
            [`${source.provider}:${source.slug}`],
          )
        ).rows[0];
        if (job) {
          const result = await addOpportunity({
            kind: "client",
            company: source.company,
            title: "Engineering support — hiring signal",
            country: job.country,
            source: job.source,
            url: job.url,
            description:
              `Prospecting signal only: ${source.company} has published a role for ${job.title}. This is not a verified contract, budget or request for services. Verify whether external engineering support is relevant before contacting a public business contact.\n\nSource listing:\n${job.description}`.slice(
                0,
                15000,
              ),
          });
          if (result) added++;
        }
      }
      await lease.query(
        "UPDATE outreach_batches SET sources_checked=$2,leads_added=$3 WHERE id=$1",
        [id, checked, added],
      );
    }
    controller.signal.throwIfAborted();
    if (
      ProfileSchema.safeParse(settings.profile).success &&
      (await pool.query("SELECT autopilot FROM settings WHERE id=true")).rows[0]
        .autopilot
    ) {
      const leads = (
        await pool.query(
          "SELECT id FROM opportunities WHERE NOT sample AND status='new' AND NOT EXISTS(SELECT 1 FROM runs WHERE opportunity_id=opportunities.id) ORDER BY created_at DESC LIMIT 200",
        )
      ).rows;
      for (const lead of leads) {
        try {
          const result = await queuePackage(lead.id);
          if (!result.cached && !result.alreadyQueued) queued++;
        } catch {
          errors.push(
            "Preparation stopped at the daily limit or a queue error; remaining leads stay saved.",
          );
          break;
        }
      }
    } else if (!ProfileSchema.safeParse(settings.profile).success)
      errors.push("Paste and accept your profile to generate drafts.");
    else if (!errors.includes("Paused by owner."))
      errors.push("Paused by owner.");
    const drafts = await prepareOutreachDrafts();
    await lease.query(
      "UPDATE outreach_batches SET status=$2,finished_at=now(),sources_checked=$3,leads_added=$4,packages_queued=$5,drafts_created=$6,errors=$7 WHERE id=$1",
      [
        id,
        errors.length ? "completed_with_notes" : "completed",
        checked,
        added,
        queued,
        drafts,
        JSON.stringify(errors),
      ],
    );
    await event(
      "source",
      `Batch finished: ${checked} sources checked, ${added} leads added, ${queued} packages queued, ${drafts} drafts created. ${errors.length} notes.`,
    );
    return true;
  } catch (error) {
    if (id)
      await lease
        .query(
          "UPDATE outreach_batches SET status='failed',finished_at=now(),errors='[\"Batch interrupted by a database or worker error. Existing work is retained.\"]' WHERE id=$1",
          [id],
        )
        .catch(() => {});
    throw error;
  } finally {
    if (locked)
      await lease.query("SELECT pg_advisory_unlock(8917350)").catch(() => {});
    lease.removeListener("error", disconnected);
    lease.release();
  }
}
