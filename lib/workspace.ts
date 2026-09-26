import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { pool, transaction, event } from "./db";
import { capabilityAccount } from "./composio";
export const builtinSkills = [
  {
    name: "Find opportunities",
    agent: "Scout",
    state: "Available",
    description:
      "Checks enabled Greenhouse and Lever sources; deduplicates intake.",
  },
  {
    name: "Prepare applications",
    agent: "Preparer",
    state: "Available",
    description: "Creates truthful local drafts from your profile.",
  },
  {
    name: "Tailor writing",
    agent: "Analyst",
    state: "Available",
    description: "Writes source-linked briefs within the shared AI budget.",
  },
  {
    name: "Resolve known questions",
    agent: "Resolver",
    state: "Available",
    description: "Finds saved evidence and keeps unknown commitments blocked.",
  },
  {
    name: "Email and follow-ups",
    agent: "Coordinator",
    state: "Access required",
    description:
      "Sends exact approved messages; stops on replies, suppression, cooldown or unknown delivery.",
  },
  {
    name: "Calendar invitations",
    agent: "Coordinator",
    state: "Access required",
    description:
      "Checks conflicts and creates approved invitations with provider receipts.",
  },
  {
    name: "Browser applications",
    agent: "Application",
    state: "Not implemented",
    description:
      "Automatic form submission and CAPTCHA handling are unavailable.",
  },
  {
    name: "Outcome learning",
    agent: "Insights",
    state: "Observations only",
    description:
      "Groups recorded results; cannot promote strategies automatically.",
  },
];
export async function confirmAccess(mode: unknown) {
  const value = z.enum(["prepare", "outreach"]).parse(mode);
  if (value === "outreach" && !(await capabilityAccount("outreach")))
    throw new Error(
      "Gmail access is required for outreach mode. Connect it first or use preparation mode.",
    );
  await pool.query(
    "UPDATE settings SET access_confirmed=true,workspace_mode=$1 WHERE id=true",
    [value],
  );
  await event("access", `Owner selected ${value} mode.`);
  return { ok: true };
}
export async function addKnowledge(raw: unknown) {
  const value = z
    .object({
      title: z.string().min(2).max(150),
      content: z.string().min(10).max(60000),
    })
    .parse(raw);
  const hash = createHash("sha256").update(value.content).digest("hex");
  return transaction(async (db) => {
    await db.query(
      "INSERT INTO knowledge_documents(id,title,content,content_hash) VALUES($1,$2,$3,$4) ON CONFLICT(content_hash) DO UPDATE SET active=true",
      [randomUUID(), value.title, value.content, hash],
    );
    await event(
      "knowledge",
      "Saved a private knowledge note; not automatically promoted to verified facts.",
      db,
    );
    return { ok: true };
  });
}
export async function addSkill(raw: unknown) {
  const v = z
    .object({
      name: z.string().min(2).max(80),
      instructions: z.string().min(10).max(1300),
    })
    .parse(raw);
  if (
    (await pool.query("SELECT count(*)::int n FROM custom_skills")).rows[0].n >=
    30
  )
    throw new Error("Keep at most 30 custom writing skills.");
  await pool.query(
    "INSERT INTO custom_skills(id,name,instructions) VALUES($1,$2,$3)",
    [randomUUID(), v.name, v.instructions],
  );
  await event(
    "skill",
    "Added a bounded writing skill. No executable code or permissions installed.",
  );
  return { ok: true };
}
