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
export async function syncSource(id: string) {
  const s = (await pool.query("SELECT * FROM sources WHERE id=$1", [id]))
    .rows[0];
  if (!s) throw new Error("Source not found");
  try {
    const response = await fetch(sourceUrl(s.provider, s.slug), {
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Job board returned ${response.status}`);
    const body = await response.text();
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
