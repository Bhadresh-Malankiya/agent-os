import { test } from "node:test";
import assert from "node:assert/strict";
import { clarify } from "../lib/clarifications";
const facts = [
  {
    id: "p1",
    topic: "ownership",
    content: "Owned Example product architecture.",
    source: "Owner portfolio",
  },
  {
    id: "p2",
    topic: "performance",
    content: "Implemented documented caching improvements.",
    source: "Owner portfolio",
  },
];
test("clarification extracts exact evidence while preserving missing compound requirements", () => {
  const result = clarify(
    "- What end-to-end ownership can you describe? - Give performance, accessibility and reusable component examples? Your answer is stored.",
    facts,
  );
  assert.equal(result.length, 2);
  assert.equal(result[0].status, "documented");
  assert.equal(result[0].evidence[0].content, facts[0].content);
  assert.equal(result[1].status, "blocked");
  assert.ok(result[1].gaps.includes("accessibility"));
  assert.ok(result[1].gaps.includes("components"));
});
test("old claims never establish current commitments and unrecognized questions stay blocked", () => {
  const result = clarify(
    "What fee, availability and working-hour overlap can you commit to?",
    [
      {
        id: "old",
        topic: "fees",
        content: "Old rate claim",
        source: "Old portfolio",
      },
    ],
  );
  assert.equal(result[0].status, "blocked");
  assert.ok(result[0].gaps.includes("fees"));
  assert.equal(
    clarify("What availability and working-hour overlap?", [
      {
        id: "ai",
        topic: "ai",
        content: "AI portfolio feature",
        source: "Portfolio",
      },
    ])[0].evidence.length,
    0,
    "availability is not an AI topic",
  );
  const design = clarify(
    "Can you translate Figma designs and validate AI-assisted code?",
    [
      {
        id: "client",
        topic: "clients",
        content: "Delivered client projects",
        source: "Portfolio",
      },
    ],
  )[0];
  assert.equal(design.status, "blocked");
  assert.ok(design.gaps.includes("design"));
  assert.ok(design.gaps.includes("ai_validation"));
  assert.equal(
    clarify("Confirm my favorite color?", facts)[0].status,
    "blocked",
  );
  assert.equal(
    clarify("What verified outcome proves ownership?", facts)[0].status,
    "blocked",
  );
});
