import { mkdirSync, openSync, closeSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
mkdirSync("backups", { recursive: true, mode: 0o700 });
const file = resolve(
  "backups",
  new Date().toISOString().replaceAll(":", "-") + ".sql",
);
const fd = openSync(file, "wx", 0o600);
try {
  const result = spawnSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "postgres",
      "pg_dump",
      "-U",
      "agent_os",
      "-d",
      "agent_os",
    ],
    { stdio: ["ignore", fd, "inherit"] },
  );
  if (result.status !== 0)
    throw new Error("Backup failed; check Docker and database.");
  console.log("Private backup saved: " + file);
} finally {
  closeSync(fd);
}
