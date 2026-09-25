# Technology Decisions and Research Sources

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

Research date: 26 September 2026. These are design selections, not installed dependencies or integration tests. Primary repositories and documentation were read. No dependency version is pinned yet because there is no executable application; implementation must resolve and record exact releases, licenses and compatibility. Do not choose by star count alone.

## 1. Adopt, evaluate or defer

| Project | Decision | Reason and constraint |
|---|---|---|
| [microsoft/playwright](https://github.com/microsoft/playwright) | Default browser control and browser integration tests | Real browser automation; Apache-2.0 as shown by repository. Prefer deterministic supported flows. It does not supply application policy or universal portal support. |
| [taskforcesh/bullmq](https://github.com/taskforcesh/bullmq) | Keep existing Redis-backed task delivery choice | MIT project; PostgreSQL remains business/effect truth. Queue retries do not guarantee exactly-once external sends. Use the chosen release's supported Redis configuration. |
| [browserbase/stagehand](https://github.com/browserbase/stagehand) | Optional bounded browser interpretation/cache experiment | MIT project; consider when it improves held-out portal success/cost. Separate model billing and evolving API surface require explicit setup and pinning. |
| [browser-use/browser-use](https://github.com/browser-use/browser-use) | Benchmark alternative, not a second default browser stack | MIT Python library with separate model/hosted-service costs. Evaluate only if it materially improves supported tasks; avoid adding a second runtime just for popularity. |
| [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo) | Candidate evaluation tooling | MIT CLI/library for repeatable model/prompt evaluations. Use sanitized fixtures and explicit test budgets; live-provider evaluation is not free by default. |
| [langchain-ai/langgraphjs](https://github.com/langchain-ai/langgraphjs) | Defer until bounded workflow implementation proves insufficient | MIT stateful agent orchestration. A graph library does not replace external-action authorization or verification. Do not duplicate durable state between frameworks accidentally. |
| [temporalio/sdk-typescript](https://github.com/temporalio/sdk-typescript) | Alternative future orchestration decision | MIT SDK for durable workflows; entails its own server/operations model. Revisit if complex long-lived workflow maintenance outweighs migration cost; do not run two workflow owners for one action. |

OpenTelemetry is the instrumentation convention for traces/metrics/logs. A paid observability backend is optional. Store compact redacted traces locally by default and let owners choose an exporter. [Official overview](https://opentelemetry.io/docs/what-is-opentelemetry/).

## 2. Architectural decisions

- **ADR-001 — Modular application first:** one TypeScript codebase, web/API, worker and isolated browser processes; no Kubernetes, service mesh or service per agent in the first release.
- **ADR-002 — One durable owner:** PostgreSQL revisions, outbox, claims and action ledger; BullMQ transports ready work. Reconcile unknown effects instead of blind retries. [Idempotent-job guidance](https://docs.bullmq.io/patterns/idempotent-jobs).
- **ADR-003 — Optional cloud:** local browser and private storage remain supported; Browserbase is the first cloud adapter candidate. No purchase/provisioning has been performed.
- **ADR-004 — Deterministic first:** rules and evidence boundaries in code; models provide typed proposals. Avoid repeated planning for stable workflows. [Agent/workflow guidance](https://www.anthropic.com/engineering/building-effective-agents).
- **ADR-005 — Small retrieved context:** metadata/full-text first, exact facts and provenance, cache invalidation, embeddings only after a measured retrieval gap. Retrieval techniques must be evaluated on this corpus rather than importing published gains. [Contextual retrieval research](https://www.anthropic.com/engineering/contextual-retrieval).
- **ADR-006 — No implicit billing:** official owner CLI is the initial model route; optional SDK/API models and hosted browser intelligence require their own configured budget. API prompt-cache behavior is not a subscription allowance guarantee.
- **ADR-007 — Strategy learning, not production self-rewriting:** allowed content/selection changes can auto-promote through the independent release service; runtime code, grants, facts and evaluators remain protected.
- **ADR-008 — Separate acquisition modes:** hiring and client-growth share infrastructure, not targets, commitments or conversion metrics.

## 3. Browser evidence and limitations

[Playwright locators](https://playwright.dev/docs/locators) support user-facing targeting and waiting. [Authentication documentation](https://playwright.dev/docs/auth) warns about sensitive persisted browser state. Use those features with explicit process/network isolation.

[Browserbase contexts](https://docs.browserbase.com/platform/browser/core-features/contexts) document reusable session state. [Live views](https://docs.browserbase.com/platform/browser/observability/session-live-view) document interactive takeover, including mobile input limitations. [CAPTCHA solving](https://docs.browserbase.com/platform/identity/captcha-solving) documents supported challenge handling; [pricing](https://www.browserbase.com/pricing) distinguishes plan capabilities. This establishes a plausible integration route, not compatibility with every job portal.

[Stagehand caching](https://docs.stagehand.dev/v3/best-practices/caching) documents cached action resolution. Agent OS adds fresh gateway checks and outcome verification; cached actions must never stand in for current authorization. Treat caches as private unless deliberately sanitized into synthetic fixtures, even when upstream examples suggest committing caches.

The provider-directory lookup was attempted but unavailable because local authentication was expired. Selection used public first-party sources instead. No vendor claim about universal access or higher conversion is adopted as an Agent OS guarantee.

## 4. Efficiency, setup and publication sources

- [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching): repeated-prefix processing and measured cache usage; API-specific details require runtime support.
- [OpenAI latency optimization](https://developers.openai.com/api/docs/guides/latency-optimization): fewer unnecessary calls and shorter relevant outputs.
- [Docker Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/): dependency health/readiness for first-run setup.
- [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository): a reporting channel to enable before release, not a channel configured in this local folder.

## 5. Dependency adoption gate

For each selected package record release/tag and integrity hash, maintainer activity, license of exact artifact, transitive dependencies, runtime compatibility, security review, offline/demo behavior, credential route, hidden hosted dependencies, benchmark delta and removal plan. Reject dependencies whose mandatory effects cannot pass the gateway. Reproduce a minimal vertical slice before promoting an experimental integration to supported. Update this decision record when evidence changes; do not add every framework in this table to the application.
