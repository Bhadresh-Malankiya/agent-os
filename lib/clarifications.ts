import { createHash, randomUUID } from "node:crypto";
import { transaction } from "./db";
import { ProfileSchema, profileHash } from "./domain";
export const topics = {
  ownership: /ownership|end.to.end|extendedforms|quzo|architectur/i,
  performance: /performance|optimi[sz]|caching|load time/i,
  accessibility: /accessibility|wcag|a11y/i,
  components: /reusable|design system|component.*adopt/i,
  cms: /headless|\bcms\b/i,
  clients: /client/i,
  design: /designer|figma|responsive/i,
  ai_validation: /validat.*\bai\b|\bai\b.assisted/i,
  availability: /availability|available|notice period/i,
  fees: /fee|compensation|salary|rate\b/i,
  hours: /overlap|working.hour|timezone/i,
  dates: /employment dates|dates current|current.*employment/i,
  eligibility: /eligib|authoriz|visa|latin america|consider contractors/i,
  wordpress: /wordpress|gutenberg|plugin|theme/i,
  ai: /\bai\b integration|\bai\b.*work|\bai\b.*feature/i,
} as const;
export type Fact = {
  id: string;
  topic: string;
  content: string;
  source: string;
};
export function clarify(detail: string, facts: Fact[]) {
  const body = detail.split(/Your answer (?:is|will)/i)[0];
  const questions = body.match(/[^?]+\?/g)?.slice(0, 20) ?? [body];
  return questions.map((raw) => {
    const question = raw.trim().replace(/^(?:[-*]|\d+\.)\s*/, "");
    const required = Object.entries(topics)
      .filter(([, re]) => re.test(question))
      .map(([key]) => key);
    const evidence = facts
      .filter((f) => required.includes(f.topic))
      .slice(0, 12);
    const missing = required.filter(
      (topic) => !evidence.some((f) => f.topic === topic),
    );
    // Current commitments and legal eligibility must never be inferred from an old portfolio.
    const protectedTopics = required.filter((t) =>
      ["availability", "fees", "hours", "dates", "eligibility"].includes(t),
    );
    const gaps = [...new Set([...missing, ...protectedTopics])];
    if (!required.length)
      gaps.push("No supported evidence category for this question");
    if (
      /verif|substantiat|outcome|adopted|spring|fastapi|angular|azure|english/i.test(
        question,
      )
    )
      gaps.push("Specific claims need corroboration beyond portfolio excerpts");
    return {
      question,
      evidence,
      gaps,
      status: gaps.length ? "blocked" : "documented",
    };
  });
}
export async function clarifyTick() {
  return transaction(async (db) => {
    if (
      !(await db.query("SELECT pg_try_advisory_xact_lock(8917343) acquired"))
        .rows[0].acquired
    )
      return false;
    const settings = (await db.query("SELECT * FROM settings WHERE id=true"))
      .rows[0];
    if (!settings.autopilot) return false;
    const holds = await db.query(
      "UPDATE decisions SET status='blocked',handled_by='System',answer=CASE WHEN kind='submission' THEN 'Application submission is not implemented. Draft saved; no application sent. Other preparation continues.' ELSE 'Provider connection is unavailable. Other preparation continues; no permission bypass attempted.' END WHERE status='open' AND kind IN ('submission','connection') RETURNING id,kind",
    );
    for (const hold of holds.rows)
      await db.query(
        "INSERT INTO audit_log(id,agent,action,entity_id,status,detail) VALUES($1,'Resolver','capability-check',$2,'blocked',$3)",
        [
          randomUUID(),
          hold.id,
          JSON.stringify({ kind: hold.kind, external_effect: false }),
        ],
      );
    const profile = ProfileSchema.safeParse(settings.profile);
    if (!profile.success) return false;
    const saved = (
      await db.query(
        "SELECT id,topic,content,source FROM knowledge_facts WHERE active ORDER BY id",
      )
    ).rows as Fact[];
    const facts = [...saved];
    for (const [i, content] of profile.data.evidence.entries()) {
      for (const [topic, pattern] of Object.entries(topics)) {
        if (
          !["availability", "fees", "hours", "dates", "eligibility"].includes(
            topic,
          ) &&
          pattern.test(content)
        )
          facts.push({
            id: `profile:${i}:${topic}`,
            topic,
            content,
            source: profile.data.source,
          });
      }
    }
    const version = createHash("sha256")
      .update("resolver-v2" + profileHash(profile.data) + JSON.stringify(facts))
      .digest("hex");
    const decision = (
      await db.query(
        "SELECT * FROM decisions WHERE kind IN ('ai-questions','clarification') AND (status IN ('open','blocked') OR handled_by='Resolver') AND resolution_version IS DISTINCT FROM $1 ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED",
        [version],
      )
    ).rows[0];
    if (!decision) return false;
    const results = clarify(decision.detail, facts);
    const blocked = results.some((r) => r.status === "blocked");
    const answer = results
      .map(
        (r) =>
          `${r.question}\n${r.evidence.length ? r.evidence.map((f) => `Portfolio/profile reports: ${f.content}\nSource: ${f.source} [${f.id}]`).join("\n") : "No supporting source found."}\n${r.gaps.length ? "Unresolved: " + r.gaps.join(", ") + ". No answer or commitment invented." : "Documented context assembled automatically; not independently verified."}`,
      )
      .join("\n\n");
    await db.query(
      "UPDATE decisions SET status=$2,answer=$3,handled_by='Resolver',resolution=$4,resolution_version=$5,resolved_at=CASE WHEN $2='resolved' THEN now() ELSE NULL END WHERE id=$1",
      [
        decision.id,
        blocked ? "blocked" : "resolved",
        answer,
        JSON.stringify(results),
        version,
      ],
    );
    await db.query(
      "INSERT INTO audit_log(id,agent,action,entity_id,status,detail) VALUES($1,'Resolver','clarify',$2,$3,$4)",
      [
        randomUUID(),
        decision.id,
        blocked ? "blocked" : "completed",
        JSON.stringify({
          profile_revision: profileHash(profile.data),
          version,
          questions: results.length,
          evidence_ids: [
            ...new Set(results.flatMap((r) => r.evidence.map((f) => f.id))),
          ],
          gaps: results.flatMap((r) => r.gaps),
          external_effect: false,
        }),
      ],
    );
    return true;
  });
}
