import pg from "pg";
import { spawnSync } from "node:child_process";
let failed = false;
const check = (name, ok) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) failed = true;
};
const [major, minor, patch] = process.versions.node.split(".").map(Number);
check(
  "Node 22.22.3+",
  major > 22 || (major === 22 && (minor > 22 || (minor === 22 && patch >= 3))),
);
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 4000,
});
try {
  await db.query("SELECT id FROM settings");
  check("Database and schema", true);
  const h = await db.query("SELECT heartbeat FROM worker_health");
  console.log(
    h.rows[0] && Date.now() - new Date(h.rows[0].heartbeat).getTime() < 20000
      ? "PASS Worker heartbeat"
      : "INFO Worker not running; npm run worker",
  );
} catch {
  check("Database and schema (run npm run setup)", false);
} finally {
  await db.end();
}
const codex = spawnSync(process.env.CODEX_BIN ?? "codex", ["login", "status"], {
  encoding: "utf8",
  timeout: 10000,
});
console.log(
  codex.status === 0
    ? "PASS Codex login available (optional)"
    : "INFO Codex not logged in (optional; deterministic drafts still work)",
);
if (process.env.COMPOSIO_API_KEY) {
  try {
    const r = await fetch(
      "https://backend.composio.dev/api/v3/connected_accounts",
      {
        headers: { "x-api-key": process.env.COMPOSIO_API_KEY },
        signal: AbortSignal.timeout(10000),
      },
    );
    console.log(
      r.ok
        ? "PASS Composio API key verified"
        : `WARN Composio verification returned ${r.status}`,
    );
  } catch {
    console.log("WARN Composio could not be reached");
  }
} else console.log("INFO Composio not configured (optional)");
process.exitCode = failed ? 1 : 0;
