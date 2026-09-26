export class IntegrationSetupError extends Error {}
export type Capability = "outreach" | "calendar";
export const integrationPolicy = {
  outreach: {
    toolkit: "gmail",
    key: "gmail_outreach_v1",
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
    ],
  },
  calendar: {
    toolkit: "googlecalendar",
    key: "calendar_v1",
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
  },
} as const;
export function validateAuthConfig(
  capability: Capability,
  config: {
    toolkit?: { slug?: string };
    status?: string;
    authScheme?: string;
    credentials?: Record<string, unknown>;
  },
) {
  const policy = integrationPolicy[capability];
  if (
    config.toolkit?.slug !== policy.toolkit ||
    config.status !== "ENABLED" ||
    config.authScheme !== "OAUTH2"
  )
    throw new IntegrationSetupError(
      "Use an enabled OAuth configuration for the selected service.",
    );
  const raw = config.credentials?.scopes;
  const scopes = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(/[ ,]+/)
      : [];
  if (!policy.scopes.every((s) => scopes.includes(s)))
    throw new IntegrationSetupError(
      "The configuration must expose all required scopes. Check its scopes in Composio before attaching it.",
    );
}
export function secureConnectionUrl(value: unknown) {
  if (typeof value !== "string")
    throw new IntegrationSetupError(
      "Provider did not return a secure connection link.",
    );
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !["connect.composio.dev", "dashboard.composio.dev"].includes(url.hostname)
  )
    throw new IntegrationSetupError(
      "Provider returned an unsupported connection address.",
    );
  return url.toString();
}
/** Hosted link supports managed OAuth; legacy initiate does not. */
export async function hostedConnection(
  provider: {
    connectedAccounts: {
      link: (
        userId: string,
        configId: string,
        options: undefined,
        request: { signal: AbortSignal },
      ) => Promise<{ redirectUrl?: string | null }>;
    };
  },
  userId: string,
  configId: string,
) {
  const result = await provider.connectedAccounts.link(
    userId,
    configId,
    undefined,
    { signal: AbortSignal.timeout(15000) },
  );
  return { url: secureConnectionUrl(result.redirectUrl) };
}
