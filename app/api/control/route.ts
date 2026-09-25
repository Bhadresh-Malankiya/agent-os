import { addSource, syncSource } from "@/lib/sources";
import { z } from "zod";
import { pool, event } from "@/lib/db";
import {
  editArtifact,
  saveProfile,
  addOpportunity,
  seedDemo,
  queuePackage,
  resolveDecision,
  generatePresence,
} from "@/lib/service";
import { randomUUID } from "node:crypto";
export async function POST(request: Request) {
  if (
    request.headers.get("origin") !==
    (process.env.APP_ORIGIN ?? "http://127.0.0.1:3100")
  )
    return Response.json(
      { error: "Untrusted request origin" },
      { status: 403 },
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "JSON required" }, { status: 415 });
  try {
    const raw = await request.text();
    if (raw.length > 40000)
      return Response.json({ error: "Request too large" }, { status: 413 });
    const body = JSON.parse(raw);
    let result: unknown;
    switch (body.action) {
      case "artifact":
        result = await editArtifact(
          z.uuid().parse(body.id),
          z.string().min(10).max(30000).parse(body.content),
        );
        break;
      case "toggle-source":
        await pool.query("UPDATE sources SET enabled=$2 WHERE id=$1", [
          z.uuid().parse(body.id),
          z.boolean().parse(body.enabled),
        ]);
        result = { ok: true };
        break;
      case "source":
        result = await addSource(body.value);
        break;
      case "sync":
        result = await syncSource(z.uuid().parse(body.id));
        break;
      case "profile":
        result = await saveProfile(body.value);
        break;
      case "opportunity":
        result = await addOpportunity(body.value);
        break;
      case "demo":
        result = await seedDemo();
        break;
      case "queue":
        result = await queuePackage(z.uuid().parse(body.id));
        break;
      case "decision":
        result = await resolveDecision(
          z.uuid().parse(body.id),
          z.string().min(1).max(3000).parse(body.answer),
        );
        break;
      case "presence":
        result = await generatePresence(
          z
            .enum(["LinkedIn", "GitHub", "Upwork", "Portfolio"])
            .parse(body.platform),
        );
        break;
      case "settings": {
        const value = z
          .object({
            autopilot: z.boolean(),
            ai_assist: z.boolean().default(false),
            daily_limit: z.number().int().min(1).max(50),
          })
          .parse(body.value);
        await pool.query(
          "UPDATE settings SET autopilot=$1,daily_limit=$2,ai_assist=$3 WHERE id=true",
          [value.autopilot, value.daily_limit, value.ai_assist],
        );
        await event(
          "settings",
          value.autopilot
            ? "Local preparation resumed."
            : "Local preparation paused.",
        );
        result = { ok: true };
        break;
      }
      case "feedback": {
        const value = z
          .object({
            id: z.uuid(),
            outcome: z.enum([
              "replied",
              "interview",
              "rejected",
              "won",
              "no_reply",
            ]),
            note: z.string().max(2000),
          })
          .parse(body.value);
        await pool.query(
          "INSERT INTO feedback(id,opportunity_id,outcome,note) VALUES($1,$2,$3,$4) ON CONFLICT(opportunity_id) DO UPDATE SET outcome=$3,note=$4,created_at=now()",
          [randomUUID(), value.id, value.outcome, value.note],
        );
        result = { ok: true };
        break;
      }
      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }
    return Response.json(result ?? { ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof z.ZodError
            ? "Please check the required fields and their format."
            : error instanceof Error && !("code" in error)
              ? error.message
              : "The action could not be saved. Check your inputs and database connection.",
      },
      { status: 400 },
    );
  }
}
