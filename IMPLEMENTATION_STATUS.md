# Implementation status — v0.2.0

The numbered v4 design remains the target architecture. This alpha implements a smaller, tested local slice. README is authoritative for current capability; YAML templates are not loaded by the runtime.

## Completed slice

Profile → live/public or manual opportunity intake → bounded durable queue → deterministic package → optional Codex brief → persistent decision → owner answer → outcome observation. Content studio provides downloads and four platform profile drafts. Next.js UI/API, PostgreSQL, Node worker, Composio connection setup, health/diagnostics, backup, CI and local service installation are included.

## Deliberate architecture changes

- PostgreSQL performs queue claiming (`FOR UPDATE SKIP LOCKED`) and stores local effects in the same transaction. Redis/BullMQ would add operational cost before this workload needs it.
- One modular app and one worker, not a distributed collection of model agents.
- Model use is optional, bounded and draft-only. Deterministic preparation is the fallback, not a second paid provider.
- Decision answers remain review context. Separate Work approvals bind exact content and account for email/calendar actions. Dispatch is persisted before the provider call; uncertain delivery is held without retry.
- Learning reports observations. It does not change production prompts, source priorities, facts, budgets or permissions.

## Remaining implementation gates

1. Broader granular mandates and provider reconciliation. Email/calendar payload/account binding and durable dispatch exist, with fake-provider tests; live provider receipts are not yet verified.
2. Gmail read-only outcome ingestion with explicit account identity, scope verification, webhook signature validation and deduplication; live validation of the separately gated sending adapter.
3. Real browser adapter with isolated sessions, fixtures, field-level authorization, outcome reconciliation and challenge handoff. No universal CAPTCHA promise.
4. Resume PDF rendering, richer profile fact review, platform-specific limits and remote change detection.
5. Client prospecting sources, verified contacts, suppression lists, commercial approval boundaries and reply handling.
6. Controlled learning experiments with adequate cohorts, frozen evaluation and rollback.
7. Authenticated multi-user server packaging, tenant isolation, encrypted secrets, durable notifications, restore testing on fresh infrastructure and security review.
8. Source pagination, closed-role reconciliation, verified country normalization, salary/visa constraints and scheduling preferences.

## Release posture

Local alpha, not production autonomous outreach software. Unit/integration validation covers implemented boundaries; it does not certify the design's broader guarantees. No recruiter, employer or client has been contacted by this application. App outputs and model prose require review before external use.

## Agent visibility update

Home now prioritizes required input and recent drafts. Agents remain visible across pages with operational maturity badges derived from stored real-run evidence, never elapsed time. Status, maturity criteria and evidence links are available on Agents; advanced pages are under More. This does not implement the controlled-learning gate above.

## Automatic clarification and audit update

Implemented conservative zero-model retrieval from saved profile evidence and imported, source-attributed portfolio excerpts; recurring Resolver processing; blocked-state visibility; and live agent activities with durable attributed audit rows. Protected commitments and missing evidence remain explicit blockers. External applications, publishing and provider OAuth restrictions still require the implementation gates above.

## Access-first desk release

Implemented paste-based résumé extraction with exact source checks and explicit preview acceptance; five-tab workspace; live agents and audits; formatted leads; editable/exportable drafts; outcome recording; knowledge notes; bounded writing skills; working limits; and approved message/follow-up/meeting queues. Outbound tests use fake providers, never real recipients. The currently configured local account has no usable Gmail/Calendar connection, so outreach remains blocked. Browser application submission, automatic reply ingestion and strategy self-promotion remain unimplemented.

## 0.2.0 release hardening

Managed OAuth uses hosted links instead of the retired initiate method. Optional custom auth configs are validated for enabled OAuth, toolkit and declared scopes. Readiness checks for Gmail and Calendar fail independently. Configuration changes reset affected pending approvals. Library → System reports version, worker/profile/source readiness and partial token usage. See RELEASE_0_2.md for supported scope and remaining external gates.
