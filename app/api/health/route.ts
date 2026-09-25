import { pool } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await pool.query("SELECT 1");
    return Response.json({ ok: true, version: "0.1.0" });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
