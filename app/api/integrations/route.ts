import { event } from "@/lib/db";
import { connectionDiagnostic } from "@/lib/connection-diagnostics";
import { randomUUID } from "node:crypto";
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
      ? connectionDiagnostic(result.reason, `${label} access check`).message
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
    diagnostics: [
      ...(!process.env.COMPOSIO_API_KEY
        ? [
            connectionDiagnostic(
              new IntegrationSetupError(
                "COMPOSIO_API_KEY is missing. Add it to the private environment and restart the app.",
              ),
              "Composio configuration",
            ),
          ]
        : []),
      ...[status, email, calendar].flatMap((result, index) =>
        result.status === "rejected"
          ? [
              connectionDiagnostic(
                result.reason,
                [
                  "Composio verification",
                  "Gmail access check",
                  "Calendar access check",
                ][index],
              ),
            ]
          : [],
      ),
    ],
    details: {
      outreach: describe(email, "Gmail"),
      calendar: describe(calendar, "Calendar"),
    },
    ...(status.status === "rejected"
      ? {
          error: connectionDiagnostic(status.reason, "Composio verification")
            .message,
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
  let stage = "Validate connection request";
  try {
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return Response.json({ error: "JSON required" }, { status: 415 });
    const raw = await request.text();
    if (raw.length > 4000)
      return Response.json({ error: "Request too large" }, { status: 413 });
    const body = JSON.parse(raw);
    stage =
      body.action === "auth-config"
        ? "Validate and attach OAuth configuration"
        : "Create hosted authorization link";
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
    const diagnostic = connectionDiagnostic(
      error instanceof z.ZodError || error instanceof SyntaxError
        ? new IntegrationSetupError(
            "Invalid connection request. Select a supported service and valid configuration ID.",
          )
        : error,
      stage,
    );
    const reported = { ...diagnostic, reference: randomUUID() };
    await event(
      "access",
      `Connection failure: ${JSON.stringify(reported)}`,
    ).catch(() => {});
    return Response.json(
      {
        error: diagnostic.message,
        diagnostic: reported,
      },
      {
        status:
          diagnostic.httpStatus === 429
            ? 429
            : diagnostic.retryable
              ? 503
              : 400,
      },
    );
  }
}
