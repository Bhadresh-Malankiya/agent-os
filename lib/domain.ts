import { createHash } from "node:crypto";
import { z } from "zod";
export const ProfileSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.email(),
  headline: z.string().min(5).max(250),
  location: z.string().max(120),
  summary: z.string().min(20).max(5000),
  skills: z.array(z.string().min(1).max(60)).min(1).max(80),
  evidence: z.array(z.string().max(1000)).max(30).default([]),
  website: z.union([z.url(), z.literal("")]).default(""),
  source: z.string().max(500).default("Owner supplied"),
  projects: z.array(z.string().max(3000)).max(30).optional(),
  experience: z.array(z.string().max(3000)).max(20).optional(),
  targetRoles: z.array(z.string().max(120)).max(20).default([]),
});
export type Profile = z.infer<typeof ProfileSchema>;
export const OpportunitySchema = z.object({
  kind: z.enum(["job", "client"]),
  title: z.string().min(3).max(180),
  company: z.string().min(2).max(160),
  country: z.string().min(2).max(120),
  source: z.string().min(2).max(120),
  url: z
    .union([z.url().refine((v) => /^https?:\/\//.test(v)), z.literal("")])
    .default(""),
  description: z.string().min(30).max(15000),
});
export type Opportunity = z.infer<typeof OpportunitySchema> & {
  id: string;
  sample?: boolean;
};
export function profileHash(profile: Profile) {
  return createHash("sha256")
    .update(JSON.stringify(ProfileSchema.parse(profile)))
    .digest("hex");
}
export function assess(profile: Profile, opportunity: Opportunity) {
  const text = `${opportunity.title} ${opportunity.description}`.toLowerCase();
  const matches = profile.skills.filter((s) => text.includes(s.toLowerCase()));
  const score = Math.min(95, 35 + matches.length * 9);
  return {
    score,
    matches,
    reasons: [
      ...matches.map((s) => `Your profile includes ${s}`),
      "Deterministic skills overlap; not a hiring probability.",
      "Compensation, work authorization and location requirements need owner verification.",
    ],
  };
}
export function packageContent(profile: Profile, opportunity: Opportunity) {
  const { matches } = assess(profile, opportunity);
  return `# ${profile.name}\n${profile.headline}\n${profile.location} · ${profile.email}\n${profile.website}\n\n## Application brief\nTarget: ${opportunity.title} at ${opportunity.company}\nSource: ${opportunity.source}${opportunity.sample ? " (synthetic demonstration)" : ""}\n\n## Professional summary\n${profile.summary}\n\n## Relevant skills\n${(matches.length ? matches : profile.skills.slice(0, 8)).join(" · ")}\n\n## Evidence supplied by the owner\n${profile.evidence.map((v) => "- " + v).join("\n")}\n\n## ${opportunity.kind === "client" ? "Proposal introduction" : "Cover note"}\nHello ${opportunity.company} team,\n\nI am interested in ${opportunity.title}. ${profile.summary}\n\n${opportunity.kind === "client" ? "I would welcome a discovery discussion to confirm scope, delivery milestones and acceptance criteria before quoting a fee." : "I would welcome a conversation about the team’s technical priorities and where my experience may contribute."}\n\nRegards,\n${profile.name}\n\n## Review before sending\nConfirm compensation, availability, work authorization, company identity and every factual claim. This package is a deterministic draft, not an AI assessment or a submitted application.\n\nProfile provenance: ${profile.source}\nProfile revision: ${profileHash(profile)}\n`;
}
export function presenceContent(profile: Profile, platform: string) {
  const evidence = profile.evidence
    .slice(0, 5)
    .map((v) => "- " + v)
    .join("\n");
  const note = `\n\nDraft only. Review existing profile and platform limits before publishing. Nothing was uploaded.\nFact source: ${profile.source}`;
  if (platform === "LinkedIn")
    return (
      `# LinkedIn profile draft\n\n## Headline (up to 220 characters)\n${profile.headline.slice(0, 220)}\n\n## About\n${profile.summary.slice(0, 2200)}\n\nSelected experience:\n${evidence}\n\n## Featured\nPortfolio: ${profile.website}\n\n## Skills to prioritize\n${profile.skills.slice(0, 15).join(" · ")}` +
      note
    );
  if (platform === "GitHub")
    return (
      `# Hi, I’m ${profile.name}\n\n${profile.headline}\n\n${profile.summary}\n\n## What I work with\n${profile.skills.map((s) => "\x60" + s + "\x60").join(" ")}\n\n## Experience behind the code\n${evidence}\n\n## Find my work\n${profile.website}\n\nRepository showcase: choose 3 public repositories you own and add real demo links; no repository links have been invented.` +
      note
    );
  if (platform === "Upwork")
    return (
      `# Upwork profile draft\n\n## Title (up to 70 characters)\n${profile.headline.slice(0, 70)}\n\n## Overview\n${profile.summary}\n\nHow I can contribute:\n${profile.skills
        .slice(0, 6)
        .map((s) => "- Work involving " + s)
        .join(
          "\n",
        )}\n\nRelevant experience:\n${evidence}\n\nBefore starting a project, let’s confirm the business goal, current system, scope and acceptance criteria.\n\n## Skills\n${profile.skills.slice(0, 15).join(", ")}\n\n## Details for you to set\nHourly rate, weekly availability, client references and contract terms are not known and have not been invented.` +
      note
    );
  return (
    `# Portfolio content draft\n\n## Hero\n${profile.name}\n${profile.headline}\n\n## About\n${profile.summary}\n\n## Evidence to feature\n${evidence}\n\n## Technical capabilities\n${profile.skills.join(" · ")}\n\n## Case-study outline\nFor each real project: problem → your exact responsibility → implementation → evidence-backed result → public demo. Remove confidential client details.\n\n## Contact\n${profile.email}\n${profile.website}` +
    note
  );
}
export function learningSummary(
  rows: { source: string; country: string; outcome: string; count: number }[],
) {
  return rows.map((row) => ({
    ...row,
    interpretation:
      row.count < 30
        ? "Insufficient sample; observe only."
        : "Descriptive signal only; requires controlled evaluation before a strategy change.",
  }));
}
