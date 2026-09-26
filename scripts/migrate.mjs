import pg from "pg";
import { readFile } from "node:fs/promises";
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});
try {
  await pool.query(
    await readFile(new URL("../lib/schema.sql", import.meta.url), "utf8"),
  );
  console.log("Database schema ready.");
} finally {
  await pool.end();
}
