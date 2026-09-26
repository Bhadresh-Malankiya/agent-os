import { IntegrationSetupError } from "@/lib/integration-policy";
import {
  integrationStatus,
  connectToolkit,
  capabilityAccount,
  connectCapability,
  attachAuthConfig,
} from "@/lib/composio";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET() {
  const [status, email, calendar] = await Promise.allSettled([
    integrationStatus(),
    capabilityAccount("outreach"),
    capabilityAccount("calendar"),
  ]);
  const describe = (result: PromiseSettledResult<unknown>, label: string) =>
    result.status === "rejected"
      ? `${label} access could not be checked. Retry when the provider is reachable.`
      : result.value
        ? `${label} has one active account. Individual actions still require valid provider permissions.`
        : `${label} is not connected for this workspace. Complete account consent.`;
  return Response.json({
    ...(status.status === "fulfilled"
      ? status.value
      : {
          configured: !!process.env.COMPOSIO_API_KEY,
          verified: false,
          accounts: [],
        }),
    outreach: email.status === "fulfilled" && !!email.value,
    calendar: calendar.status === "fulfilled" && !!calendar.value,
    checkedAt: new Date().toISOString(),
    details: {
      outreach: describe(email, "Gmail"),
      calendar: describe(calendar, "Calendar"),
    },
    ...(status.status === "rejected"
      ? {
          error:
            "Composio verification is unavailable. Check the private key and network connection.",
        }
      : {}),
  });
}

export async function POST(request: Request) {
  if (
    request.headers.get("origin") !==
    (process.env.APP_ORIGIN ?? "http://127.0.0.1:3100")
  )
    return Response.json({ error: "Untrusted origin" }, { status: 403 });
  try {
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return Response.json({ error: "JSON required" }, { status: 415 });
    const raw = await request.text();
    if (raw.length > 4000)
      return Response.json({ error: "Request too large" }, { status: 413 });
    const body = JSON.parse(raw);
    if (body.action === "auth-config")
      return Response.json(
        await attachAuthConfig(
          z.enum(["outreach", "calendar"]).parse(body.capability),
          z
            .string()
            .regex(/^ac_[A-Za-z0-9_-]{3,100}$/)
            .parse(body.id),
        ),
      );
    if (["outreach", "calendar"].includes(body.toolkit))
      return Response.json(
        await connectCapability(
          z.enum(["outreach", "calendar"]).parse(body.toolkit),
        ),
      );
    return Response.json(
      await connectToolkit(z.enum(["gmail", "github"]).parse(body.toolkit)),
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof IntegrationSetupError
            ? error.message
            : "Could not configure the connection. Check Composio, its auth configuration and required scopes.",
      },
      { status: 400 },
    );
  }
}
