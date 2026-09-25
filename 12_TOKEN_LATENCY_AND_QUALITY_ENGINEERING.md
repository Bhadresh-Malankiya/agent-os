# Token, Latency and Quality Engineering

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

## 1. Optimization objective

Minimize total cost and time per verified useful outcome subject to factuality, authorization, relevance and completion gates. Token count is a diagnostic, not the sole objective. A cheap wrong application is a failure; a cached unsafe action is still unsafe. No “lowest possible tokens” or percentage-saving claim is justified before a reproducible benchmark.

Default to deterministic workflows with bounded model calls. This follows the workflow/agent tradeoff described by [Anthropic](https://www.anthropic.com/engineering/building-effective-agents). Roles are contracts, not mandatory model calls. No standing multi-agent debate, per-minute model heartbeat or repeated planner on an unchanged job.

## 2. Ordered execution ladder

1. Reuse a fresh, authorized, exact-version result if its dependencies still match.
2. Use deterministic extraction, calculation, filtering, mapping, rendering and validators.
3. Use one compact structured model request for ambiguous classification or writing.
4. Escalate to an evaluated stronger model only on explicit quality failure or task complexity, within the same configured billing route.
5. Use bounded interactive browser reasoning only on genuinely unfamiliar supported steps.
6. Ask a specific user question or leave a precise blocker when evidence/capability is inadequate.

Run duplicate detection, hard exclusions, source freshness and required-fact checks before expensive generation. Never spend tokens tailoring a resume for a confirmed ineligible role. Unknown eligibility is unresolved, not a guessed exclusion or permission to apply.

## 3. Context contract

Build a typed context packet: task goal; relevant rules and output schema; selected verified claims with source IDs; current job/client brief; required thread facts; specific unresolved questions; relevant tool schemas. Keep static instructions stable and dynamic evidence separate. Do not load all profiles, source pages, skills, prior traces or tool definitions for every task.

Preserve exact facts, dates, compensation boundaries, negations, requested items and source references. Retrieve by workspace/account/entity and permission before relevance scoring. Begin with PostgreSQL metadata and full-text retrieval. Add local embeddings or hybrid retrieval only if held-out recall improves enough to justify indexing and operational cost. Semantic similarity does not establish factual equivalence or permission.

Maintain a versioned conversation digest plus all outstanding requests and exact relevant message excerpts. The complete thread remains retrievable. New contradictions, missing request context or low retrieval coverage trigger expansion to original messages. Compression cannot justify missing a recruiter's second question. Structured records, not lossy summaries, remain the source of truth for commitments and approvals.

Scope browser observations to visible task-relevant controls and errors; request screenshots only when DOM/accessibility evidence is insufficient. Never silently truncate a required answer or document: detect overflow and retrieve/split or fail explicitly. Keep detailed raw evidence in private artifacts and concise references in prompts.

## 4. Caches and invalidation

| Cache | Key/dependencies | Conditions for reuse |
|---|---|---|
| Public source extraction | Canonical URL, content hash, parser/schema version | Fresh source, unchanged content and current access policy |
| Candidate retrieval | Workspace, user, ACL epoch, source revisions, query | Same authorization and fresh verified sources |
| Job assessment | Canonical job/JD, profile, preferences, evaluator version | Same hard facts and constraints; live eligibility recheck before action |
| Resume/content package | Claim versions, JD/brief, template, strategy, locale | Dependency match and successful QA; no stale factual correction |
| Form recipe | Portal, layout fingerprint, adapter, locale, semantic field map | Read-only probe passes; values filled fresh; final action gated separately |
| Model response | Exact normalized inputs, model, schema, prompt/policy versions | Pure generation only; never reusable authority to send/submit |

Never cache “approved”, “already authenticated”, availability, recipient identity or successful external execution as timeless facts. Revocation/deletion invalidates dependent caches. Do not share private caches across workspaces. Exact matching is the default; semantic output caching is deferred until it passes false-reuse tests.

API prompt caching is distinct from application caching: it can reduce repeated-prefix processing where supported, but does not eliminate the request or guarantee an invoice/allowance reduction in CLI subscription mode. Track actual reported cache usage. [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching).

## 5. Fewer calls and bounded generation

Combine compatible read/analysis outputs into one structured response when they use the same evidence and privileges. Do not merge effect authorization with generation, or merge verification into a self-reported success. Group source polling using provider cursors and deltas. Render templates and calculate times/money in code. Reuse a validated role package when exact dependencies permit.

Return concise typed results and evidence IDs rather than long agent-to-agent prose. Use small evaluated models for simple extraction/classification and strong models for demanding synthesis only when the active runtime supports them. Do not assume a browser SDK can use the owner's CLI subscription. Disable secondary model gateways unless explicitly configured and budgeted.

Target zero model calls for unchanged scheduled checks and deterministic disqualifications. For supported routine content flows, benchmark a target of one analysis call, one generation call and at most one conditional repair/escalation. These are design targets, not universal hard limits; critical evidence cannot be dropped to meet them. A configured per-task cap stops with a resumable state rather than degrading factuality. [OpenAI latency guidance](https://developers.openai.com/api/docs/guides/latency-optimization) supports reducing unnecessary serial calls and output.

## 6. Browser and queue efficiency

Use documented APIs when available, then deterministic Playwright recipes, then scoped model assistance. Cache field mappings, not filled credentials or submit authority. Reuse scoped authenticated sessions with exclusive ownership. Wait for actual control/page conditions instead of arbitrary sleeps; bound timeouts and always release idle paid sessions after checkpoints. Independent safe reads may overlap; do not parallelize writes to the same application/thread/profile.

Reserve urgent response capacity. Batch offline research and learning when queue age and allowance permit. A provider's quota reset is a persisted timer, not an agent polling loop. Honor retry-after, exponential backoff and jitter; bounded repairs do not reset the overall budget. Prefer webhook/delta events with reconciliation over repeated full inbox scans.

## 7. Measurement and quality gate

Record per task and workflow: actual input/output/cached tokens if available, estimated input separately, model invocations, tool calls, browser seconds, cache hits, latency, retries, cloud/model charges, outcome evidence and owner minutes. Include failed attempts, evaluations and experiments in costs. Unknown usage is never zero. CLI message counts are not a token invoice.

Benchmark baseline versus optimized configuration on identical synthetic/consented tasks and hardware/runtime versions. Split by hiring/client mode, portal, language and complexity. Publish sample counts, cold/warm cache results, p50/p95 latency, verified completion rate, factual errors, manual takeovers and full cost per outcome. Include confidence intervals for measured rates where appropriate. Keep a held-out suite and record all exclusions.

Set the quality floor before comparing cost: all critical invariants pass; no unsupported claims or unauthorized effects; task-completeness/relevance rubric meets its threshold; success rate must not regress beyond a predeclared margin. Blind human spot-checks calibrate model graders. Retain the higher-quality baseline if evidence is insufficient. Fine-tuning, model training and global memory sharing are deferred until a consented dataset, measurable need and separate budget exist.

## 8. Cost accounting

Monthly cost = runtime subscription or API consumption + hosting/storage/backups + connectors/search + browser time/proxy traffic/challenges + notifications + evaluation/learning + operator maintenance. Attribute subscription usage honestly without inventing a per-token bill. Estimate cost per confirmed application and per qualified client conversation separately. Do not compare a free local browser's zero vendor fee with a hosted browser while omitting local compute/maintenance.

For a browser workload, approximate hours = attempts × active minutes per attempt / 60; include retries and waiting sessions. Example only: 300 attempts × 8 minutes = 40 hours, before retry/idle overhead. Use measured percentiles and current provider pricing to forecast, and enforce both per-workflow and monthly caps. Provider concurrency is capacity offered, not permission to run that many application jobs.
