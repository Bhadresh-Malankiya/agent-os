import { Pool, type PoolClient } from "pg";
import { randomUUID } from "node:crypto";
const globalDb = globalThis as unknown as { agentPool?: Pool };
export const pool =
  globalDb.agentPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 12,
    statement_timeout: 30000,
    idle_in_transaction_session_timeout: 30000,
    connectionTimeoutMillis: 5000,
  });
if (!globalDb.agentPool)
  pool.on("error", () => {
    // Idle connections may be closed by a database restart. Never log connection strings.
    console.error(
      "Database idle connection interrupted; new work will reconnect.",
    );
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
    await db.query("ROLLBACK").catch(() => {});
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
  const actors: Record<string, string> = {
    source: "Scout",
    run: "Preparer",
    ai: "Analyst",
    queue: "Scheduler",
    outreach: "Coordinator",
    "profile-import": "Importer",
  };
  await db.query(
    "INSERT INTO audit_log(id,agent,action,status,detail) VALUES($1,$2,$3,'recorded',$4)",
    [
      randomUUID(),
      actors[type] ?? "Workspace",
      type,
      JSON.stringify({ message, external_effect: type === "outreach" }),
    ],
  );
}
