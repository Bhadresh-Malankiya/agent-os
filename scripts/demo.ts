import { pool } from "../lib/db";
import { saveProfile, seedDemo } from "../lib/service";
const current = (await pool.query("SELECT profile FROM settings WHERE id=true"))
  .rows[0]?.profile;
if (!current?.name)
  await saveProfile({
    name: "Alex Example",
    email: "alex@example.com",
    headline: "Senior Full Stack Engineer",
    location: "Remote",
    summary:
      "Software engineer building reliable web applications and product experiences. This is a fictional demonstration profile.",
    skills: ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL"],
    evidence: ["Built an internal reporting application (fictional demo)."],
    website: "https://example.com",
    source: "Synthetic demo profile; not a real person",
  });
await seedDemo();
await pool.end();
console.log(
  "Demo opportunities loaded. An existing owner profile was preserved. Open the dashboard and prepare a sample opportunity.",
);
