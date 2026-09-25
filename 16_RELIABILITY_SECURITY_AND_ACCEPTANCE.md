# Reliability, Security, UX and Acceptance

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

## 1. Technical principles as implementation gates

| Principle | Required implementation/evidence |
|---|---|
| One source of truth | Immutable config/artifact revisions, transactional bundle publication, no direct UI edits to active rows |
| Explicit state machines | Typed workflow/effect/decision transitions; unknown transitions rejected |
| At-least-once delivery | Database uniqueness, outbox/inbox, leases with generations; repeated queue delivery does not repeat an equivalent effect |
| External uncertainty | Persist before dispatch, verify after, reconcile possible acceptance before retry |
| Least authority | Scoped service identities, account/field grants, network boundary and gateway-only writes |
| Untrusted inputs | Treat pages/email/docs/plugin text as evidence; injection cannot alter grants or leak secrets |
| Bounded execution | Per-task steps/time/tokens where observable, account quotas, cost reservations, circuit breakers and cancellation |
| Separation of duties | Independent effect verification and strategy release; proposing model cannot alter evaluator |
| Evolvability | Versioned schemas/adapters, compatibility matrix, migration checks and deprecation policy |
| Observability | Correlated run/action IDs, evidence-backed states, redaction, queue age and actual cost |
| Accessibility | Keyboard support, labeled states/errors, focus handling, accessible editors and takeover testing |
| Portability | Self-hosted path, synthetic demo, optional cloud and no publisher-owned service keys |

## 2. Threat and data model

Threats include malicious job pages/messages, compromised plugins, cross-workspace object references, stolen live-view URLs, poisoned learning evidence, forged webhooks, supply-chain compromise and operator error. Test each boundary with synthetic adversarial inputs. Browser and connector side effects remain subject to action authorization even if a tool's prose claims otherwise.

Enforce authenticated ownership on every entity/artifact/decision and websocket subscription. Scope caches and retrieval before ranking; add tenant-isolation tests even for the initial single-owner deployment. Use CSRF/session protections, webhook signature/replay checks, rate limits, scoped outbound destinations and safe file parsers. Quarantine dangerous downloads, bound document size/page count and do not execute macros or fetched scripts as agent tools.

Secrets use a dedicated encrypted store or native provider store with rotation/revocation; never put them in prompts, exported YAML, traces or source control. Encrypt sensitive data at rest and transport it over TLS in server mode. Browser/CDP/takeover endpoints are not public admin backdoors. Explicitly test private-network redirects, DNS rebinding and cross-origin credential leakage at the enforcement layer.

Retention policies cover source documents, profile facts, generated artifacts, conversation metadata, screenshots, recordings and backups separately. Deletion propagates to search caches and dependent proposals; provider-side deletion status is shown honestly. Require explicit opt-in before sharing any data with cloud browser/model/telemetry providers. The owner can export portable data without credentials. Cross-user learning and public benchmark uploads are off by default.

## 3. Dashboard and editors

The default home screen answers: what is running, what completed with proof, what needs me, what will happen next, and how much allowance/budget remains. Modes expose Jobs or Clients pipelines without forcing every advanced screen into onboarding.

Required screens: onboarding/doctor; overview; Decision Inbox; opportunity/lead detail; conversations; applications/proposals; browser live sessions; resume/content library; profile editor/audit; preferences and commercial offering; rules/mandate with diff/dry-run/publish; integrations; calendar; Learning Center; Market Map; cost/capacity; evidence/trace; backup/settings.

Editors have typed fields, inline validation, save drafts, conflict detection, preview, accessible errors, version history and rollback where meaningful. Rich-text content has field length and attachment QA. Advanced schema editing is optional; it cannot execute arbitrary code. Every dashboard total opens the underlying records and explains its denominator. Distinguish draft, attempted, provider-accepted, independently confirmed, owner-reported, unknown, blocked and expired.

Global emergency pause stops new dispatches immediately across modes; already in-flight effects are reconciled. Per-account and per-workflow pause are separate. Disabling notifications does not hide unresolved decisions or resume paused effects.

## 4. Proposed service objectives

These are initial release targets for the reference deployment, not measured promises. Separate platform-controlled latency from provider response time, download speed and user waiting.

| Objective | Proposed gate |
|---|---|
| Persistent decision visibility | p95 within 5 seconds of a committed blocker while UI is connected; recovered after reconnect |
| Due-work dispatch | p95 within 60 seconds when dependencies, quota and reserved capacity are available |
| Reference demo startup | Within 15 minutes on a clean supported machine, measuring image downloads separately |
| First useful live package | Within 1–3 hours after complete setup and sufficient allowance, or explicit remaining blocker |
| Critical invariants | Zero observed unauthorized effects, unsupported claims or duplicate effects in mandatory release suite; any occurrence blocks release |
| Supported-flow completion | At least 95% verified completion on 100 declared synthetic eligible end-to-end cases; publish portal breakdown and failures |
| Isolation and recovery | All mandatory adversarial/restart/restore cases pass; no blind post-restore effects |
| Efficiency | Publish baseline/optimized tokens, calls, latency and cost with quality floor held constant; no preset savings claim |

Passing 100 synthetic cases does not establish a 95% live success guarantee. A separate consented live pilot reports failures and interventions without hiding unavailable portals. Budget RPO/RTO and uptime targets must be selected and tested for the actual deployment. A single host is not high availability.

## 5. Test layers and failure injection

Unit/property tests: schema validation, policy precedence, version comparison, semantic uniqueness, currency/timezone math, cross-mode capacity and action-state transitions. Contract tests: runtime events, connector capability, pagination/cursors, provider retry-after, receipt evidence and cost reporting. Integration tests: transactions/outbox, worker death, queue loss, concurrent claims, profile edits, notification resumption and migration/restore. End-to-end tests: realistic demo portals, replies, client proposals and approvals.

Browser fixtures include multi-step forms, iframes, delayed controls, file rejection, changed labels, unknown required answers, CAPTCHA success/failure, MFA takeover, session expiry and timeout after remote acceptance. Simulate challenges with owned fixtures; third-party challenge coverage is a documented live capability, not inferred from a mock pass.

Model evaluations measure grounded claims, all-request coverage, fit reasoning, proposal assumptions, injection resilience, output schemas, context compression and cost. Use isolated held-out cases and blinded human checks; an LLM grader is not proof of external completion. A passing parser is not semantic correctness.

Load tests use increasing arrival rates and task mixes until queue delay or resource objectives fail. Measure browser memory, DB contention, model allowance, provider limits and urgent queue starvation. Record sustainable throughput with headroom, not peak jobs accepted. Failure tests include lost connectivity, quota exhaustion, disk full, corrupt artifact, webhook replay, abrupt process termination and clock/timezone changes.

## 6. Self-improvement boundary

Production learning can change only the published strategy envelope. New prompts, skills or recipe mappings need versioned evidence and required tests; runtime source changes are generated as reviewable patches, never self-deployed. Candidate facts remain owner-verified. Aggregation uses consented evidence and distinct hiring/client cohorts. Evaluation data cannot be silently added to training or used repeatedly to overfit promotions.

Operational learning can immediately flag or pause a failing adapter; re-enabling it requires its defined repair/validation route. Keep validated fallback templates and versioned procedures so quota limits do not force invented content. Self-improvement means measured progress under constraints, not unlimited self-modification.

## 7. Release evidence bundle

Attach supported-platform/portal matrix, exact dependency/runtime versions, clean-install results, failure/recovery results, held-out quality report, token/latency benchmark, threat-boundary tests, dependency/license inventory, sample redacted trace and known limitations to each executable release. Every capability is marked designed, implemented, tested-synthetic or verified-live. No readiness score may collapse those distinctions.
