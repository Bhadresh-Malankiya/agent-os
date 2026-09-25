# Validation record

Verified on 26 September 2026 (Asia/Kolkata), macOS arm64, Node 22.22.3, PostgreSQL 17.6 in Docker, Next.js 16.3.6. These results apply to v0.1's implemented local slice, not the full design.

## Automated checks

- Production build and TypeScript check passed.
- Unit tests cover schema validation, safe source URL construction, skill matching, immutable profile revisions, truthful draft scaffolding, insufficient learning cohorts and invalid AI evidence references.
- Isolated PostgreSQL integration test verifies 10 concurrent queue requests create one run, concurrent workers create one package/decision, pause/resume, cached regeneration, daily caps, resolved-decision protection, and synthetic feedback exclusion.
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
