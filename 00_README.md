# Agent OS — Configurable Project Starter

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

**Design release 4.0 · 26 September 2026 · Documentation and configuration templates**

This is a reusable job-search, client-acquisition, conversation and professional-presence agent platform, designed for one-time onboarding followed by default automatic operation and an exception-only Decision Inbox. No real owner data or credentials are included in the public repository. Private local setup data is excluded from Git. The working alpha provides a profile editor and validated JSON import.

These numbered files are the project specification. A local alpha now runs alongside them; YAML files remain proposed contracts and are not loaded by the runtime. The alpha does not submit applications or send outreach.

## Files and reading order

| File | Purpose |
|---|---|
| [01_ARCHITECTURE.md](01_ARCHITECTURE.md) | System boundaries, official CLI execution, queues and recovery |
| [02_AGENTS_AND_SKILLS.md](02_AGENTS_AND_SKILLS.md) | Specialized roles, reusable skills, memory and knowledge |
| [03_PROFILE_RULES_CHANGE_FLOW.md](03_PROFILE_RULES_CHANGE_FLOW.md) | Separate user data/preferences/rules, updates, evaluation, publishing and rollback |
| [04_ACCESS_COMPOSIO_MCP.md](04_ACCESS_COMPOSIO_MCP.md) | Native adapters, optional Composio, MCP, account permissions and setup UI |
| [05_JOB_WORKFLOWS_OUTPUTS.md](05_JOB_WORKFLOWS_OUTPUTS.md) | Research, outreach, browser applications, resume outputs and follow-ups |
| [06_DB_UI_OPERATIONS.md](06_DB_UI_OPERATIONS.md) | Database contracts, editable UI, metrics and 24/7 operation |
| [07_BUILD_TESTS_SOURCES.md](07_BUILD_TESTS_SOURCES.md) | Build sequence, acceptance tests, design decisions and official sources |
| [08_AUTOPILOT_AND_DECISION_INBOX.md](08_AUTOPILOT_AND_DECISION_INBOX.md) | One-time mandate, automatic workflows, questions, approvals and resumption |
| [09_LEARNING_AND_MARKET_INTELLIGENCE.md](09_LEARNING_AND_MARKET_INTELLIGENCE.md) | Recruiter evidence, bounded self-improvement, experiments and country/source discovery |
| [10_PROFILE_PRESENCE_AND_CONTENT.md](10_PROFILE_PRESENCE_AND_CONTENT.md) | Platform coverage, profile audits, content packages and verified publishing |
| [11_PRODUCT_STRATEGY_AND_CLIENT_GROWTH.md](11_PRODUCT_STRATEGY_AND_CLIENT_GROWTH.md) | Product focus, client projects, hiring strategy and first-hours outcomes |
| [12_TOKEN_LATENCY_AND_QUALITY_ENGINEERING.md](12_TOKEN_LATENCY_AND_QUALITY_ENGINEERING.md) | Deterministic workflows, context, caching, model budgets and quality benchmarks |
| [13_BROWSER_EXECUTION_AND_CHALLENGES.md](13_BROWSER_EXECUTION_AND_CHALLENGES.md) | Playwright, optional cloud browsers, CAPTCHA support and secure takeover |
| [14_OPEN_SOURCE_SETUP_AND_RELEASE.md](14_OPEN_SOURCE_SETUP_AND_RELEASE.md) | Clone/setup contract, demo, diagnostics, packaging, maintenance and release gates |
| [15_TECHNOLOGY_DECISIONS_AND_SOURCES.md](15_TECHNOLOGY_DECISIONS_AND_SOURCES.md) | Primary research, repository shortlist and adopt/evaluate/defer decisions |
| [16_RELIABILITY_SECURITY_AND_ACCEPTANCE.md](16_RELIABILITY_SECURITY_AND_ACCEPTANCE.md) | Engineering principles, dashboard/editor requirements, security and measured acceptance |
| [growth.template.yaml](growth.template.yaml) | Hiring/client mode, services, commercial boundaries and capacity |
| [efficiency.template.yaml](efficiency.template.yaml) | Deterministic-first execution, context/cache controls and measurement |
| [browser.template.yaml](browser.template.yaml) | Browser transport, session isolation, challenge and takeover limits |
| [deployment.template.yaml](deployment.template.yaml) | Demo/live setup, packaging, privacy and release readiness |
| [autonomy.template.yaml](autonomy.template.yaml) | Default autopilot mode, standing mandate and decision boundaries |
| [learning.template.yaml](learning.template.yaml) | Strategy promotion envelope, experiments and market discovery |
| [presence.template.yaml](presence.template.yaml) | Profile inventory, field grants, audits and publication defaults |
| [profile.template.yaml](profile.template.yaml) | Empty identity, facts, resume/source references and links |
| [preferences.template.yaml](preferences.template.yaml) | Empty editable job preferences and scheduling/communication choices |
| [rules.yaml](rules.yaml) | Draft operating rules, including action gates and bounded retries |
| [connections.template.yaml](connections.template.yaml) | Empty connected-account/resource mappings and optional Composio settings |
| [runtime.template.yaml](runtime.template.yaml) | Runtime, deployment, queue and subscription routing defaults |

## Design goals

1. Profile details and links are data, never copied permanently into every prompt.
2. Preferences select relevant opportunities; operating rules control agent behavior.
3. Skills describe reusable procedures; permissions are enforced by application code.
4. Each action has one owner, an immutable intent and checkable outcome evidence.
5. Rule changes are observable, testable and reversible.
6. Account connection and permission to use that account are separate decisions.
7. After validated onboarding, routine permitted work runs automatically; unresolved decisions interrupt only affected work.
8. Learn from verified outcomes through bounded strategy experiments; do not mistake generic rejection for proof of a resume defect.
9. Audit and improve relevant professional profiles, automatically publishing supported, authorized fields and preparing complete manual-update packages elsewhere.
10. The system can operate continuously on an always-on server, while quotas, auth expiry and candidate-only decisions remain explicit states.

## Start sequence after design finalization

Implement the configuration schemas and revision store, then the durable coordinator/action gateway, one official CLI adapter, and read-only integration health checks. Add the profile/rules UI, skills and sources, then one complete opportunity-to-application workflow. The authoritative release sequence in 07_BUILD_TESTS_SOURCES.md and 11_PRODUCT_STRATEGY_AND_CLIENT_GROWTH.md adds replies, scheduling, client acquisition and profile publishing after the relevant correctness gates. Start with a synthetic demo and one complete live workflow, not every integration at once.

A missing profile should still allow setup and documentation exploration. It blocks only tasks whose required facts are absent. Empty preference arrays mean **not configured**, not “allow everything.” Outbound workflows cannot activate until relevant configuration and account grants pass validation.

The earlier personalized project remains separate. This clean starter replaces it as the proposed configuration-first design; the previous documents are not bundled here.

## Release 4.0 scope and status

The owner sets the mandate once; routine sends, applications, replies, scheduling and profile updates use standing grants rather than per-item approval. New facts, unsupported actions and decisions outside that mandate appear in a persistent UI Decision Inbox. Independent work continues while an answer is pending.

Self-improvement operates through a separate, versioned strategy store and deterministic release service. Agents cannot publish operating rules or grant themselves authority. Eligible strategy changes can be tested and promoted automatically within the owner's approved envelope. Profile/market expansion and protected changes follow the documented decision boundaries.

All numbered documents and 12 YAML contracts are still design artifacts. Repository-facing guidance is in README.md, CONTRIBUTING.md, SECURITY.md and CHANGELOG.md. This release changes requirements and proposed configuration contracts only; it does not install an application, create accounts, publish profiles, activate campaigns or establish measured reliability/capacity. “All platforms” means ongoing relevant-platform discovery with honest capability status, not universal supported automation. No interviews, search ranking or fully unattended success are guaranteed.

## Product and efficiency priorities

Choose hiring, client growth or both during onboarding. Use deterministic filters, field mappings, templates and schedulers before model calls. Scope model context to evidence needed for the current task, reuse exact-version artifacts, and measure cost per verified outcome. Playwright is the default real-browser engine; cloud browsers and additional browser intelligence are optional and separately budgeted.

The first executable release must pass a clean-install/demo gate and publish supported capabilities. First-hours targets concern useful materials and verified supported actions; no error-free installation, universal CAPTCHA solving, first-place profile ranking, job offer or client win is promised. See documents 11–16 for the updated end-to-end requirements.
