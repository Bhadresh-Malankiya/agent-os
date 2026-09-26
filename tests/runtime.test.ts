import { test } from "node:test";
import assert from "node:assert/strict";
import {
  packageConcurrency,
  retryDelay,
  runLane,
  RuntimeSettingsSchema,
} from "../lib/runtime";
import { boundedText } from "../lib/sources";
test("resource selection respects cores and bounded pool capacity", () => {
  assert.equal(packageConcurrency("balanced", 64), 1);
  assert.equal(packageConcurrency("performance", 14), 7);
  assert.equal(packageConcurrency("performance", 64), 8);
  assert.equal(packageConcurrency("performance", 1), 1);
});
test("daily caps reject overspending and invalid execution modes", () => {
  assert.equal(
    RuntimeSettingsSchema.safeParse({ autopilot: true, daily_limit: 1001 })
      .success,
    false,
  );
  assert.equal(
    RuntimeSettingsSchema.safeParse({
      autopilot: true,
      daily_limit: 1000,
      ai_daily_limit: 101,
    }).success,
    false,
  );
});
test("retry delays are bounded", () => {
  assert.equal(retryDelay(1), 2);
  assert.equal(retryDelay(2), 4);
  assert.ok(retryDelay(100) < 300);
});
test("source response cap rejects oversized streamed responses", async () => {
  await assert.rejects(
    boundedText(new Response("x".repeat(100)), 99),
    /too large/,
  );
  assert.equal(await boundedText(new Response("é"), 2), "é");
  await assert.rejects(boundedText(new Response("é"), 1), /too large/);
});
test("independent lanes keep running when another lane is blocked and shut down without overlap", async () => {
  const c = new AbortController();
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  let fast = 0;
  let errors = 0;
  const slow = runLane(
    () => blocked,
    c.signal,
    1,
    () => errors++,
  );
  const quick = runLane(
    async () => {
      fast++;
      if (fast === 2) throw new Error("injected");
      if (fast === 4) c.abort();
    },
    c.signal,
    1,
    () => errors++,
  );
  await quick;
  assert.equal(fast, 4);
  assert.equal(errors, 1);
  release();
  await slow;
});
