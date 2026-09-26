import assert from "node:assert/strict";
import http from "node:http";
const base = "http://127.0.0.1:3100";
const health = await fetch(base + "/api/health");
assert.equal(health.status, 200, "health");
const state = await (await fetch(base + "/api/state")).json();
assert.ok(state.settings, "database state");
assert.equal(
  JSON.stringify(state).includes("COMPOSIO_API_KEY"),
  false,
  "key never exposed",
);
const crossOrigin = await fetch(base + "/api/control", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: "https://example.com",
  },
  body: JSON.stringify({ action: "unknown" }),
});
assert.equal(crossOrigin.status, 403, "cross-origin mutation");
const badHost = await new Promise((resolve, reject) => {
  const req = http.get(
    base + "/api/state",
    { headers: { Host: "evil.example" } },
    (res) => {
      res.resume();
      resolve(res.statusCode);
    },
  );
  req.on("error", reject);
});
assert.equal(badHost, 403, "untrusted host");
const invalid = await fetch(base + "/api/control", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: base },
  body: JSON.stringify({
    action: "opportunity",
    value: { url: "javascript:alert(1)" },
  }),
});
assert.equal(invalid.status, 400, "invalid input");
if (state.artifacts[0]) {
  const exported = await fetch(
    base + "/api/export?id=" + state.artifacts[0].id,
  );
  assert.equal(exported.status, 200);
  assert.ok(exported.headers.get("content-disposition").includes("attachment"));
}
console.log(
  "PASS health, database state, secret exclusion, cross-origin rejection, host rejection, validation and available artifact export",
);

for (const endpoint of ["/api/workspace", "/api/integrations"]) {
  const response = await fetch(base + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://example.com",
    },
    body: JSON.stringify({ action: "unknown" }),
  });
  assert.equal(response.status, 403, "new mutation origin check");
}
