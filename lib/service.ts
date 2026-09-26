import { RELEASE } from "./release";
import { localReadiness } from "./readiness";
import { randomUUID } from "node:crypto";
import { pool, transaction, event } from "./db";
import {
  ProfileSchema,
  OpportunitySchema,
  profileHash,
  presenceContent,
  learningSummary,
} from "./domain";
import { builtinSkills } from "./workspace";
import { workHash } from "./work";
import { agentOverview } from "./agents";
import fixtures from "../fixtures/opportunities.json";
export async function snapshot() {
  const [
    settings,
    opportunities,
    runs,
    artifacts,
    decisions,
    events,
    feedback,
    health,
    learning,
    sources,
    evidence,
    totals,
    activity,
    audit,
    knowledge,
    skills,
    work,
    metrics,
  ] = await Promise.all([
    pool.query(
      "SELECT profile,autopilot,daily_limit,ai_assist,execution_mode,ai_daily_limit,access_confirmed,workspace_mode FROM settings WHERE id=true",
    ),
    pool.query(
      "SELECT * FROM opportunities ORDER BY created_at DESC LIMIT 300",
    ),
    pool.query(
      "SELECT r.*,o.title FROM runs r LEFT JOIN opportunities o ON o.id=r.opportunity_id ORDER BY created_at DESC LIMIT 100",
    ),
    pool.query("SELECT * FROM artifacts ORDER BY created_at DESC LIMIT 100"),
    pool.query(
      "SELECT * FROM decisions ORDER BY (status IN ('open','blocked')) DESC,created_at DESC LIMIT 100",
    ),
    pool.query("SELECT * FROM events ORDER BY id DESC LIMIT 40"),
    pool.query("SELECT * FROM feedback ORDER BY created_at DESC"),
    pool.query("SELECT heartbeat,detail FROM worker_health WHERE id=true"),
    pool.query(
      "SELECT o.source,o.country,f.outcome,count(*)::int count FROM feedback f JOIN opportunities o ON o.id=f.opportunity_id WHERE NOT o.sample GROUP BY o.source,o.country,f.outcome",
    ),
    pool.query("SELECT * FROM sources ORDER BY company"),
    pool.query(`WITH real_runs AS (
      SELECT r.*,row_number() OVER(PARTITION BY r.kind ORDER BY r.created_at DESC,r.id) position
      FROM runs r JOIN opportunities o ON o.id=r.opportunity_id
      WHERE NOT o.sample AND r.created_at>=now()-interval '30 days'
    ) SELECT k.kind,
      count(*) FILTER(WHERE position<=20 AND status='completed')::int completed,
      count(*) FILTER(WHERE position<=20 AND status='failed')::int failed,
      count(*) FILTER(WHERE position<=20 AND attempts>1)::int retried,
      (SELECT count(*)::int FROM runs d WHERE d.kind=k.kind AND d.created_at>=date_trunc('day',now())) today,
      (SELECT count(*)::int FROM runs f WHERE f.kind=k.kind AND f.status='failed' AND f.updated_at>now()-interval '30 minutes') recent_failures,
      (SELECT count(*)::int FROM runs a WHERE a.kind=k.kind AND a.status IN ('queued','running')) active
      FROM (VALUES ('package'),('ai-brief')) k(kind) LEFT JOIN real_runs r ON r.kind=k.kind GROUP BY k.kind`),
    pool.query(`SELECT
      (SELECT count(*)::int FROM decisions WHERE status IN ('open','blocked')) open,
      (SELECT count(*)::int FROM runs WHERE status IN ('queued','running')) queued,
      (SELECT count(*)::int FROM artifacts) drafts`),
    pool.query("SELECT * FROM agent_activity ORDER BY agent"),
    pool.query(
      "SELECT * FROM audit_log ORDER BY created_at DESC,id DESC LIMIT 100",
    ),
    pool.query(
      "SELECT id,title,content,active,created_at FROM knowledge_documents ORDER BY created_at DESC LIMIT 100",
    ),
    pool.query("SELECT * FROM custom_skills ORDER BY created_at DESC"),
    pool.query("SELECT * FROM work_items ORDER BY created_at DESC LIMIT 200"),
    pool.query(`SELECT
      (SELECT count(*)::int FROM runs WHERE kind IN ('ai-brief','profile-import') AND created_at>=date_trunc('day',now())) ai_attempts,
      (SELECT coalesce(sum(input_tokens),0)::bigint FROM runs WHERE created_at>=date_trunc('day',now())) input_tokens,
      (SELECT coalesce(sum(output_tokens),0)::bigint FROM runs WHERE created_at>=date_trunc('day',now())) output_tokens,
      (SELECT count(*)::int FROM runs WHERE kind IN ('ai-brief','profile-import') AND created_at>=date_trunc('day',now()) AND (input_tokens IS NULL OR output_tokens IS NULL)) unmetered_attempts,
      (SELECT count(*)::int FROM opportunities WHERE NOT sample) leads,
      (SELECT count(*)::int FROM opportunities WHERE NOT sample AND created_at>=date_trunc('day',now())) new_today,
      (SELECT count(*)::int FROM work_items WHERE status='sent') sent,
      (SELECT count(*)::int FROM work_items WHERE status='scheduled') meetings,
      (SELECT count(*)::int FROM audit_log WHERE agent='Resolver' AND action='clarify' AND created_at>now()-interval '30 days') resolver_runs,
      (SELECT count(*)::int FROM feedback f JOIN opportunities o ON o.id=f.opportunity_id WHERE NOT o.sample AND outcome IN ('replied','interview','won')) replies`),
  ]);
  return {
    settings: settings.rows[0],
    release: RELEASE,
    readiness: localReadiness({
      profile: settings.rows[0].profile,
      heartbeat: health.rows[0]?.heartbeat,
      autopilot: settings.rows[0].autopilot,
      aiAssist: settings.rows[0].ai_assist,
      aiLimit: settings.rows[0].ai_daily_limit,
      aiAttempts: metrics.rows[0].ai_attempts,
      sources: sources.rows.filter((s) => s.enabled).length,
    }),
    knowledge: knowledge.rows,
    skills: { builtin: builtinSkills, custom: skills.rows },
    work: work.rows.map((w) => ({ ...w, payload_hash: workHash(w) })),
    metrics: metrics.rows[0],
    agents: [
      ...agentOverview({
        settings: settings.rows[0],
        health: health.rows[0] ?? null,
        evidence: evidence.rows,
        sources: sources.rows,
      }),
      {
        id: "resolver",
        name: "Resolver",
        purpose:
          "Finds documented answers and records gaps without inventing facts.",
        status:
          !health.rows[0] ||
          Date.now() - new Date(health.rows[0].heartbeat).getTime() > 20000
            ? "Offline"
            : !settings.rows[0].autopilot
              ? "Paused"
              : "Monitoring",
        level: metrics.rows[0].resolver_runs > 0 ? 1 : 0,
        label: metrics.rows[0].resolver_runs > 0 ? "Observed" : "Unproven",
        progress: metrics.rows[0].resolver_runs,
        target: Math.max(1, metrics.rows[0].resolver_runs),
        detail:
          "Checks saved profile and imported source excerpts. Recent audits show the evidence and missing requirements.",
        next: "Maturity is capped at Observed; recorded context is not independent fact verification.",
        destination: "activity",
      },
    ],
    totals: totals.rows[0],
    activity: activity.rows,
    audit: audit.rows,
    opportunities: opportunities.rows,
    runs: runs.rows,
    artifacts: artifacts.rows,
    decisions: decisions.rows,
    events: events.rows,
    feedback: feedback.rows,
    health: health.rows[0] ?? null,
    learning: learningSummary(learning.rows),
    integrations: {
      composio: !!process.env.COMPOSIO_API_KEY,
      codex: process.env.CODEX_BIN ?? "codex",
    },
    sources: sources.rows,
    mode: "local",
    version: RELEASE.version,
  };
}
export async function saveProfile(input: unknown) {
  const profile = ProfileSchema.parse(input);
  await pool.query(
    "UPDATE settings SET profile=$1,updated_at=now() WHERE id=true",
    [JSON.stringify(profile)],
  );
  await event("profile", "Profile saved. New packages use this revision.");
  return { ok: true };
}
export async function addOpportunity(input: unknown, sample = false) {
  const item = OpportunitySchema.parse(input);
  const result = await pool.query(
    "INSERT INTO opportunities(id,kind,title,company,country,source,url,description,sample) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(kind,company,title) DO NOTHING RETURNING id",
    [
      randomUUID(),
      item.kind,
      item.title,
      item.company,
      item.country,
      item.source,
      item.url,
      item.description,
      sample,
    ],
  );
  return result.rows[0];
}
export async function seedDemo() {
  for (const fixture of fixtures) await addOpportunity(fixture, true);
  await event(
    "demo",
    "Three synthetic opportunities loaded. No real applications or messages will be sent.",
  );
  return { ok: true };
}
export async function queuePackage(id: string) {
  return transaction(async (db) => {
    const settings = (
      await db.query("SELECT * FROM settings WHERE id=true FOR UPDATE")
    ).rows[0];
    ProfileSchema.parse(settings.profile);
    const op = (
      await db.query("SELECT id FROM opportunities WHERE id=$1", [id])
    ).rows[0];
    if (!op) throw new Error("Opportunity not found");
    if (
      (
        await db.query(
          "SELECT id FROM artifacts WHERE opportunity_id=$1 AND kind='package' AND profile_hash=$2",
          [id, profileHash(settings.profile)],
        )
      ).rowCount
    )
      return { ok: true, cached: true };
    if (
      (
        await db.query(
          "SELECT id FROM runs WHERE opportunity_id=$1 AND status IN ('queued','running')",
          [id],
        )
      ).rowCount
    )
      return { ok: true, alreadyQueued: true };
    const count = (
      await db.query(
        "SELECT count(*)::int count FROM runs WHERE kind='package' AND created_at>=date_trunc('day',now())",
      )
    ).rows[0].count;
    if (count >= settings.daily_limit)
      throw new Error(
        "Daily package limit reached. Change the limit in Settings.",
      );
    await db.query(
      "INSERT INTO runs(id,opportunity_id,kind) VALUES($1,$2,'package') ON CONFLICT DO NOTHING",
      [randomUUID(), id],
    );
    await event("queue", "Application package queued.", db);
    return { ok: true };
  });
}
export async function resolveDecision(id: string, answer: string) {
  return transaction(async (db) => {
    const result = await db.query(
      "UPDATE decisions SET status='resolved',answer=$2,resolved_at=now() WHERE id=$1 AND status='open' RETURNING id",
      [id, answer],
    );
    if (!result.rowCount)
      throw new Error("Decision is already resolved or missing");
    await event(
      "decision",
      "Owner answer recorded. No external action was performed.",
      db,
    );
    return { ok: true };
  });
}
export async function generatePresence(platform: string) {
  const profile = ProfileSchema.parse(
    (await pool.query("SELECT profile FROM settings WHERE id=true")).rows[0]
      .profile,
  );
  await pool.query(
    "INSERT INTO artifacts(id,kind,title,content,profile_hash) VALUES($1,$2,$3,$4,$5)",
    [
      randomUUID(),
      "profile",
      `${platform} profile draft`,
      presenceContent(profile, platform),
      profileHash(profile),
    ],
  );
  await event("content", `${platform} copy-ready profile draft prepared.`);
  return { ok: true };
}

export async function editArtifact(id: string, content: string) {
  return transaction(async (db) => {
    const existing = (
      await db.query("SELECT content FROM artifacts WHERE id=$1 FOR UPDATE", [
        id,
      ])
    ).rows[0];
    if (!existing) throw new Error("Draft not found");
    await db.query(
      "INSERT INTO artifact_revisions(id,artifact_id,content) VALUES($1,$2,$3)",
      [randomUUID(), id, existing.content],
    );
    await db.query(
      "UPDATE artifacts SET content=$2,edited_at=now() WHERE id=$1",
      [id, content],
    );
    await event(
      "content",
      "Owner edited a draft; prior text retained in revision history.",
      db,
    );
    return { ok: true };
  });
}
