import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import pg from "pg";
const [major, minor, patch] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && (minor < 22 || (minor === 22 && patch < 3))))
  throw new Error(
    "Node 22.22.3 or later is required. Use nvm install and nvm use.",
  );
if (!existsSync(".env")) {
  const password = randomBytes(24).toString("hex");
  writeFileSync(
    ".env",
    `DB_PASSWORD=${password}\nDATABASE_URL=postgresql://agent_os:${password}@127.0.0.1:55432/agent_os\nAPP_ORIGIN=http://127.0.0.1:3100\nCOMPOSIO_API_KEY=\nCODEX_BIN=codex\n`,
    { mode: 0o600 },
  );
}
const { parse } = await import("dotenv");
const env = { ...process.env, ...parse(readFileSync(".env")) };
const result = spawnSync("docker", ["compose", "up", "-d", "--wait"], {
  stdio: "inherit",
  env,
});
if (result.status !== 0) {
  console.error(
    "Start Docker Desktop, then run npm run setup again. Your data is preserved.",
  );
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
await pool.query(readFileSync("lib/schema.sql", "utf8"));
await pool.end();
console.log(
  "Database ready. Run npm run dev and npm run worker in separate terminals. Open http://127.0.0.1:3100",
);
