import { test } from "node:test";
import assert from "node:assert/strict";
import { validateExtraction } from "../lib/profile-import";
import { WorkSchema, workHash } from "../lib/work";
test("pasted facts preserve projects and reject invented quotes or claims", () => {
  const raw =
    "Alex Example\nalex@example.com\nSenior frontend engineer\nBuilds accessible products with engineering teams.\nReact\nProject Atlas: built a reusable UI library.";
  const facts = [
    ["name", "Alex Example"],
    ["email", "alex@example.com"],
    ["headline", "Senior frontend engineer"],
    ["summary", "Builds accessible products with engineering teams."],
    ["skill", "React"],
    ["project", "Project Atlas: built a reusable UI library."],
  ].map(([field, value]) => ({ field, value, quote: value }));
  const preview = validateExtraction(raw, { facts, warnings: [] });
  assert.deepEqual(preview.missing, []);
  assert.equal(preview.profile.projects.length, 1);
  assert.throws(
    () =>
      validateExtraction(raw, {
        facts: [
          {
            field: "evidence",
            value: "Increased revenue 40%",
            quote: "Increased revenue 40%",
          },
        ],
        warnings: [],
      }),
    /quote missing/,
  );
  assert.throws(
    () =>
      validateExtraction(raw, {
        facts: [{ field: "name", value: "CEO", quote: "Alex Example" }],
        warnings: [],
      }),
    /value did not match/,
  );
  assert.ok(
    validateExtraction("Alex Example", {
      facts: [facts[0]],
      warnings: [],
    }).missing.includes("email"),
  );
});
test("approval hashes include every external payload field and normalize equivalent timezones", () => {
  const w = WorkSchema.parse({
    kind: "meeting",
    recipient: "OWNER@EXAMPLE.COM",
    title: "Review work",
    body: "Discuss the project plan.",
    due_at: "2027-01-01T12:00:00Z",
  });
  assert.equal(w.recipient, "owner@example.com");
  assert.equal(
    workHash(w),
    workHash({ ...w, due_at: "2027-01-01T17:30:00+05:30" }),
  );
  for (const [key, value] of Object.entries({
    recipient: "other@example.com",
    title: "Different title",
    body: "Different content",
    minutes: 60,
    kind: "email",
    due_at: null,
  }))
    assert.notEqual(workHash(w), workHash({ ...w, [key]: value }));
  assert.throws(() => WorkSchema.parse({ ...w, title: "Header\r\ninjection" }));
});

import { draftMessage } from "../lib/text";
test("outreach reuse excludes internal evidence and audit sections", () => {
  assert.equal(
    draftMessage(
      "# Profile\nPrivate evidence\n\n## Cover note\nHello team.\n\n## Review before sending\nInternal checks",
    ),
    "Hello team.",
  );
  assert.equal(
    draftMessage(
      "## Suggested cover note\nHello.\n\nAI-assisted draft. Review every claim.",
    ),
    "Hello.",
  );
  assert.equal(draftMessage("# Profile only\nInternal content"), "");
});
