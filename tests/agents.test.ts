import { test } from "node:test";
import assert from "node:assert/strict";
import { executionMaturity, agentOverview } from "../lib/agents";
test("maturity requires recent clean evidence and regresses on failures or retries", () => {
  assert.equal(executionMaturity(0, 0).level, 0);
  assert.equal(executionMaturity(19, 0).level, 1);
  assert.equal(executionMaturity(20, 0).level, 2);
  assert.equal(executionMaturity(20, 1).level, 1);
  assert.equal(executionMaturity(20, 0, 1).level, 1);
  assert.equal(executionMaturity(0, 3).level, 0);
});
test("agent state distinguishes monitoring, missing setup, stale health, pause and daily limits", () => {
  const now = Date.now();
  const input = {
    settings: {
      autopilot: true,
      ai_assist: true,
      daily_limit: 10,
      ai_daily_limit: 2,
    },
    health: { heartbeat: new Date(now) },
    evidence: [
      {
        kind: "ai-brief",
        completed: 2,
        failed: 0,
        retried: 0,
        today: 2,
        active: 0,
      },
    ],
    sources: [],
    now,
  };
  assert.equal(agentOverview(input)[0].status, "Needs setup");
  assert.equal(agentOverview(input)[2].status, "Daily limit");
  assert.equal(
    agentOverview({
      ...input,
      evidence: [{ ...input.evidence[0], recent_failures: 3 }],
    })[2].status,
    "Cooling down",
  );
  assert.equal(
    agentOverview({
      ...input,
      evidence: [{ ...input.evidence[0], active: 1 }],
    })[2].status,
    "Working",
  );
  assert.ok(
    agentOverview({
      ...input,
      health: { heartbeat: new Date(now - 21000) },
    }).every((a) => a.status === "Offline"),
  );
  assert.ok(
    agentOverview({
      ...input,
      settings: { ...input.settings, autopilot: false },
    }).every((a) => a.status === "Paused"),
  );
  assert.equal(
    agentOverview({
      ...input,
      settings: { ...input.settings, ai_assist: false },
    })[2].status,
    "Disabled",
  );
  const sources = [
    { enabled: true, last_sync: new Date(now), sync_error: null },
  ];
  assert.equal(agentOverview({ ...input, sources })[0].level, 1);
  assert.equal(
    agentOverview({
      ...input,
      sources: [{ ...sources[0], sync_error: "failed" }],
    })[0].status,
    "Needs attention",
  );
  assert.equal(
    agentOverview({
      ...input,
      sources: [{ ...sources[0], last_sync: new Date(now - 8 * 3600000) }],
    })[0].level,
    0,
  );
});
