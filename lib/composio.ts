import { Composio } from "@composio/core";
import { randomUUID } from "node:crypto";
import { pool, transaction, event } from "./db";
import {
  IntegrationSetupError,
  hostedConnection,
  integrationPolicy,
  validateAuthConfig,
  type Capability,
} from "./integration-policy";
export type { Capability } from "./integration-policy";
function client() {
  if (!process.env.COMPOSIO_API_KEY)
    throw new IntegrationSetupError(
      "Add COMPOSIO_API_KEY to your private .env, then restart.",
    );
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
  if (!r.ok)
    throw Object.assign(new Error("Composio verification failed"), {
      status: r.status,
    });
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

export async function connectCapability(capability: Capability) {
  const { toolkit, key, scopes } = integrationPolicy[capability];
  return transaction(async (db) => {
    await db.query(
      "INSERT INTO integration_state(id,user_id) VALUES(true,$1) ON CONFLICT DO NOTHING",
      [randomUUID()],
    );
    const identity = (
      await db.query("SELECT * FROM integration_state WHERE id=true FOR UPDATE")
    ).rows[0];
    const configs = identity.auth_configs ?? {};
    const c = client();
    if (!configs[key]) {
      const cfg = await c.authConfigs.create(
        toolkit,
        {
          type: "use_composio_managed_auth",
          name: `Agent OS ${capability}`,
          credentials: {
            scopes: scopes.join(","),
          },
        },
        { signal: AbortSignal.timeout(15000) },
      );
      configs[key] = cfg.id;
      await db.query(
        "UPDATE integration_state SET auth_configs=$1 WHERE id=true",
        [JSON.stringify(configs)],
      );
    }
    return hostedConnection(c, identity.user_id, configs[key]);
  });
}
export async function capabilityAccount(capability: Capability) {
  if (!process.env.COMPOSIO_API_KEY) return null;
  const identity = (
    await pool.query("SELECT * FROM integration_state WHERE id=true")
  ).rows[0];
  if (!identity) return null;
  const key = capability === "outreach" ? "gmail_outreach_v1" : "calendar_v1";
  const config = identity.auth_configs?.[key];
  if (!config) return null;
  const result = await client().connectedAccounts.list(
    {
      userIds: [identity.user_id],
      authConfigIds: [config],
      statuses: ["ACTIVE"],
    },
    { signal: AbortSignal.timeout(10000) },
  );
  if (result.items.length > 1)
    throw new IntegrationSetupError(
      "Multiple active accounts match this capability. Keep exactly one account active in the bound Composio auth configuration.",
    );
  if (!result.items.length) return null;
  return { accountId: result.items[0].id, userId: identity.user_id };
}
const permittedTools = new Set([
  "GMAIL_SEND_EMAIL",
  "GMAIL_FETCH_EMAILS",
  "GOOGLECALENDAR_CREATE_EVENT",
  "GOOGLECALENDAR_FIND_EVENT",
]);
export async function executeProvider(
  tool: string,
  account: { accountId: string; userId: string },
  args: Record<string, unknown>,
) {
  if (!permittedTools.has(tool)) throw new Error("Unsupported tool");
  // Version obtained from the provider catalog during implementation. No SDK retry on writes.
  return client().tools.execute(
    tool,
    {
      connectedAccountId: account.accountId,
      userId: account.userId,
      version: "00000000_00",
      arguments: args,
    },
    { signal: AbortSignal.timeout(25000) },
  );
}

export async function attachAuthConfig(capability: Capability, id: string) {
  const config = await client().authConfigs.get(id, {
    signal: AbortSignal.timeout(10000),
  });
  validateAuthConfig(capability, config);
  return transaction(async (db) => {
    await db.query(
      "INSERT INTO integration_state(id,user_id) VALUES(true,$1) ON CONFLICT DO NOTHING",
      [randomUUID()],
    );
    await db.query("SELECT id FROM integration_state WHERE id=true FOR UPDATE");
    const key = integrationPolicy[capability].key;
    const previous = (
      await db.query("SELECT auth_configs FROM integration_state WHERE id=true")
    ).rows[0].auth_configs?.[key];
    if (previous === id) return { ok: true };
    await db.query(
      "UPDATE integration_state SET auth_configs=jsonb_set(auth_configs,ARRAY[$1],to_jsonb($2::text)) WHERE id=true",
      [key, id],
    );
    await db.query(
      "UPDATE work_items SET status='draft',approval_hash=NULL,approved_account_id=NULL,error=NULL,updated_at=now() WHERE status='approved' AND ((kind='meeting')=$1)",
      [capability === "calendar"],
    );
    await event(
      "access",
      `Owner selected a validated ${capability} OAuth configuration. Pending approvals require review again.`,
      db,
    );
    return { ok: true };
  });
}
