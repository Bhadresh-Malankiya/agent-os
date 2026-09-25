import { readFileSync } from "node:fs";
import { saveProfile } from "../lib/service";
import { pool } from "../lib/db";
const path = process.argv[2];
if (!path)
  throw new Error(
    "Usage: npm run import-profile -- /path/to/private-profile.json",
  );
await saveProfile(JSON.parse(readFileSync(path, "utf8")));
await pool.end();
console.log(
  "Private profile imported. Personal data was not written to tracked files.",
);
