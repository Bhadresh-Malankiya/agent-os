# Agent OS

A private opportunity desk for your next role, your next client, and the work in between.

**v0.2.0 — connected opportunity desk, local alpha.** The long-term autonomous-agent design is broader than this release. The table below describes the software that actually runs today. No interview, job, client win, or error-free operation is guaranteed.

See the [0.2.0 release scope and access checklist](RELEASE_0_2.md).

## What works

| Capability | Current behavior |
|---|---|
| Private profile | Paste unstructured résumé/project text → source-backed preview → accept; no field-by-field profile form |
| Job discovery | Greenhouse and Lever public board intake; title filters, deduplication and six-hour refresh |
| Local autopilot | New real opportunities are queued and prepared within a daily limit (10 by default) |
| Application packages | Fact-based Markdown drafts, evidence, skills overlap, review checklist and editing with stored prior versions |
| AI assistance | Optional official Codex CLI briefs; configurable daily attempt cap (2 by default, up to 100), bounded context, 120-second timeout, evidence-ID validation, usage reporting and no paid API fallback |
| Decision inbox | Persistent review questions, owner answers and history; an answer does not submit anything |
| Profile presence | Copy-ready LinkedIn, GitHub, Upwork and portfolio drafts |
| Client projects | Manual lead intake, proposal introduction and outcome recording |
| Learning | Source/country outcome summaries; synthetic data excluded; no unsupported causal claims |
| Access and execution | Access-first setup; explicit preparation mode or connected outreach mode. Exact approved email/follow-up/calendar actions with receipts and conservative delivery handling |
| Knowledge and skills | Private notes, bounded custom writing preferences and a capability catalog |
| Operations | Diagnostics, backup, tests, CI, health endpoint and optional macOS background services |

**Not implemented:** automatic application submission, browser/CAPTCHA execution, profile publishing, automatic email outcome ingestion, autonomous client prospecting, validated strategy promotion, multi-user hosting, PDF resumes and universal platform support. Email/calendar adapters are tested with isolated fake providers; live OAuth and provider end-to-end delivery still need verification. The numbered design documents and YAML files describe future contracts, not runtime settings.

## Clone and run

Prerequisites: Git, Node **22.22.3** (see `.nvmrc`), npm, and a running Docker engine with Compose v2. The database uses local port 55432 and the dashboard uses 3100. No model or Composio account is required for the demo.

```sh
git clone https://github.com/Bhadresh-Malankiya/agent-os.git
cd agent-os
# If using nvm:
nvm install
nvm use
npm ci
npm run setup
npm run dev
```

In another terminal, in the repository:

```sh
npm run worker
```

Open **http://127.0.0.1:3100**. The first screen is account access. Connect Gmail for outreach, optionally Calendar for meetings, or explicitly choose **preparation only** for public discovery and local drafts. Then open **Setup → Profile**, paste résumé text, Markdown, JSON or project notes, parse, inspect source quotes and accept. Parsing requires the configured Codex CLI login; it preserves missing facts rather than inventing them. For a fictional demo without a model account, `npm run demo` seeds a profile and samples while preserving an existing owner profile.

The five tabs are **Today**, **Leads**, **Work**, **Library**, and **Activity**. Leads contains sources and manual job/client intake; Work contains editable drafts, exact approvals and blockers. Library includes profile content, notes, skills, learning working limits and System readiness. All agent states refresh every five seconds.

`npm run setup` creates a random database password in a private `.env`, starts the dedicated PostgreSQL container, and applies idempotent schema changes. Existing data is preserved. Re-running setup is safe. Never run `docker compose down -v` unless you intend to erase the database.

## Real opportunities and AI

In **Leads → Sources**, add a Greenhouse board token or Lever site slug copied from the company's real careers page. Add title keywords separated by commas. **Refresh** performs a read-only import; enabled sources refresh on the configured batch schedule (hourly by default) while the worker runs. This release reads up to 1,000 Greenhouse entries or 100 Lever entries and imports at most 50 new matches per refresh; it is not a complete global job index. Locations and work eligibility are not automatically verified.

To enable optional AI briefs, install and sign in to the official Codex CLI, verify `codex login status`, and enable AI assistance in **Setup → Limits**. The CLI must support `exec --ignore-user-config --ephemeral --output-schema` and the feature flags in `lib/codex.ts`; the verified local CLI was 0.155.0-alpha.16.3. Unsupported versions fail visibly without switching billing routes. Codex uses your own allowance; subscription access is not unlimited or free API access. The worker prepares at most the configured number of new AI briefs daily and never sends them. Generated prose still needs factual review.

For Composio, add `COMPOSIO_API_KEY` to your private `.env`, restart, and open **Access & setup**. Gmail outreach requests read/send scopes; Calendar requests event access. No account consent is granted by adding an API key. The UI keeps unavailable actions locked, including when Google rejects managed OAuth. Follow the provider's supported consent process; the app does not bypass it. Free-plan limits are provider-controlled.

Create a message, follow-up or meeting in Work. Review the recipient, content and time before approving the exact action. Coordinator requires the same connected account at execution, checks suppression and a seven-day email contact cooldown, caps external actions at ten per UTC day, checks for recent replies before follow-ups, and checks calendar conflicts before invitations. Unknown delivery becomes a blocker and is never automatically retried. This is a conservative approved-work queue, not autonomous conversation negotiation.

## Verify and operate

```sh
npm test                    # Unit tests; integration test skips without TEST_DATABASE_URL
npm run test:integration    # Creates/drops an isolated test database on the local server
npm run typecheck
npm run build
npm run doctor
npm run backup
npm run benchmark          # 50 synthetic local workflows, isolated database
```

For a production build on this computer: `npm run build`, then `npm start` and `npm run worker`. On macOS, `npm run service:install` stages a private runtime under `~/.local/share/agent-os` and installs login services for the web app and worker. See [operations](OPERATIONS.md) for restarts, backups and recovery. Keep Docker running. Sleeping, powering off, or closing the laptop can stop local work; remote 24/7 hosting is not configured.

## Cost and capacity

Deterministic local preparation uses zero model calls. PostgreSQL and the application have no software subscription cost; hardware, electricity and optional services are separate. Optional Codex briefs consume your existing account allowance. No paid model API or browser-cloud service is configured automatically.

This is a **single-owner local application**, not a measured multi-tenant service. See [validation results](VALIDATION.md) for the actual benchmark scope and limitations. Daily caps are operational boundaries, not throughput claims.

## Design and contribution

Read [implementation status](IMPLEMENTATION_STATUS.md), [design index](00_README.md), [contributing](CONTRIBUTING.md), and [security](SECURITY.md). The code is [MIT licensed](LICENSE). Keep private profiles, resumes, credentials, browser sessions and backups out of Git. Design proposals do not represent completed features.

### Agent visibility and automatic clarification

Today shows real lead metrics, latest leads, upcoming approved meetings, and blockers. Activity contains per-agent state, attributed audits and recent runs. Badges use execution evidence (L0 Unproven, L1 Observed, L2 Consistent), exclude synthetic work and can regress. They do not claim increasing intelligence or hiring outcomes.

Resolver finds exact saved evidence for known questions. Unsupported metrics, current availability, fees and commitments remain blocked; unrelated preparation continues. New knowledge notes provide bounded, explicitly unverified context to future AI briefs; they never silently change profile facts. Custom skills are writing preferences, not executable code or new permissions. The latest three enabled notes and earliest three enabled skills are included within fixed context limits. Existing briefs are retained; changing notes does not silently regenerate them.

OAuth connections use hosted links. If managed consent is blocked, Access & setup can validate and attach a custom Composio auth configuration without storing client secrets in the app. Library → System shows readiness and reported AI usage; unknown token usage is labeled, not estimated as zero.

### Connection redirects and AI attribution

Connect email/calendar redirects this tab to Composio's hosted authorization flow and returns to `APP_ORIGIN`. Use your exact local origin (default `http://127.0.0.1:3100`) or an HTTPS origin. The app rechecks provider access after returning; callback query parameters never grant access. A blocked or cancelled provider consent remains disconnected.

**Setup → System → AI & subscription** identifies OpenAI, the worker's Codex CLI login method and the plan name reported by its local account. This can differ from the account in your browser. ChatGPT login consumes that account's Codex allowance/credits; API-key login uses API billing. Composio connector usage is separate. These app token totals are not your remaining subscription allowance or a monetary bill.

Today's UTC usage is grouped by task, recorded model and billing method. Tailored briefs and résumé parsing use AI; ordinary intake, deterministic preparation and direct connector calls do not. Historical missing metadata stays unknown. The app explicitly selects `gpt-6-sol` with medium reasoning for tailored briefs and `gpt-6-luna` with low reasoning for source-backed résumé extraction. Task overrides `CODEX_BRIEF_MODEL` and `CODEX_PROFILE_MODEL` take precedence over an optional global `CODEX_MODEL`. Invalid configuration fails without inference; unavailable models do not silently fall back. Cached input tokens are a subset of input, never added twice. Account metadata checks perform no inference and retain no email address or credentials.

Connection diagnostics show the failed stage, classified error code, HTTP status when supplied, and recovery instructions. Provider response bodies, credentials and arbitrary callback text are never exposed. A provider browser refusal may not be returned to Agent OS; in that case it explicitly reports that the reason is unavailable and explains how to investigate. Check access before retrying authorization to avoid repeated link creation.

Model choices follow [OpenAI model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection): Sol for writing requiring judgment, Luna for constrained extraction. These are starting policies validated with synthetic facts, not a claim of exhaustive quality benchmarking. Development smoke calls are outside dashboard production-task totals.

## Docker / own server

See [DEPLOYMENT.md](DEPLOYMENT.md) for a complete web + worker + PostgreSQL deployment, private SSH access, persistent volumes, backups and container AI login. Start it separately on port 3101 using `node scripts/docker-setup.mjs` followed by `docker compose --env-file deploy/.env -f compose.server.yaml up -d --build --wait`. No paid cloud account is required for local Docker.

## Outreach workflow

The current [Outreach OS flow](OUTREACH_OS.md) adds hourly/configurable batches, automatic editable email drafts, manual email/Gmail handoff and résumé PDF/email-file downloads. Start on Overview, review Leads, then use Drafts. Optional notes and configuration are collapsed. Connected sending still requires exact approval. Hiring-signal client prospects are not verified contract opportunities.
