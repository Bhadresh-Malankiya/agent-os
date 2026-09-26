import { RELEASE } from "@/lib/release";
import { pool } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await pool.query("SELECT 1");
    return Response.json({ ok: true, version: RELEASE.version });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
