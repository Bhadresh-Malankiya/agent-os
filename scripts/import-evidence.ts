import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { z } from "zod";
import { pool, transaction, event } from "../lib/db";
import { topics } from "../lib/clarifications";
const input = z
  .array(
    z.object({
      topic: z.string().refine((v) => v in topics),
      content: z.string().min(10).max(3000),
      source: z.string().min(5).max(500),
    }),
  )
  .max(200)
  .parse(JSON.parse(readFileSync(process.argv[2], "utf8")));
try {
  await transaction(async (db) => {
    for (const fact of input) {
      const id = createHash("sha256")
        .update(JSON.stringify(fact))
        .digest("hex");
      await db.query(
        "INSERT INTO knowledge_facts(id,topic,content,source) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",
        [id, fact.topic, fact.content, fact.source],
      );
    }
    await event(
      "evidence",
      `Imported ${input.length} documented evidence excerpts. These are source claims, not independent verification.`,
      db,
    );
  });
  console.log(`Imported ${input.length} documented excerpts privately.`);
} finally {
  await pool.end();
}
