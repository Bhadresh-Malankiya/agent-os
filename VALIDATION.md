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
