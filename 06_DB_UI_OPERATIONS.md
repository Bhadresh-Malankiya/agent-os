# Database, Dashboard and Continuous Operations

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

## 1. Persistent data groups

| Group | Entities |
|---|---|
| Configuration | profile revisions/facts/claims; preference revisions; rule revisions; config bundles; publication events |
| Permissions | workspace/user/agent identities; grants; resource scopes; ownership overrides |
| Workflows | definitions/versions; runs; tasks; attempts; dependencies; timers; leases; outbox; event receipts |
| Opportunities | companies; sources/scans; canonical opportunities/aliases; JD versions; assessments; contacts |
| Artifacts | file versions; resume packages; claim maps; QA reports; attachment usage |
| Communication | conversations; message refs; request items; follow-up cycles; interviews/calendar refs |
| Applications | lifecycle; browser session; form/answer map; attempts; checkpoints; receipts |
| Effects | intents; policy decisions; attempts; verification; unknown-outcome reconciliation |
| Knowledge | source versions; chunks/index refs; memories/proposals/conflicts; freshness |
| Decisions | questions/approvals; payload hashes; scoped answers; deadlines; resume events; notification receipts |
| Learning | observed feedback; cohorts; assignments; strategy versions; evaluations; canaries; promotion/rollback records |
| Presence | platform capabilities; profile snapshots; field diffs/grants; content packages; publication receipts; visibility observations |
| Markets | country/role source registry; source lifecycle; attribution; discovery and allocation plans |
| Commercial | service offerings; canonical leads; client conversations; proposals/versions; pricing mandates; capacity reservations; contract decisions; accepted-work handoffs |
| Efficiency | cache manifests/dependency epochs; model routes; measured/estimated usage; baseline/optimized benchmark records |
| Deployment | installation identity; readiness checks; supported versions; upgrade/restore events; capability reports |
| Operations | connectors/cursors; runners; incidents; usage/budgets; metrics; audit; migration mappings |

Every entity is scoped to workspace/user as appropriate; every write has actor/version/timestamp. Immutable artifacts and revision references let the UI reconstruct exactly what was used. Secrets are never stored in a general-purpose fact or trace row.

Enforce uniqueness for provider events/messages, canonical applications, follow-up sequence steps, semantic action intents and active claim generations. Allocate artifact/config versions transactionally. Use a transactional outbox; rebuildable metric projections must not inflate counts on event replay.

## 2. UI modules

Dashboard; Hiring/Clients mode switch; Leads/proposals; Services/capacity editor; Setup doctor; Decision Inbox/global notification bell; Autopilot setup/status; Learning Center; Market Map/source coverage; Profiles/content library; Opportunities; Inbox; Application queue; Browser sessions; Resume library; Interviews; Agents; Runs/traces; Skills; Profile; Preferences; Rules; Configuration history; Knowledge/memory; Integrations/accounts; Runtime health; Analytics/cost; Audit/settings.

Profile/Preferences/Rules are first-class editable screens, not static Markdown hidden in a repository. A change preview explains dependent drafts, resumes, timers and grants. Users can compare versions, run a test and publish/rollback. The UI cannot write directly to active database rows outside this revision flow.

Show zero, no-data, stale, partial-sync, offline, quota-wait, login-required and denied states distinctly. Every metric opens the records behind it. Status colors have text labels. A run view shows current versions, evidence, handoffs, tool results, latency, retries and uncertainty.

## 3. Operating cadence

Supported account events initiate work; an hourly reconciliation pass recovers missed inbox changes. Configured source schedules run with jitter and overlap control. A deterministic dispatcher scans persisted due timers without continuous model calls. Watchdogs monitor leases, processes and connector freshness. Backups and meaningful digests use configured schedules.

Reserve capacity for human replies, interviews, reply-priority applications and uncertain-effect reconciliation. Ordinary discovery backs off when those queues age. A candidate-only blocked item releases its worker; it does not block all ordinary work.

Maintain account-level semaphores and budget reservations. Multiple agents/nodes share the actual provider allowance. Provider authentication, quota and connectivity failures pause dependent tasks; they do not trigger silent paid fallback or alternate-account rotation.

## 4. Metrics

Business: distinct discovered/qualified/excluded roles, confirmed sends, confirmed applications, human/positive replies, interviews and offers. Use explicit cohorts and denominators for conversion. Report model task attempts separately from successful external effects.

Operational: oldest actionable queue age, unanswered reply age, P0/P1 latency, retry/dead-letter counts, browser coverage, sync lag, unknown outcomes, user blockers, prevented duplicate attempts and actual duplicate incidents.

Configuration: rule trigger frequency, blocked actions, corrected profile facts, stale draft invalidations, regression-suite results and post-release outcome changes. A frequently triggered rule may identify a bug; it is not automatically a rule to remove.

Usage: reported tokens/allowance/reset state where observable, API charges only when configured, and separate infrastructure/connector/browser costs. Unknown usage is unknown, not zero. Estimated token costs from a CLI are not automatically an invoice.

## 5. Recovery and release management

On worker loss, recover safe tasks from checkpoints. On possible remote acceptance, reconcile the action ledger. On database outage, stop effects requiring durable state. On Redis loss, rebuild dispatch from the database. On configuration rollback, move the active pointer and recheck pending critical effects; completed sends cannot be undone by a config rollback.

Keep development/test/production accounts and data separate. Test backups by restoring a workflow, its exact artifact and pending action history. On restore, reconcile effects after the recovery watermark before dispatch resumes. A single server can provide continuous operation with recovery, but is not itself high availability.

## 6. Autopilot operations and measurement

Persist actionable notifications before acknowledging the originating blocker. Inbox state survives restarts and synchronizes across sessions. Deduplicate recurring questions and recheck stale approvals using immutable payload/configuration references. Expose answer, approve once, reject, snooze, skip, scoped remember and authenticated takeover with accessible labels. Unanswered work releases capacity and does not pause unrelated entities.

Extend metrics with autonomous completion rate, owner minutes/week, actionable interruptions, repeated questions, deadline misses, stale approvals prevented, profile field verification rate, source coverage and qualified inbound leads. Measure outcome quality alongside autonomy so guesses or dropped work cannot inflate success. Learning reports show sample size, maturity, baseline, uncertainty and attribution limitations.

Establish a workload benchmark before quoting capacity: representative research, resume, form, reply, profile and learning tasks; browser sessions; API limits; model minutes; queue age; retries and monthly cost per verified outcome. Test at the proposed target and overload levels with restart/reconciliation scenarios. Publish measured throughput and worst/percentile latency, not a capacity inferred from agent count. Budget learning, profile scans, notifications and capability refreshes in addition to applications. No capacity or uptime promise is established by these templates.

## 7. Release 4.0 dashboard and operation contract

Keep ordinary controls outcome-oriented: completed work with proof, current work, next actions, decisions and spend. Advanced traces, schema settings and vendor details are drill-downs. Add real-browser preview/takeover with exclusive human/worker ownership, explicit challenge states, cost and session expiry. Add profile/content editors, commercial proposal editor and capability coverage with tested dates.

Compute normal counts, timers, account health and unchanged-source checks in code. Record measured and estimated usage separately, including learning, browser interpretation and failed attempts. Show hiring and client funnels separately; share capacity and duplicate-contact prevention. External telemetry and cross-user learning require opt-in. Privacy retention includes screenshots and remote recordings, not just text logs.

Readiness, backup/restore, actionable notification latency, supported-flow completion and clean-install gates are defined in documents 14 and 16. All objectives are proposed until measured on a specified release and deployment.
