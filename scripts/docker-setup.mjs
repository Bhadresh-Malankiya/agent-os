import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
mkdirSync("deploy", { recursive: true });
if (!existsSync("deploy/.env")) {
  writeFileSync(
    "deploy/.env",
    `DB_PASSWORD=${randomBytes(24).toString("hex")}\nAPP_PORT=3101\nCOMPOSIO_API_KEY=\nCODEX_BRIEF_MODEL=gpt-6-sol\nCODEX_PROFILE_MODEL=gpt-6-luna\n`,
    { mode: 0o600 },
  );
  console.log("Created private deploy/.env with a random database password.");
} else console.log("Preserved existing deploy/.env.");
