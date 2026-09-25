# Browser Execution, Cloud Sessions and Challenges

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

## 1. Concrete implementation choice

Use Playwright with a dedicated Chromium browser as the default browser engine. A real browser executes JavaScript, supports file upload and handles multi-step forms; a fetched HTML page alone is not an application engine. Prefer role/label-based locators and actionability waits, with portal-specific recipe and receipt tests. [Playwright locators](https://playwright.dev/docs/locators).

Local/self-hosted mode runs an isolated browser worker with no cloud-browser subscription. Browserbase is the first optional cloud transport candidate because its published interfaces support persistent contexts and interactive live views. Treat that as a documented integration choice, not a completed compatibility test. Keep an internal transport interface so another provider can be added through conformance tests. [Contexts](https://docs.browserbase.com/platform/browser/core-features/contexts), [live views](https://docs.browserbase.com/platform/browser/observability/session-live-view).

Stagehand is an optional evaluated layer for ambiguous field discovery and cached action recipes; it is not required for deterministic Playwright actions. Its model API/gateway costs remain separate from the official CLI runtime. The repository and versioned docs may evolve independently: pin an exact tested release and matching API docs before writing the adapter. No unreviewed latest-branch snippets in production. [Stagehand repository](https://github.com/browserbase/stagehand), [caching documentation](https://docs.stagehand.dev/v3/best-practices/caching).

## 2. Browser adapter contract

Operations: create scoped session, inspect page, navigate allowed destination, fill mapped field, upload immutable asset, verify preconditions, dispatch approved effect, capture receipt, detect challenge, open takeover, checkpoint, close and reconcile. Every operation declares cost classification, timeout, permitted domains, account binding, possible side effects and evidence schema.

A portal manifest defines tested form families, locale, required field semantics, attachment formats, save/submit behavior, confirmation patterns, challenge handling, data disclosures, adapter version and coverage fixtures. An unknown portal may be inspected read-only; it is not auto-approved for submission. Bounded read-only field remapping can adapt known layouts, but a changed submit meaning or destination requires adapter review. Generated code never runs as an unrestricted repair.

Field entry and uploads may transmit personal data or trigger autosave before the final Submit button. Classify and authorize these disclosures before the first such interaction; “not submitted yet” does not mean “no external effect.” Verify uploaded file identity and recipient scope, and reconcile partial saves independently of final submission.

Navigate only after URL/redirect validation and block internal/private-network destinations at the network boundary. Frame/subresource allowlists must accommodate documented authentication/CDN dependencies without exposing arbitrary network access. Browser context isolation alone is not OS isolation. Use non-root workers, resource limits, restricted filesystem mounts and scoped service credentials. Keep unrelated personal browsing sessions out of the runtime.

## 3. Session ownership and recovery

Bind each session to workspace, user, account, origin group and attempt. Serialize writers to a persisted context. Encrypt stored session state and protect cloud connection/live-view URLs as credentials. Never commit browser storage state; Playwright warns that it may contain impersonation-capable cookies and headers. [Authentication guidance](https://playwright.dev/docs/auth).

Checkpoint verified answers, artifact IDs, current stage and evidence, not cookies in ordinary workflow rows. Remote sessions have maximum duration and idle cost caps. Close them on completion and after bounded waiting; retain only permitted encrypted auth state. Reopen from a checkpoint with fresh validation. A saved page URL does not guarantee that transient form state survived.

Before final submission, lock the entity, reconcile earlier attempts, recheck grants/facts/destination and persist intent. After dispatch, verify matching receipt, provider record or confirmation message. Any possible acceptance plus timeout becomes OUTCOME_UNKNOWN. Neither a challenge event nor an AI assertion is proof of successful submission.

## 4. CAPTCHA and authentication state machine

READY → CHALLENGE_DETECTED → SUPPORTED_SOLVER_PENDING or USER_TAKEOVER_REQUIRED → REVALIDATING → READY, with FAILED/EXPIRED branches. Classify CAPTCHA, login, one-time passcode, consent screen, identity verification, access denied and rate limit separately.

When the user and site permit the workflow and the provider/account supports that challenge, enable the provider's documented solver under the browser budget. Browserbase documents supported CAPTCHA solving and lifecycle events; configure it explicitly rather than relying on an account default. Recheck the page after a success event. [CAPTCHA documentation](https://docs.browserbase.com/platform/identity/captcha-solving).

Use one bounded automatic solver attempt per challenge instance initially, with a configurable 60-second timeout and per-run cost ceiling. A challenge may take longer or remain unsupported; timeout is an exception, not permission to loop. Provider docs and plan capabilities must be checked during setup. Do not promise universal CAPTCHA resolution or conflate CAPTCHA with MFA, KYC, an account ban or a site's refusal of automation. No account rotation or repeated challenge attempts to evade an access denial.

For unresolved challenges, preserve progress and show a Decision Inbox task with **Open browser and continue**. The owner completes identity/login steps in the original scoped session when still available. Credentials and one-time codes are entered through secure takeover, not ordinary chat/log fields. While a human controls the browser, the automation lease is suspended; on return revoke takeover access, reacquire exclusive control and inspect state before any effect.

Local takeover uses a dedicated headed browser or authenticated self-hosted remote-view service. Cloud takeover uses a provider-supported live view behind app authentication, short-lived access, ownership checks and origin validation. A CSS pointer-events setting is not authorization. If a provider cannot enforce view-only access, do not expose its interactive URL as a harmless preview. Mobile keyboard support needs explicit tests; do not claim mobile takeover parity until it works.

## 5. Browser dashboard

Show session owner, domain, workflow, current stage, active/idle time, incurred/estimated cost, account health, challenge status, masked preview and last verified action. Actions: inspect, request takeover, return control, pause, close and open related decision. Do not provide a generic retry-submit button for unknown outcomes.

Retain redacted screenshots/receipts and traces under the configured policy. Screenshots and recordings can contain personal data even when text logs are redacted; default to minimal capture, restrict playback and offer deletion/export. Provider retention and deletion status are displayed separately from local deletion. Show capability status per domain, including last test and unresolved failures.

## 6. Cloud cost and acceptance

On 26 September 2026, Browserbase's pricing page lists a Developer plan at $20/month with 100 browser hours and $0.12/additional browser hour; model gateway, proxies and other services have separate pricing. This is a reference snapshot, not a total Agent OS quote. Its free plan and paid plans differ in CAPTCHA capability. Revalidate account entitlement at setup. [Published pricing](https://www.browserbase.com/pricing).

Tests must cover file upload, cross-frame forms, redirects, expired auth, supported and unsupported challenges, stale locators, human/worker races, session expiry, rejected attachments, partial forms and post-submit timeouts. Use owned/synthetic challenge fixtures for CI; never run blind submission tests against real job postings. Live portal capability requires separately authorized, recorded testing and a freshness date.
