import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";
if (process.platform !== "darwin")
  throw new Error(
    "This installer supports macOS. See OPERATIONS.md for Linux supervision.",
  );
if (!existsSync(".next/BUILD_ID")) throw new Error("Run npm run build first.");
const source = process.cwd();
const root = resolve(homedir(), ".local/share/agent-os");
mkdirSync(root, { recursive: true, mode: 0o700 });
for (const service of ["web", "worker"])
  spawnSync(
    "launchctl",
    ["bootout", `gui/${process.getuid()}/dev.agent-os.${service}`],
    { stdio: "ignore" },
  );
const copy = spawnSync(
  "rsync",
  [
    "-a",
    "--exclude=.git",
    "--exclude=/private/",
    "--exclude=/backups/",
    "--exclude=*.log",
    source + "/",
    root + "/",
  ],
  { stdio: "inherit" },
);
if (copy.status !== 0)
  throw new Error("Could not stage the background runtime");
const logs = resolve(root, "private/logs");
mkdirSync(logs, { recursive: true, mode: 0o700 });
const agents = resolve(homedir(), "Library/LaunchAgents");
mkdirSync(agents, { recursive: true });
const xml = (s) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
for (const [name, args] of [
  [
    "web",
    [
      resolve(root, "node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3100",
    ],
  ],
  [
    "worker",
    [
      "--env-file=" + resolve(root, ".env"),
      "--import",
      resolve(root, "node_modules/tsx/dist/loader.mjs"),
      resolve(root, "scripts/worker.ts"),
    ],
  ],
]) {
  const label = "dev.agent-os." + name;
  const path = resolve(agents, label + ".plist");
  const argv = [process.execPath, ...args];
  const codex = "/Applications/ChatGPT.app/Contents/Resources";
  const content = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>Label</key><string>${label}</string><key>ProgramArguments</key><array>${argv.map((x) => "<string>" + xml(x) + "</string>").join("")}</array><key>WorkingDirectory</key><string>${xml(root)}</string><key>EnvironmentVariables</key><dict><key>PATH</key><string>${xml(dirname(process.execPath) + ":" + codex + ":/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin")}</string><key>HOME</key><string>${xml(homedir())}</string><key>NODE_ENV</key><string>production</string></dict><key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>ThrottleInterval</key><integer>10</integer><key>StandardOutPath</key><string>${xml(logs + "/" + name + ".log")}</string><key>StandardErrorPath</key><string>${xml(logs + "/" + name + ".error.log")}</string></dict></plist>`;
  writeFileSync(path, content, { mode: 0o600 });
  let installed = false;
  for (let attempt = 0; attempt < 6; attempt++) {
    const result = spawnSync(
      "launchctl",
      ["bootstrap", `gui/${process.getuid()}`, path],
      { stdio: "ignore" },
    );
    if (result.status === 0) {
      installed = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!installed)
    throw new Error(
      "Service could not start: " +
        label +
        ". Inspect launchctl and private service logs.",
    );
  console.log("Installed " + label);
}
