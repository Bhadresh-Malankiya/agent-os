import {
  integrationStatus,
  connectToolkit,
  capabilityAccount,
  connectCapability,
} from "@/lib/composio";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const [status, email, calendar] = await Promise.all([
      integrationStatus(),
      capabilityAccount("outreach"),
      capabilityAccount("calendar"),
    ]);
    return Response.json({
      ...status,
      outreach: !!email,
      calendar: !!calendar,
    });
  } catch {
    return Response.json(
      {
        error:
          "Composio could not be verified. Check the private key and your connection.",
      },
      { status: 502 },
    );
  }
}
export async function POST(request: Request) {
  if (
    request.headers.get("origin") !==
    (process.env.APP_ORIGIN ?? "http://127.0.0.1:3100")
  )
    return Response.json({ error: "Untrusted origin" }, { status: 403 });
  try {
    const body = await request.json();
    if (["outreach", "calendar"].includes(body.toolkit))
      return Response.json(
        await connectCapability(
          z.enum(["outreach", "calendar"]).parse(body.toolkit),
        ),
      );
    return Response.json(
      await connectToolkit(z.enum(["gmail", "github"]).parse(body.toolkit)),
    );
  } catch {
    return Response.json(
      {
        error:
          "Could not create a connection link. Check Composio configuration.",
      },
      { status: 400 },
    );
  }
}
