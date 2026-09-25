import { randomUUID } from "node:crypto";
import { pool, transaction, event } from "./db";
import {
  ProfileSchema,
  OpportunitySchema,
  profileHash,
  presenceContent,
  learningSummary,
} from "./domain";
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
  ] = await Promise.all([
    pool.query(
      "SELECT profile,autopilot,daily_limit,ai_assist FROM settings WHERE id=true",
    ),
    pool.query(
      "SELECT * FROM opportunities ORDER BY created_at DESC LIMIT 300",
    ),
    pool.query(
      "SELECT r.*,o.title FROM runs r LEFT JOIN opportunities o ON o.id=r.opportunity_id ORDER BY created_at DESC LIMIT 100",
    ),
    pool.query("SELECT * FROM artifacts ORDER BY created_at DESC LIMIT 100"),
    pool.query("SELECT * FROM decisions ORDER BY created_at DESC LIMIT 100"),
    pool.query("SELECT * FROM events ORDER BY id DESC LIMIT 40"),
    pool.query("SELECT * FROM feedback ORDER BY created_at DESC"),
    pool.query("SELECT heartbeat FROM worker_health WHERE id=true"),
    pool.query(
      "SELECT o.source,o.country,f.outcome,count(*)::int count FROM feedback f JOIN opportunities o ON o.id=f.opportunity_id WHERE NOT o.sample GROUP BY o.source,o.country,f.outcome",
    ),
    pool.query("SELECT * FROM sources ORDER BY company"),
  ]);
  return {
    settings: settings.rows[0],
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
    version: "0.1.0",
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
    const count = (
      await db.query(
        "SELECT count(*)::int count FROM runs WHERE created_at>=date_trunc('day',now())",
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
