import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loginMethod,
  safePlan,
  configuredModel,
  describeAI,
} from "../lib/ai-runtime";
test("AI billing classification never infers a login from failed or unknown output", () => {
  assert.equal(loginMethod("Logged in using ChatGPT", true), "chatgpt");
  assert.equal(loginMethod("Logged in using an API key", true), "api-key");
  assert.equal(loginMethod("Logged in using ChatGPT", false), "unavailable");
  assert.equal(loginMethod("something else", true), "unknown");
  assert.match(describeAI("api-key").billing, /API/);
});
test("account metadata extracts only a bounded plan label", () => {
  assert.equal(
    safePlan({
      type: "chatgpt",
      planType: "pro",
      email: "private@example.com",
      token: "secret",
    }),
    "pro",
  );
  assert.equal(safePlan({ type: "apiKey", planType: "pro" }), null);
  assert.equal(safePlan({ type: "chatgpt", planType: "<script>" }), null);
  assert.equal(safePlan(null), null);
});
test("explicit model selection is bounded and absent selection stays unknown", () => {
  const old = process.env.CODEX_MODEL;
  try {
    delete process.env.CODEX_MODEL;
    assert.equal(configuredModel(), null);
    process.env.CODEX_MODEL = "test-model";
    assert.equal(configuredModel(), "test-model");
    process.env.CODEX_MODEL = "invalid model\n";
    assert.equal(configuredModel(), null);
  } finally {
    if (old === undefined) delete process.env.CODEX_MODEL;
    else process.env.CODEX_MODEL = old;
  }
});
