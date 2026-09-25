import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ProfileSchema,
  OpportunitySchema,
  assess,
  packageContent,
  profileHash,
  learningSummary,
} from "../lib/domain";
const profile = ProfileSchema.parse({
  name: "Alex Example",
  email: "alex@example.com",
  headline: "Software engineer",
  location: "Remote",
  summary: "Builds and maintains reliable software systems.",
  skills: ["TypeScript", "PostgreSQL"],
  evidence: ["Built an internal reporting application."],
  website: "https://example.com",
});
const opportunity = {
  id: "test",
  ...OpportunitySchema.parse({
    kind: "job",
    title: "Software engineer",
    company: "Example Inc",
    country: "Remote",
    source: "Fixture",
    description: "Build TypeScript applications and PostgreSQL data systems.",
  }),
};
test("validates profile facts and rejects invalid email", () =>
  assert.equal(
    ProfileSchema.safeParse({ ...profile, email: "bad" }).success,
    false,
  ));
test("rejects executable opportunity URLs", () =>
  assert.equal(
    OpportunitySchema.safeParse({ ...opportunity, url: "javascript:alert(1)" })
      .success,
    false,
  ));
test("matching is deterministic and explicitly not a hiring probability", () => {
  const a = assess(profile, opportunity);
  assert.deepEqual(a.matches, ["TypeScript", "PostgreSQL"]);
  assert.ok(a.reasons.some((r) => r.includes("not a hiring probability")));
});
test("draft carries source evidence, revision, and unsent status", () => {
  const content = packageContent(profile, opportunity);
  assert.ok(content.includes(profile.evidence[0]));
  assert.ok(content.includes(profileHash(profile)));
  assert.ok(
    content.includes("not an AI assessment or a submitted application"),
  );
  assert.ok(!content.includes("20 years"));
});
test("profile edits invalidate the content revision", () =>
  assert.notEqual(
    profileHash(profile),
    profileHash({ ...profile, headline: "Updated engineer" }),
  ));
test("small cohorts cannot promote strategies", () =>
  assert.match(
    learningSummary([
      { source: "Fixture", country: "Remote", outcome: "rejected", count: 2 },
    ])[0].interpretation,
    /Insufficient/,
  ));
import { sourceUrl, plainText } from "../lib/sources";
import { validateBrief } from "../lib/codex";
test("source URL construction prevents arbitrary hosts and traversal", () => {
  assert.throws(() => sourceUrl("greenhouse", "../../localhost"));
  assert.equal(new URL(sourceUrl("lever", "example")).hostname, "api.lever.co");
});
test("job descriptions are reduced to text", () =>
  assert.equal(plainText("&lt;p&gt;Hello&lt;/p&gt;"), "Hello"));
test("AI evidence cannot refer to nonexistent profile facts", () =>
  assert.throws(
    () =>
      validateBrief(
        {
          fit_summary: "Potential fit",
          evidence: [{ fact_id: 99, relevance: "invented" }],
          gaps: [],
          questions: [],
          cover_note: "Hello",
        },
        profile,
      ),
    /does not exist/,
  ));
