import { pool } from "@/lib/db";
import { z } from "zod";
export async function GET(request: Request) {
  const id = z.uuid().safeParse(new URL(request.url).searchParams.get("id"));
  if (!id.success) return new Response("Invalid artifact", { status: 400 });
  const artifact = (
    await pool.query("SELECT content FROM artifacts WHERE id=$1", [id.data])
  ).rows[0];
  if (!artifact) return new Response("Not found", { status: 404 });
  return new Response(artifact.content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agent-os-draft.md"',
    },
  });
}
