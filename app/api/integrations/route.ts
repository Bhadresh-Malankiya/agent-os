import { integrationStatus, connectToolkit } from "@/lib/composio";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(await integrationStatus());
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
