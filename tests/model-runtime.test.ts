import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateBrief } from "../lib/codex";
import { ProfileSchema } from "../lib/domain";
test("model runtime validates output, strips integration secrets, times out, cancels and handles early exit", async () => {
  const dir = await mkdtemp(join(tmpdir(), "agent-os-model-test-"));
  const file = join(dir, "mock-model");
  const old = process.env.CODEX_BIN;
  const oldKey = process.env.COMPOSIO_API_KEY;
  process.env.CODEX_BIN = file;
  process.env.COMPOSIO_API_KEY = "synthetic-secret-not-for-child";
  const profile = ProfileSchema.parse({
    name: "Test Owner",
    email: "owner@example.com",
    headline: "Engineer",
    location: "Remote",
    summary: "Synthetic test profile for validating model output.",
    skills: ["TypeScript"],
    evidence: ["Built a synthetic example."],
  });
  const opportunity = {
    id: "fixture",
    kind: "job" as const,
    title: "Engineer",
    company: "Test",
    country: "Remote",
    source: "Fixture",
    url: "",
    description: "TypeScript engineering work in a synthetic test.",
  };
  const mock = async (body: string) =>
    writeFile(file, `#!${process.execPath}\n${body}`, { mode: 0o700 });
  try {
    await mock(
      `const fs=require('node:fs');if(process.env.COMPOSIO_API_KEY)process.exit(9);process.stdin.resume();process.stdin.on('end',()=>{const target=process.argv[process.argv.indexOf('--output-last-message')+1];fs.writeFileSync(target,JSON.stringify({fit_summary:'Synthetic fit',evidence:[{fact_id:0,relevance:'Known evidence'}],gaps:[],questions:[],cover_note:'Synthetic cover note'}));console.log(JSON.stringify({type:'turn.completed',usage:{input_tokens:100,output_tokens:20}}));});`,
    );
    const value = await generateBrief(profile, opportunity);
    assert.equal(value.brief.evidence[0].fact_id, 0);
    assert.deepEqual(value.usage, { input_tokens: 100, output_tokens: 20 });
    await mock("process.stdin.resume();setInterval(()=>{},1000)");
    await assert.rejects(
      generateBrief(profile, opportunity, { timeoutMs: 100 }),
      /time limit/,
    );
    const c = new AbortController();
    const pending = generateBrief(profile, opportunity, { signal: c.signal });
    setTimeout(() => c.abort(), 30);
    await assert.rejects(pending, /cancelled|abort/i);
    await mock("process.exit(1)");
    await assert.rejects(generateBrief(profile, opportunity));
    await mock(
      "const fs=require('node:fs');fs.writeFileSync(process.argv[process.argv.indexOf('--output-last-message')+1],'{bad json');process.stdin.resume();",
    );
    await assert.rejects(generateBrief(profile, opportunity));
  } finally {
    if (old === undefined) delete process.env.CODEX_BIN;
    else process.env.CODEX_BIN = old;
    if (oldKey === undefined) delete process.env.COMPOSIO_API_KEY;
    else process.env.COMPOSIO_API_KEY = oldKey;
    await rm(dir, { recursive: true, force: true });
  }
});
