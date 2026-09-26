# Agent OS 0.2.0 — Connected opportunity desk

Release status: **local alpha / prerelease**. This is a supported local preparation and approved-work release, not an unattended hiring or universal browser-submission system.

## Supported flow

Connect accounts or explicitly select preparation-only mode → paste résumé/project text → review extracted source-backed facts → discover real opportunities → prepare/edit drafts → resolve documented questions → approve a specific external action → retain its provider receipt or an explicit blocker.

The app includes five main views, live agent activity, operational maturity badges, knowledge notes, bounded writing skills, source/country outcome summaries, account-bound approvals, suppression, contact cooldowns, conservative follow-up checks, calendar conflict checks and unknown-delivery holds. Library → System shows local readiness and partial token usage. Preparation continues while this Mac and Docker are awake.

## External access

- **Required for automated mail:** a Composio project key and an active Gmail connection for this app's owner and outreach auth configuration. Scopes: `gmail.readonly` and `gmail.send`. A read-only connection cannot send.
- **Required for invitations:** active Google Calendar connection with `calendar.events` scope. This does not imply the invitee accepted.
- **Required for profile extraction / optional briefs:** configured, signed-in Codex CLI and available account allowance. Local deterministic drafting does not use model tokens.
- **No new paid cloud subscription:** this release retains local PostgreSQL, the existing worker and existing provider accounts. No browser-cloud, n8n hosting or extra model provider was provisioned.

Managed OAuth now uses Composio's hosted `connectedAccounts.link()` method. The older managed-OAuth `initiate()` path was retired. If Google blocks managed consent, configure a supported Google OAuth application in Composio, then attach its auth configuration ID under Access & setup. The app checks toolkit, enabled OAuth scheme and declared required scopes before saving it. Changing configurations resets pending approvals for that service to drafts. Client secrets stay in Composio. Provider consent remains necessary; this is not a bypass.

Current provider guidance: [hosted authentication](https://docs.composio.dev/docs/tools-direct/authenticating-tools), [custom auth configurations](https://docs.composio.dev/docs/auth-configuration/custom-auth-configs), [Gmail scopes](https://docs.composio.dev/kb/guide/toolkits-gmail). Declared auth-config scopes and active-account status are readiness signals, not proof that a particular external action will succeed. Provider responses remain authoritative.

## Infrastructure decision

Keep one local application, PostgreSQL and a bounded worker. PostgreSQL already supplies durable claims and transactional local effects; duplicating orchestration would add operational state without removing consent or provider failures.

[LangGraph](https://docs.langchain.com/oss/javascript/langgraph/thinking-in-langgraph) is a future option if branching model workflows need checkpointed intermediate state. [n8n queue mode](https://docs.n8n.io/hosting/scaling/queue-mode/) is a future option if maintaining many business integrations visually becomes necessary; its queue deployment introduces workers and Redis. Neither is required for the present workflow. Arbitrary MCP servers are not accepted by the app: new connectors must pass a typed adapter review, permission restrictions, isolated tests and receipt handling before execution.

The optional Stripe service discovery route was unavailable due to expired existing CLI authentication; no service was provisioned and no payment or subscription was started. It is not an application dependency.

## Release validation and limitations

29 tests: 26 non-database tests plus three disposable PostgreSQL suites. Coverage includes OAuth link routing, redirect restrictions, config scope/toolkit validation, readiness state, extraction provenance, external payload/account binding, duplicate dispatch, suppression, cooldown, reply/conflict holds, quota, cancellation and unknown delivery. Builds and local API checks are required before publishing; current results are in VALIDATION.md.

Automatic browser applications, CAPTCHA execution, mailbox-wide reply/outcome synchronization, autonomous prospect contact discovery, verified strategy self-improvement, multi-user authentication and remote 24/7 hosting remain outside this release. Email/calendar adapters have fake-provider integration coverage; real sending requires a working consented account and an approved real payload. No messages are sent merely by connecting an account. Unknown deliveries are never automatically retried.

## Install / upgrade

Follow README.md. Existing installs: take a private backup, use Node from `.nvmrc`, run `npm ci`, `npm run setup`, tests and build. On macOS run `npm run service:install` to replace the staged runtime. Run `npm run doctor` and inspect Library → System. Existing profiles, leads, drafts and audit history are preserved. No user secrets or private data belong in a release archive.
