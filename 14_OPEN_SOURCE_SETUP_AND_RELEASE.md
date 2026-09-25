# Open-Source Setup and Release Contract

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

## 1. Current status versus release requirement

This repository currently contains a design specification and empty configuration templates. It has no application installer, package manifest, containers, migrations, demo UI or executable runtime. Cloning it today provides documents only. Do not publish a working-product badge, fabricated install command or screenshot presented as an implemented screen.

The first executable release must let a new user clone a tagged release, run a documented preflight/setup entry point, open a local dashboard, complete a no-credentials demo, then connect their own accounts. Ordinary users use the setup UI; they are not expected to understand or hand-edit every YAML template. These files define the contracts that developers must implement.

## 2. Supported deployment paths

| Path | Purpose | Dependencies/behavior |
|---|---|---|
| Demo | Learn and verify installation without secrets or charges | Synthetic candidate, jobs, inbox, browser fixtures and mock model responses; no external effects |
| Personal local | One owner on their machine | App, database, queue and browser; owner-controlled official CLI runner; work pauses while machine sleeps |
| Personal server | Continuous operation | Same release artifacts on an always-on host, authenticated UI, TLS and backup policy |
| Optional cloud browser | Outsource browser process/session hosting | Explicit provider credentials, cost cap and disclosure of data leaving the host |

Bring-your-own runtime/account and native/local adapters keep paid cloud services optional. No bundled shared credentials, central subscription-token relay or required paid telemetry. Paid model APIs are optional explicit configurations, never fallback. A fully offline demo uses canned outputs; it must not be marketed as live model reasoning.

Initial test targets: Linux x86_64 server, macOS arm64 local, and Windows through WSL2. Add native Windows/macOS Intel only after clean-machine tests. Publish exact tested OS/runtime/browser/container versions and known limits with each release. A proposed pilot machine is 4 CPU cores, 8 GB RAM and 20 GB free disk with one browser; this is a benchmark starting point, not a proven minimum. No GPU is needed for the remote CLI route; local models would have separate hardware requirements.

## 3. Packaging and process boundaries

Use one TypeScript workspace and a modular application, a worker entry point, an isolated browser service, PostgreSQL and Redis/BullMQ. Keep connector/coordinator modules within those processes initially. Use a pinned Node LTS, package-manager version and lockfile selected and tested during implementation. Pin container digests and browser/runtime compatibility; avoid floating latest tags.

Provide Compose profiles for demo and live infrastructure plus a host runner for native CLI login when needed. Do not mount the entire home directory or Docker socket into agent containers. Pair a host runner using a scoped app-issued credential and outbound connection. The official CLI keeps its native credential lifecycle. Server-side runtime placement must pass supported login and isolation tests; a cloud browser is not a model-runtime login solution.

App readiness requires database connectivity, completed migrations and essential services, not just a running process. Compose health checks and dependency readiness must be used deliberately; process order alone is insufficient. [Docker startup guidance](https://docs.docker.com/compose/how-tos/startup-order/).

## 4. First-run wizard and doctor contract

Preflight checks supported OS/architecture, required runtime/container engine, disk/RAM, free ports, DNS/TLS, filesystem permissions, clock/timezone, browser sandbox and selected credential route. Report each issue with a fix and recheck control. Never print tokens or mutate unrelated system configuration to fix a prerequisite.

Setup generates installation-specific secrets, creates private data directories, validates configuration, waits for services, applies migrations under a lock, seeds demo or empty live data, and creates the owner account through a one-time local setup flow. No default password and no publicly exposed unauthenticated dashboard. Demo and live stores are separate; demo state cannot grant live permissions.

The wizard imports facts, previews extracted claims, proposes preferences/caps, connects selected accounts, runs read-only tests, verifies browser/runtime capability, chooses hiring/client mode and publishes the standing mandate. Show ready versus unavailable capabilities rather than blocking on every optional integration. Mark the exact activation state; no live effects before valid onboarding.

Setup is idempotent: rerunning does not replace secrets, erase facts, duplicate accounts, reset grants or send test emails. The doctor can run repeatedly without paid model calls by default. An optional live model probe states cost/allowance implications and is within the setup mandate. Exact command names and instructions must be generated from the implemented CLI help and tested; they are intentionally not invented here.

## 5. Repository structure to implement

| Path/module | Required responsibility |
|---|---|
| app | UI, authenticated API and onboarding |
| worker | Coordinator, queues, timers, notifications and effect gateway |
| browser | Scoped browser service and takeover transport |
| contracts | Shared schemas, rule vocabulary, adapter interfaces and error taxonomy |
| runtime-adapters | Official CLI adapters and optional explicitly billed API adapters |
| integrations | Provider/domain adapters with capability manifests |
| skills | Versioned bounded procedures, examples and evaluation cases |
| migrations | Ordered DB changes and compatibility checks |
| fixtures | Synthetic candidate, inbox, portal, client and challenge cases |
| evaluations | Quality, cost, prompt-injection and workflow benchmark suites |
| deployment | Pinned Compose files, packaging and backup/restore tools |

These modules are proposed, not directories already implemented. Prefer small cohesive packages over a plugin system that executes arbitrary downloaded code.

## 6. Open-source maintenance

Before public release, choose and include a recognized license with verified copyright ownership; MIT is the proposed project default, subject to the owner's release decision. No LICENSE is silently inferred from dependencies. Audit exact package, bundled asset, font, browser and image licenses, include required notices and publish a software bill of materials. Source repositories can have differently licensed hosted or commercial features.

Publish CONTRIBUTING, SECURITY, release notes, code of conduct, issue templates, supported-version policy, adapter author guide and maintainer/review responsibilities. Require capability changes to include conformance tests, fixture permissions, error handling, cost declaration and verification behavior. Never accept real recruiter messages, candidate resumes, auth state or cookies in public fixtures/issues.

Default analytics remain local; external telemetry is opt-in with a payload preview. Private owner data never enters a global training set automatically. Dependencies receive automated update proposals, security review, lockfile verification and benchmark gates. Pin CI actions to reviewed revisions and restrict write permissions; fork PRs must not receive production secrets. Do not auto-merge model-authored changes to the action gateway or production deployment.

## 7. Updates, backup and removal

Before upgrade, show breaking configuration changes and capability changes, take and verify a recoverable backup, drain effects, apply migrations once, check readiness and reconcile pending unknown actions before resuming. Configuration rollback and database rollback are different: irreversible migrations require forward repair or a tested restore. Old browser receipts remain auditable across upgrades.

Provide encrypted backup/restore of state, artifact hashes and pending-action history, with a safe policy for secret recovery. A restored instance starts with external dispatch held until events since the recovery watermark are reconciled. Prevent two restored copies from using the same active account concurrently. Document uninstall with separate keep-data/delete-data choices, grant revocation, remote session cleanup and outstanding provider charges; local file deletion is not upstream account revocation.

## 8. Clone-to-value release gate

CI and release QA must test fresh installs on declared targets, rerun setup, no credentials, expired credentials, offline provider, port collision, disk full, migration failure, upgrade from the last supported release, restore and uninstallation. Measure download time separately from boot/setup time. Include a new-user usability run following README instructions without maintainer hints.

Demo must show a completed synthetic workflow and question/resumption without contacting providers. Live setup must fail with a specific actionable message, never an unexplained stack trace. There is no zero-error guarantee: the release requirement is tested normal operation plus safe, understandable, recoverable failure. Do not call the repository clone-and-run ready until this gate has recorded evidence.
