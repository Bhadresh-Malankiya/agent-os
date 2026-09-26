import { updateDraft, markManualSent } from "@/lib/outreach";
import { z } from "zod";
import { parseProfile, acceptProfileImport } from "@/lib/profile-import";
import { addKnowledge, addSkill, confirmAccess } from "@/lib/workspace";
import { createWork, approveWork } from "@/lib/work";
import { pool, event } from "@/lib/db";
export const maxDuration = 300;
export async function POST(request: Request) {
  if (
    request.headers.get("origin") !==
    (process.env.APP_ORIGIN ?? "http://127.0.0.1:3100")
  )
    return Response.json({ error: "Untrusted origin" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "JSON required" }, { status: 415 });
  try {
    const raw = await request.text();
    if (raw.length > 100000)
      throw new Error("Paste up to 60,000 characters per import.");
    const body = JSON.parse(raw);
    switch (body.action) {
      case "schedule": {
        const minutes = z
          .union([
            z.literal(60),
            z.literal(180),
            z.literal(360),
            z.literal(720),
            z.literal(1440),
          ])
          .parse(body.minutes);
        await pool.query(
          "UPDATE settings SET batch_minutes=$1,client_prospecting=$2,next_batch_at=now() WHERE id=true",
          [minutes, z.boolean().parse(body.clients)],
        );
        break;
      }
      case "run-batch":
        await pool.query(
          "UPDATE settings SET next_batch_at=now() WHERE id=true",
        );
        break;
      case "edit-work":
        return Response.json(
          await updateDraft(
            z.uuid().parse(body.id),
            body.value,
            z.string().length(64).parse(body.hash),
          ),
        );
      case "manual-sent":
        return Response.json(
          await markManualSent(
            z.uuid().parse(body.id),
            z.string().length(64).parse(body.hash),
          ),
        );
      case "parse-profile":
        return Response.json(await parseProfile(body.text));
      case "accept-profile":
        return Response.json(
          await acceptProfileImport(z.uuid().parse(body.id)),
        );
      case "access":
        return Response.json(await confirmAccess(body.mode));
      case "knowledge":
        return Response.json(await addKnowledge(body.value));
      case "skill":
        return Response.json(await addSkill(body.value));
      case "toggle-skill":
        await pool.query("UPDATE custom_skills SET enabled=$2 WHERE id=$1", [
          z.uuid().parse(body.id),
          z.boolean().parse(body.enabled),
        ]);
        break;
      case "toggle-knowledge":
        await pool.query(
          "UPDATE knowledge_documents SET active=$2 WHERE id=$1",
          [z.uuid().parse(body.id), z.boolean().parse(body.enabled)],
        );
        break;
      case "work":
        return Response.json(await createWork(body.value));
      case "approve-work":
        return Response.json(
          await approveWork(
            z.uuid().parse(body.id),
            z.string().length(64).parse(body.hash),
          ),
        );
      case "cancel-work":
        await pool.query(
          "UPDATE work_items SET status='cancelled' WHERE id=$1 AND status IN ('draft','approved','blocked')",
          [z.uuid().parse(body.id)],
        );
        break;
      case "suppress":
        await pool.query(
          "INSERT INTO suppressed_contacts(email,reason) VALUES($1,'Owner requested no contact') ON CONFLICT DO NOTHING",
          [z.email().parse(body.email).toLowerCase()],
        );
        break;
      default:
        throw new Error("Unsupported workspace action");
    }
    await event("workspace", `Owner action: ${body.action}.`);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof z.ZodError
            ? "Please check the supplied text and required details."
            : e instanceof Error && !("code" in e)
              ? e.message
              : "Action could not finish. Please check the connection and try again.",
      },
      { status: 400 },
    );
  }
}
