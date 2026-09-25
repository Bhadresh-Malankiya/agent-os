import { snapshot } from "@/lib/service";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(await snapshot());
  } catch {
    return Response.json(
      { error: "Database unavailable. Run npm run setup and npm run doctor." },
      { status: 503 },
    );
  }
}
