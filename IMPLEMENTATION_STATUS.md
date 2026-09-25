# Implementation status — v0.1.0

The numbered v4 design remains the target architecture. This alpha implements a smaller, tested local slice. README is authoritative for current capability; YAML templates are not loaded by the runtime.

## Completed slice

Profile → live/public or manual opportunity intake → bounded durable queue → deterministic package → optional Codex brief → persistent decision → owner answer → outcome observation. Content studio provides downloads and four platform profile drafts. Next.js UI/API, PostgreSQL, Node worker, Composio connection setup, health/diagnostics, backup, CI and local service installation are included.

## Deliberate architecture changes

- PostgreSQL performs queue claiming (`FOR UPDATE SKIP LOCKED`) and stores local effects in the same transaction. Redis/BullMQ would add operational cost before this workload needs it.
- One modular app and one worker, not a distributed collection of model agents.
- Model use is optional, bounded and draft-only. Deterministic preparation is the fallback, not a second paid provider.
- Approval records are review notes in this alpha. They never unlock an external action because the external-action gateway has not been implemented.
- Learning reports observations. It does not change production prompts, source priorities, facts, budgets or permissions.

## Remaining implementation gates

1. Granular mandates, immutable external-action ledger, recipient/payload approval binding, idempotency and independent receipts.
2. Gmail read-only outcome ingestion with explicit account identity, scope verification, webhook signature validation and deduplication; then separately gated sending.
3. Real browser adapter with isolated sessions, fixtures, field-level authorization, outcome reconciliation and challenge handoff. No universal CAPTCHA promise.
4. Resume PDF rendering, richer profile fact review, platform-specific limits and remote change detection.
5. Client prospecting sources, verified contacts, suppression lists, commercial approval boundaries and reply handling.
6. Controlled learning experiments with adequate cohorts, frozen evaluation and rollback.
7. Authenticated multi-user server packaging, tenant isolation, encrypted secrets, durable notifications, restore testing on fresh infrastructure and security review.
8. Source pagination, closed-role reconciliation, verified country normalization, salary/visa constraints and scheduling preferences.

## Release posture

Local alpha, not production autonomous outreach software. Unit/integration validation covers implemented boundaries; it does not certify the design's broader guarantees. No recruiter, employer or client has been contacted by this application. App outputs and model prose require review before external use.
