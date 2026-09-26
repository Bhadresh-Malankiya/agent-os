import { z } from "zod";
import { randomUUID } from "node:crypto";
import { pool, event } from "./db";
import { addOpportunity } from "./service";
export const SourceSchema = z.object({
  provider: z.enum(["greenhouse", "lever"]),
  slug: z.string().regex(/^[a-zA-Z0-9_-]{2,80}$/),
  company: z.string().min(2).max(150),
  keywords: z.string().min(2).max(200).default("engineer,developer"),
});
export function sourceUrl(provider: "greenhouse" | "lever", slug: string) {
  SourceSchema.pick({ provider: true, slug: true }).parse({ provider, slug });
  return provider === "greenhouse"
    ? `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`
    : `https://api.lever.co/v0/postings/${slug}?mode=json&limit=100`;
}
export function plainText(html: string) {
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export async function addSource(input: unknown) {
  const s = SourceSchema.parse(input);
  await pool.query(
    "INSERT INTO sources(id,provider,slug,company,keywords) VALUES($1,$2,$3,$4,$5) ON CONFLICT(provider,slug) DO UPDATE SET keywords=$5,enabled=true",
    [randomUUID(), s.provider, s.slug, s.company, s.keywords],
  );
  return { ok: true };
}
export async function boundedText(response: Response, limit = 8_000_000) {
  if (!response.body) throw new Error("Empty source response");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error("Source too large for this release");
      }
      text += decoder.decode(part.value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}
export async function syncSource(id: string) {
  const lease = await pool.connect();
  const controller = new AbortController();
  const disconnected = () => controller.abort();
  lease.on("error", disconnected);
  let acquired = false;
  try {
    acquired = (
      await lease.query("SELECT pg_try_advisory_lock(8917342) acquired")
    ).rows[0].acquired;
    if (!acquired) return { ok: true, imported: 0, busy: true };
    return await performSync(id, controller.signal);
  } finally {
    if (acquired)
      await lease.query("SELECT pg_advisory_unlock(8917342)").catch(() => {});
    lease.removeListener("error", disconnected);
    lease.release();
  }
}
async function performSync(id: string, signal: AbortSignal) {
  const s = (await pool.query("SELECT * FROM sources WHERE id=$1", [id]))
    .rows[0];
  if (!s) throw new Error("Source not found");
  try {
    const response = await fetch(sourceUrl(s.provider, s.slug), {
      redirect: "error",
      signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Job board returned ${response.status}`);
    const body = await boundedText(response);
    if (body.length > 8000000)
      throw new Error("Source too large for this release");
    const payload = JSON.parse(body);
    const jobs = s.provider === "greenhouse" ? payload.jobs : payload;
    if (!Array.isArray(jobs)) throw new Error("Unexpected job board response");
    const terms = s.keywords
      .toLowerCase()
      .split(",")
      .map((v: string) => v.trim())
      .filter(Boolean);
    let imported = 0;
    let matched = 0;
    for (const job of jobs.slice(0, 1000)) {
      signal.throwIfAborted();
      const title = String(job.title ?? job.text ?? "");
      if (!terms.some((term: string) => title.toLowerCase().includes(term)))
        continue;
      matched++;
      const description = plainText(
        String(job.content ?? job.descriptionPlain ?? job.description ?? ""),
      );
      if (description.length < 30) continue;
      const url = String(job.absolute_url ?? job.hostedUrl ?? "");
      if (!/^https:\/\//.test(url)) continue;
      const result = await addOpportunity({
        kind: "job",
        title: title.slice(0, 180),
        company: s.company,
        country: String(
          job.location?.name ?? job.categories?.location ?? "Not specified",
        ).slice(0, 120),
        source: `${s.provider}:${s.slug}`,
        url,
        description: description.slice(0, 15000),
      });
      if (result) imported++;
      if (imported >= 50) break;
    }
    await pool.query(
      "UPDATE sources SET last_sync=now(),sync_error=NULL WHERE id=$1",
      [id],
    );
    await event(
      "source",
      `${s.company}: imported ${imported} new opportunities (${matched} title matches).`,
    );
    return { ok: true, imported };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Source sync failed";
    await pool.query(
      "UPDATE sources SET last_sync=now(),sync_error=$2 WHERE id=$1",
      [id, message],
    );
    throw error;
  }
}
