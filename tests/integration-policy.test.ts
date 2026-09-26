import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hostedConnection,
  secureConnectionUrl,
  validateAuthConfig,
  integrationPolicy,
  connectionReturnUrl,
} from "../lib/integration-policy";
import { localReadiness } from "../lib/readiness";
import { readFileSync } from "node:fs";
import { RELEASE } from "../lib/release";
test("managed OAuth uses hosted link, preserves owner/config scope and rejects unsafe redirects", async () => {
  let called = 0;
  const provider = {
    connectedAccounts: {
      link: async (
        user: string,
        config: string,
        options: { callbackUrl: string },
        request: { signal: AbortSignal },
      ) => {
        called++;
        assert.equal(options.callbackUrl, connectionReturnUrl());
        assert.equal(user, "owner");
        assert.equal(config, "ac_fixture");
        assert.ok(request.signal instanceof AbortSignal);
        return { redirectUrl: "https://connect.composio.dev/link/fixture" };
      },
    },
  };
  assert.deepEqual(await hostedConnection(provider, "owner", "ac_fixture"), {
    url: "https://connect.composio.dev/link/fixture",
  });
  assert.equal(called, 1);
  for (const url of [
    "http://connect.composio.dev/link",
    "https://connect.composio.dev.evil.example/link",
    "https://x:secret@connect.composio.dev/link",
    "javascript:alert(1)",
    null,
  ])
    assert.throws(() => secureConnectionUrl(url));
});
test("custom OAuth binding requires the right toolkit, enabled OAuth and all scopes", () => {
  const base = {
    toolkit: { slug: "gmail" },
    status: "ENABLED",
    authScheme: "OAUTH2",
    credentials: { scopes: integrationPolicy.outreach.scopes.join(",") },
  };
  assert.doesNotThrow(() => validateAuthConfig("outreach", base));
  assert.throws(() => validateAuthConfig("calendar", base));
  assert.throws(() =>
    validateAuthConfig("outreach", { ...base, status: "DISABLED" }),
  );
  assert.throws(() =>
    validateAuthConfig("outreach", { ...base, authScheme: "API_KEY" }),
  );
  assert.throws(() =>
    validateAuthConfig("outreach", {
      ...base,
      credentials: { scopes: integrationPolicy.outreach.scopes[0] },
    }),
  );
  assert.throws(() =>
    validateAuthConfig("outreach", { ...base, credentials: {} }),
  );
});
test("readiness separates local operation, quota limits and unavailable browser actions", () => {
  const result = localReadiness(
    {
      profile: {},
      heartbeat: new Date(1000),
      autopilot: false,
      aiAssist: true,
      aiLimit: 2,
      aiAttempts: 2,
      sources: 0,
    },
    30000,
  );
  const status = (id: string) => result.find((r) => r.id === id)?.state;
  assert.equal(status("profile"), "action");
  assert.equal(status("worker"), "action");
  assert.equal(status("mode"), "paused");
  assert.equal(status("ai"), "limited");
  assert.equal(status("browser"), "unavailable");
});
test("release metadata matches the package and lockfile", () => {
  assert.equal(
    JSON.parse(readFileSync("package.json", "utf8")).version,
    RELEASE.version,
  );
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  assert.equal(lock.version, RELEASE.version);
  assert.equal(lock.packages[""].version, RELEASE.version);
});

test("connection callback uses only the configured app origin", () => {
  assert.equal(
    connectionReturnUrl("http://127.0.0.1:3100"),
    "http://127.0.0.1:3100/?connection=return",
  );
  assert.equal(
    connectionReturnUrl("https://app.example/path"),
    "https://app.example/?connection=return",
  );
  assert.throws(() => connectionReturnUrl("http://evil.example"));
  assert.throws(() => connectionReturnUrl("https://user:secret@app.example"));
});
