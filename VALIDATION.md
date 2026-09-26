# Validation record

Verified on 26 September 2026 (Asia/Kolkata), macOS arm64, Node 22.22.3, PostgreSQL 17.6 in Docker, Next.js 16.3.6. These results apply to v0.1's implemented local slice, not the full design.

## Automated checks

- Production build and TypeScript check passed.
- Unit tests cover schema validation, safe source URL construction, skill matching, immutable profile revisions, truthful draft scaffolding, insufficient learning cohorts and invalid AI evidence references.
- Isolated PostgreSQL integration test verifies 10 concurrent queue requests create one run, concurrent workers create one package/decision, pause/resume, cached regeneration, daily caps, resolved-decision protection, and synthetic feedback exclusion.
- API smoke checks verified health, state, exports, invalid-input handling and rejection of unexpected Origin/Host headers.
- Private SQL backup restored into an isolated database; opportunity/artifact counts were verified and the test copy removed.
- Dependency audit: zero known vulnerabilities at the recorded check. This is time-specific, not a security guarantee.

## Measured preparation workload

`npm run benchmark` creates a disposable database, 50 synthetic jobs and a fictional profile, then processes jobs with one worker. It checks 50 completed runs, 50 artifacts and 50 decisions before removing that database.

| Measurement | Observed |
|---|---:|
| Synthetic workflows | 50 |
| Successful local preparations | 50 |
| Total processing time | 186 ms |
| Median per workflow | 4 ms |
| p95 per workflow | 5 ms |
| Model calls | 0 |

This benchmark excludes model inference, source fetches, browser execution, setup, queue insertion and end-user response time. It must not be extrapolated into applications-per-hour, supported users, or production success rate. There is no live browser/load benchmark.

## Live local checks

Two public employer boards returned three matching opportunities. The local worker prepared three packages and review items. Two Codex briefs completed through the owner's existing login: reported input tokens 11,021 and 11,090; output tokens 607 and 653. That includes CLI/provider prompt overhead, so bounded task context does not mean a tiny total prompt. No paid API fallback was used and no external messages/applications were submitted.

Composio API key verification succeeded and the account dashboard showed the Hobby free plan. Account connection is a separate consent flow; a valid project key does not imply mailbox access. No keys or profile data are included in this report.

## Remaining validation

No claim of universal operating-system support, production multi-tenancy, autonomous external effects, universal CAPTCHA solving, validated strategy improvement or guaranteed commercial results. See IMPLEMENTATION_STATUS.md. Browser/UI smoke checks and CI results should be reviewed with each change; benchmark results are not a substitute for them.

## Performance and failure testing — 26 September 2026 update

A comparison processed 1,000 synthetic local workflows against isolated databases. Both runs produced exactly 1,000 completed runs, artifacts and decision records, with zero model calls.

| Concurrency | Total measured processing | Median task | p95 task |
|---|---:|---:|---:|
| 1 | 3,783 ms | 4 ms | 5 ms |
| 7 | 930 ms | 6 ms | 8 ms |

The parallel run was approximately 4.1× faster in total processing time, with increased individual-task latency. This excludes queue insertion, scheduler idle intervals, external sources, model calls and browser operations. It is not a production applications-per-second claim or proof that 7 is the globally optimal setting.

New tests cover independently scheduled lanes, limits, oversized UTF-8 source responses, model cancellation/timeouts/malformed output/early exit, integration-secret exclusion from the model environment, injected artifact-write failures, rollback of incomplete effects, retry exhaustion, poison-job quarantine, forced PostgreSQL connection loss and recovery, source-sync serialization and cancellation after lock-connection loss, AI single-session locking and failure-circuit suppression, stale-inference reconciliation, plus 200 workflows submitted twice and processed with eight concurrent tasks. Integration scenarios use disposable databases. No test sends real applications or messages, and no finite suite establishes perfection across all scenarios.

## Simplified desk and agent maturity

The 19-test suite (17 non-database tests plus two isolated database suites) passes. New checks cover maturity thresholds, failure/retry regression, sample exclusion, 30-day expiry, stale worker health, paused/disabled/cap states and AI cooling-down status. Browser verification covered Home, persistent agent badges, Agents evidence, Inbox's default open-only filter, and Pause → Resume. Production build and deployed health/API checks pass. This is execution-evidence reporting, not a validated strategy-learning system.

## Automatic clarification and audit

Added two pure clarification tests plus database scenarios for partial compound answers, exact excerpt preservation, unknown questions, protected commitments, missing corroboration, pause behavior, preserving owner answers, idempotent repeated passes and re-evaluation after evidence changes. Browser verification shows four agent activities, audit rows and automatically handled blocked clarification items. Existing end-to-end preparation tests remain applicable; no external sending/submission tests or capabilities were added.

## Access-first workspace and approved actions — 26 September 2026

Twenty-five tests now pass: 22 non-database tests and three disposable PostgreSQL suites. New checks cover source-backed profile extraction, unsupported quotes/values, profile preview acceptance, account-bound approval hashes, timezone normalization, duplicate payloads, concurrent dispatch, suppression, cooldown, pause/access gates, reply holds, calendar conflicts, daily limits, cancellation races, missing receipts and interrupted/unknown delivery. Outbound execution is tested through fake providers; no live email or calendar invitation was sent.

Browser checks verified access-first gating, disabled unconnected outreach, explicit preparation mode, pasted synthetic résumé extraction with nine source-backed facts, projects and experience, preservation of the owner's saved profile, Pause/Resume, formatted lead cards and draft sections, keyboard dismissal of the draft dialog, work forms, capability catalog and activity audits. A real Codex extraction produced a preview only; it was not accepted as the owner's profile.

Seven additional employer boards were configured from observed public listings. Read-only synchronization added 70 listings (73 total real leads), including location-restricted roles that still need eligibility review. Worker preparation continued automatically. This is a listing/preparation count, not verified suitability, applications sent or hiring outcomes. Production build, type check, formatting, diagnostics and API origin/host smoke checks passed. Google account consent remains the live outreach blocker. No finite test suite establishes error-free operation.

## 0.2.0 connection and release checks

29 tests pass (26 non-database plus three isolated database suites), including hosted OAuth routing, rejected redirect hosts/credentials, auth-config toolkit/scheme/scope validation, local readiness states and package/release version consistency. Production build and type check passed. No new framework or cloud subscription was provisioned. Live provider consent and delivery remain separate release limitations.

Live browser verification of 0.2.0: Library → System correctly reported local worker/profile/source readiness, AI attempts and incomplete token usage. The repaired Gmail button generated a secure Composio hosted link and reached Google's account chooser. After selecting the owner's account, Google returned “This app is blocked”; no new mailbox consent or delivery occurred. Provider auth-config metadata passed the declared Gmail OAuth policy check without exposing credentials. This distinguishes the repaired app-side connection flow from the unresolved provider restriction.

## Connection redirects and AI attribution — 2026-09-26

- 30 unit tests and 3 isolated database integration tests passed. Production build and formatting checks passed.
- Deployed schema additions after a private database backup; rebuilt and reinstalled both local services. Health, doctor and smoke checks passed after service startup.
- Browser verified direct Connect Gmail navigation through hosted authorization to Google. Google still reports “This app is blocked”; no consent grant or message sending occurred.
- Library → System visibly reports the local worker's provider, login billing method, reported account plan, per-task token totals, unknown historical models, and incomplete usage. Account metadata lookup performs no model inference.
- A fabricated successful OAuth callback did not unlock outreach; provider capabilities remained disconnected.
