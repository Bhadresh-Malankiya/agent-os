import { spawnSync } from "node:child_process";
if (!process.env.DATABASE_URL)
  throw new Error(
    "Run npm run setup first. Integration tests use a new disposable database on the same PostgreSQL server.",
  );
const r = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", "tests/integration.test.ts"],
  {
    stdio: "inherit",
    env: { ...process.env, TEST_DATABASE_URL: process.env.DATABASE_URL },
  },
);
process.exitCode = r.status ?? 1;
