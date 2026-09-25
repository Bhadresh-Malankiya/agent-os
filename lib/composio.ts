import { Composio } from "@composio/core";
import { randomUUID } from "node:crypto";
import { pool, transaction } from "./db";
function client() {
  if (!process.env.COMPOSIO_API_KEY)
    throw new Error("Add COMPOSIO_API_KEY to your private .env, then restart.");
  return new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    allowTracking: false,
  });
}
export async function integrationStatus() {
  if (!process.env.COMPOSIO_API_KEY)
    return { configured: false, verified: false, accounts: [] };
  const r = await fetch(
    "https://backend.composio.dev/api/v3/connected_accounts",
    {
      headers: { "x-api-key": process.env.COMPOSIO_API_KEY },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    },
  );
  if (!r.ok) throw new Error(`Composio returned ${r.status}`);
  const data = await r.json();
  const identity = (
    await pool.query("SELECT user_id FROM integration_state WHERE id=true")
  ).rows[0];
  return {
    configured: true,
    verified: true,
    accounts: (data.items ?? [])
      .filter(
        (item: { user_id?: string }) => item.user_id === identity?.user_id,
      )
      .map(
        (item: { id: string; status: string; toolkit?: { slug: string } }) => ({
          id: item.id,
          status: item.status,
          toolkit: item.toolkit?.slug ?? "unknown",
        }),
      ),
  };
}
export async function connectToolkit(toolkit: "gmail" | "github") {
  return transaction(async (db) => {
    await db.query(
      "INSERT INTO integration_state(id,user_id) VALUES(true,$1) ON CONFLICT DO NOTHING",
      [randomUUID()],
    );
    const identity = (
      await db.query("SELECT * FROM integration_state WHERE id=true FOR UPDATE")
    ).rows[0];
    const composio = client();
    const authConfigs: Record<string, string> = identity.auth_configs ?? {};
    if (!authConfigs[toolkit]) {
      const config = await composio.authConfigs.create(toolkit, {
        type: "use_composio_managed_auth",
        name: `Agent OS ${toolkit} read-only`,
        credentials: {
          scopes:
            toolkit === "gmail"
              ? "https://www.googleapis.com/auth/gmail.readonly"
              : "read:user,user:email",
        },
      });
      authConfigs[toolkit] = config.id;
      await db.query(
        "UPDATE integration_state SET auth_configs=$1 WHERE id=true",
        [JSON.stringify(authConfigs)],
      );
    }
    const session = identity.session_id
      ? await composio.use(identity.session_id)
      : await composio.sessions.create(identity.user_id, {
          toolkits: ["gmail", "github"],
          premiumUsage: false,
          authConfigs,
        });
    if (!identity.session_id)
      await db.query(
        "UPDATE integration_state SET session_id=$1 WHERE id=true",
        [session.sessionId],
      );
    await session.update({ authConfigs, premiumUsage: false });
    const connection = await session.authorize(toolkit);
    const url = connection.redirectUrl;
    if (
      !url ||
      new URL(url).protocol !== "https:" ||
      !["connect.composio.dev", "dashboard.composio.dev"].includes(
        new URL(url).hostname,
      )
    )
      throw new Error("Provider did not return a secure connection link");
    return { url };
  });
}
