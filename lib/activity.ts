import { pool } from "./db";
export async function activity(agent: string, state: string, task: string) {
  await pool.query(
    "INSERT INTO agent_activity(agent,state,task) VALUES($1,$2,$3) ON CONFLICT(agent) DO UPDATE SET state=$2,task=$3,updated_at=now()",
    [agent, state, task],
  );
}
export async function observedLane(
  agent: string,
  task: string,
  work: () => Promise<unknown>,
) {
  const settings = (
    await pool.query("SELECT autopilot FROM settings WHERE id=true")
  ).rows[0];
  if (!settings.autopilot) {
    await activity(agent, "paused", "Automatic preparation is paused.");
    return false;
  }
  await activity(agent, "checking", task);
  try {
    const result = await work();
    await activity(
      agent,
      "waiting",
      "Waiting for the next eligible task; check settings and limits for holds.",
    );
    return result;
  } catch (error) {
    await activity(
      agent,
      "error",
      "Pass interrupted; bounded retry scheduled. Existing work remains saved.",
    ).catch(() => {});
    throw error;
  }
}
