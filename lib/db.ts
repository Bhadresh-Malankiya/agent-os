import { Pool, type PoolClient } from "pg";
const globalDb = globalThis as unknown as { agentPool?: Pool };
export const pool =
  globalDb.agentPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5000,
  });
globalDb.agentPool = pool;
export async function transaction<T>(
  fn: (db: PoolClient) => Promise<T>,
): Promise<T> {
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const result = await fn(db);
    await db.query("COMMIT");
    return result;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}
export async function event(
  type: string,
  message: string,
  db: Pool | PoolClient = pool,
) {
  await db.query("INSERT INTO events(type,message) VALUES($1,$2)", [
    type,
    message,
  ]);
}
