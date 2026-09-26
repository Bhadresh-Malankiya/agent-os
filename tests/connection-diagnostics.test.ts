import { test } from "node:test";
import assert from "node:assert/strict";
import {
  connectionDiagnostic,
  callbackDiagnostic,
} from "../lib/connection-diagnostics";
import { modelPolicy } from "../lib/model-policy";
test("connection diagnostics classify known failures without leaking provider secrets", () => {
  for (const [status, code] of [
    [401, "INVALID_API_KEY"],
    [403, "PROVIDER_FORBIDDEN"],
    [404, "CONFIG_NOT_FOUND"],
    [429, "RATE_LIMITED"],
    [503, "PROVIDER_UNAVAILABLE"],
  ] as const) {
    const d = connectionDiagnostic(
      {
        status,
        message: "secret-token",
        body: { access_token: "secret-token" },
      },
      "Connect",
    );
    assert.equal(d.code, code);
    assert.equal(d.httpStatus, status);
    assert.ok(!JSON.stringify(d).includes("secret-token"));
  }
  assert.equal(
    connectionDiagnostic({ cause: { status: 401 } }, "Connect").code,
    "INVALID_API_KEY",
  );
  assert.equal(
    connectionDiagnostic({ statusCode: 403 }, "Connect").code,
    "PROVIDER_FORBIDDEN",
  );
  assert.equal(
    connectionDiagnostic({ name: "TimeoutError" }, "Check").code,
    "TIMEOUT",
  );
  assert.equal(
    connectionDiagnostic({ cause: { code: "ENOTFOUND" } }, "Check").code,
    "ENOTFOUND",
  );
  assert.equal(
    connectionDiagnostic(new Error("secret-token"), "Check").code,
    "UNKNOWN_PROVIDER_ERROR",
  );
});
test("callback explains known errors but never echoes arbitrary provider data", () => {
  assert.match(
    callbackDiagnostic(new URLSearchParams("error=access_denied")),
    /access_denied/,
  );
  assert.match(
    callbackDiagnostic(new URLSearchParams("error=redirect_uri_mismatch")),
    /redirect_uri_mismatch/,
  );
  assert.ok(
    !callbackDiagnostic(
      new URLSearchParams("error=secret-token&error_description=private"),
    ).includes("secret-token"),
  );
  assert.match(
    callbackDiagnostic(new URLSearchParams("status=success")),
    /without verified access/,
  );
});
test("tasks pin model and reasoning; invalid explicit configuration never falls back", () => {
  const keys = ["CODEX_MODEL", "CODEX_BRIEF_MODEL", "CODEX_PROFILE_MODEL"];
  const old = keys.map((k) => process.env[k]);
  try {
    keys.forEach((k) => delete process.env[k]);
    assert.equal(modelPolicy("brief").model, "gpt-6-sol");
    assert.equal(modelPolicy("brief").effort, "medium");
    assert.equal(modelPolicy("profile").model, "gpt-6-luna");
    assert.equal(modelPolicy("profile").effort, "low");
    process.env.CODEX_BRIEF_MODEL = "invalid model";
    assert.throws(() => modelPolicy("brief"), /Invalid/);
  } finally {
    keys.forEach((k, i) => {
      if (old[i] === undefined) delete process.env[k];
      else process.env[k] = old[i];
    });
  }
});
