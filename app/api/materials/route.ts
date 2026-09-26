import { z } from "zod";
import { pool } from "@/lib/db";
import { resumePdf, emailFile } from "@/lib/materials";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const format = params.get("format") ?? "resume";
  if (!["resume", "eml", "message"].includes(format))
    return new Response("Invalid format", { status: 400 });
  try {
    const profile = (
      await pool.query("SELECT profile FROM settings WHERE id=true")
    ).rows[0].profile;
    if (format === "resume")
      return new Response(new Uint8Array(await resumePdf(profile)), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="resume.pdf"',
        },
      });
    const id = z.uuid().parse(params.get("id"));
    const w = (
      await pool.query(
        "SELECT * FROM work_items WHERE id=$1 AND kind IN ('email','followup')",
        [id],
      )
    ).rows[0];
    if (!w) return new Response("Draft not found", { status: 404 });
    if (format === "message")
      return new Response(w.body, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": 'attachment; filename="cover-note.txt"',
        },
      });
    if (w.recipient && !z.email().safeParse(w.recipient).success)
      return new Response("Invalid recipient", { status: 400 });
    return new Response(emailFile(w, await resumePdf(profile)), {
      headers: {
        "Content-Type": "message/rfc822",
        "Content-Disposition": 'attachment; filename="outreach-draft.eml"',
      },
    });
  } catch {
    return new Response(
      "Materials unavailable. Save a valid profile and draft first.",
      { status: 400 },
    );
  }
}
