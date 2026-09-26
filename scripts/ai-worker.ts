import { activity } from "../lib/activity";
import { randomUUID } from "node:crypto";
import { pool, event } from "../lib/db";
import { ProfileSchema, profileHash } from "../lib/domain";
import { briefKey, generateBrief, renderBrief } from "../lib/codex";
export async function aiTick() {
  const db = await pool.connect();
  let runId: string | undefined;
  const modelAbort = new AbortController();
  const abortModel = () => modelAbort.abort();
  db.on("error", abortModel);
  try {
    const lock = await db.query(
      "SELECT pg_try_advisory_lock(8917341) acquired",
    );
    if (!lock.rows[0].acquired) return false;
    const settings = (await db.query("SELECT * FROM settings WHERE id=true"))
      .rows[0];
    if (!settings.autopilot || !settings.ai_assist) return false;
    // A stale inference has no external write to reconcile, but must not consume quota through blind retries.
    await db.query(
      "UPDATE runs SET status='failed',error='Model process interrupted. Retry manually.',updated_at=now() WHERE kind='ai-brief' AND status='running' AND updated_at<now()-interval '5 minutes'",
    );
    const profile = ProfileSchema.parse(settings.profile);
    const count = (
      await db.query(
        "SELECT count(*)::int count FROM runs WHERE kind='ai-brief' AND created_at>=date_trunc('day',now())",
      )
    ).rows[0].count;
    if (count >= settings.ai_daily_limit) return false;
    const failures = (
      await db.query(
        "SELECT count(*)::int n FROM runs WHERE kind='ai-brief' AND status='failed' AND updated_at>now()-interval '30 minutes'",
      )
    ).rows[0].n;
    if (failures >= 3) return false;
    const opportunity = (
      await db.query(
        "SELECT o.* FROM opportunities o WHERE o.status='prepared' AND NOT o.sample AND NOT EXISTS(SELECT 1 FROM runs r WHERE r.opportunity_id=o.id AND r.kind='ai-brief') ORDER BY o.score DESC NULLS LAST LIMIT 1",
      )
    ).rows[0];
    if (!opportunity) return false;
    const key = briefKey(profile, opportunity);
    if (
      (await db.query("SELECT id FROM artifacts WHERE cache_key=$1", [key]))
        .rowCount
    )
      return false;
    runId = randomUUID();
    await db.query(
      "INSERT INTO runs(id,opportunity_id,kind,status,input_snapshot) VALUES($1,$2,'ai-brief','running',$3)",
      [runId, opportunity.id, JSON.stringify({ profile, opportunity })],
    );
    await activity(
      "Analyst",
      "working",
      `Preparing a brief for ${opportunity.company}`,
    );
    const result = await generateBrief(profile, opportunity, {
      signal: modelAbort.signal,
    });
    await db.query("BEGIN");
    await db.query(
      "INSERT INTO artifacts(id,opportunity_id,kind,title,content,profile_hash,cache_key) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING",
      [
        randomUUID(),
        opportunity.id,
        "ai-brief",
        `AI brief — ${opportunity.company}`,
        renderBrief(result.brief, profile),
        profileHash(profile),
        key,
      ],
    );
    if (result.brief.questions.length)
      await db.query(
        "INSERT INTO decisions(id,opportunity_id,kind,title,detail) VALUES($1,$2,'ai-questions',$3,$4) ON CONFLICT DO NOTHING",
        [
          randomUUID(),
          opportunity.id,
          `Questions for ${opportunity.company}`,
          result.brief.questions.map((q, i) => `${i + 1}. ${q}`).join("\n") +
            "\nYour answer is recorded as review context. It does not update profile facts or authorize sending.",
        ],
      );
    const usage = result.usage as {
      input_tokens?: number;
      output_tokens?: number;
    } | null;
    await db.query(
      "UPDATE runs SET status='completed',steps=$2,input_tokens=$3,output_tokens=$4,updated_at=now() WHERE id=$1",
      [
        runId,
        JSON.stringify([
          "Used bounded context with official Codex CLI",
          "Validated evidence references",
          "Saved review-only draft",
        ]),
        usage?.input_tokens ?? null,
        usage?.output_tokens ?? null,
      ],
    );
    await event(
      "ai",
      "AI-assisted opportunity brief prepared. Review factual claims before use.",
      db,
    );
    await db.query("COMMIT");
    return true;
  } catch {
    await db.query("ROLLBACK").catch(() => {});
    if (runId)
      await db.query(
        "UPDATE runs SET status='failed',error='Model generation failed or timed out. Check Codex login and limits. No paid fallback used.',updated_at=now() WHERE id=$1",
        [runId],
      );
    return false;
  } finally {
    await db.query("SELECT pg_advisory_unlock(8917341)").catch(() => {});
    db.removeListener("error", abortModel);
    db.release();
  }
}
