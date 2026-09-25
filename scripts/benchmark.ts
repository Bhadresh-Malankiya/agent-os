import pg from "pg";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
if (!process.env.DATABASE_URL) throw new Error("Run setup first");
const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const name = "agent_os_bench_" + randomUUID().replaceAll("-", "");
await admin.query(`CREATE DATABASE ${name}`);
const url = new URL(process.env.DATABASE_URL);
url.pathname = "/" + name;
process.env.DATABASE_URL = url.toString();
const { pool } = await import("../lib/db");
try {
  await pool.query(readFileSync("lib/schema.sql", "utf8"));
  const { saveProfile, addOpportunity, queuePackage } =
    await import("../lib/service");
  const { tick } = await import("./worker");
  await saveProfile({
    name: "Benchmark Owner",
    email: "benchmark@example.com",
    headline: "Software engineer",
    location: "Remote",
    summary: "Builds and maintains reliable software applications.",
    skills: ["TypeScript", "React", "PostgreSQL"],
    evidence: ["Built a reporting application."],
  });
  await pool.query("UPDATE settings SET daily_limit=50");
  const ids = [];
  for (let i = 0; i < 50; i++) {
    const row = await addOpportunity(
      {
        kind: "job",
        title: `Synthetic engineer ${i}`,
        company: "Benchmark fixture",
        country: "Remote",
        source: "Synthetic benchmark",
        description:
          "Develop TypeScript and React applications with PostgreSQL. This is a synthetic workload.",
      },
      true,
    );
    ids.push(row.id);
  }
  await Promise.all(ids.map(queuePackage));
  const durations = [];
  const start = performance.now();
  for (let i = 0; i < 50; i++) {
    const t = performance.now();
    await tick();
    durations.push(performance.now() - t);
  }
  const elapsed = performance.now() - start;
  const counts = (
    await pool.query(
      "SELECT (SELECT count(*)::int FROM runs WHERE status='completed') completed,(SELECT count(*)::int FROM artifacts) artifacts,(SELECT count(*)::int FROM decisions) decisions",
    )
  ).rows[0];
  if (
    counts.completed !== 50 ||
    counts.artifacts !== 50 ||
    counts.decisions !== 50
  )
    throw new Error("Benchmark invariant failed");
  durations.sort((a, b) => a - b);
  const result = {
    measured_at: new Date().toISOString(),
    scope:
      "Synthetic local deterministic preparation only; excludes model, network, browser, setup and queue insertion",
    node: process.version,
    platform: process.platform,
    workflows: 50,
    concurrency: 1,
    ...counts,
    elapsed_ms: Math.round(elapsed),
    p50_ms: Math.round(durations[24]),
    p95_ms: Math.round(durations[47]),
    model_calls: 0,
  };
  mkdirSync("artifacts", { recursive: true });
  writeFileSync("artifacts/benchmark.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await pool.end();
  await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
  await admin.end();
}
