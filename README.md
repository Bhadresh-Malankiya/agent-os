# Agent OS

A private opportunity desk for your next role, your next client, and the work in between.

**v0.1.0 — working local alpha.** The long-term autonomous-agent design is broader than this release. The table below describes the software that actually runs today. No interview, job, client win, or error-free operation is guaranteed.

## What works

| Capability | Current behavior |
|---|---|
| Private profile | Editable facts, skills, evidence and provenance, stored in PostgreSQL |
| Job discovery | Greenhouse and Lever public board intake; title filters, deduplication and six-hour refresh |
| Local autopilot | New real opportunities are queued and prepared within a daily limit (10 by default) |
| Application packages | Fact-based Markdown drafts, evidence, skills overlap, review checklist and editing with stored prior versions |
| AI assistance | Optional official Codex CLI briefs; configurable daily attempt cap (2 by default, up to 100), bounded context, 120-second timeout, evidence-ID validation, usage reporting and no paid API fallback |
| Decision inbox | Persistent review questions, owner answers and history; an answer does not submit anything |
| Profile presence | Copy-ready LinkedIn, GitHub, Upwork and portfolio drafts |
| Client projects | Manual lead intake, proposal introduction and outcome recording |
| Learning | Source/country outcome summaries; synthetic data excluded; no unsupported causal claims |
| Composio | Server-side key verification and Gmail/GitHub connection-link flow; connected account state |
| Operations | Diagnostics, backup, tests, CI, health endpoint and optional macOS background services |

**Not implemented:** sending email, application submission, browser/CAPTCHA execution, profile publishing, email outcome ingestion, autonomous client prospecting, strategy promotion, multi-user hosting, PDF resumes and universal platform support. Connecting Gmail does not enable mail execution in this release. The numbered design documents and YAML files describe future contracts, not runtime settings.

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

Open **http://127.0.0.1:3100**. For a fictional starter profile, run `npm run demo` (it preserves any existing owner profile). Alternatively, save a profile in **Your profile**, then load sample opportunities from **Overview** or **Opportunities**. Click the prepare arrow; within a worker tick the package appears in **Content studio** and the review in **Decision inbox**. Demo opportunities are fictional and never contacted.

`npm run setup` creates a random database password in a private `.env`, starts the dedicated PostgreSQL container, and applies idempotent schema changes. Existing data is preserved. Re-running setup is safe. Never run `docker compose down -v` unless you intend to erase the database.

## Real opportunities and AI

In **Connections**, add a Greenhouse board token or Lever site slug copied from the company's real careers page. Add title keywords separated by commas. **Sync now** performs a read-only import; enabled sources refresh every six hours while the worker runs. This release reads up to 1,000 Greenhouse entries or 100 Lever entries and imports at most 50 new matches per refresh; it is not a complete global job index. Locations and work eligibility are not automatically verified.

To enable optional AI briefs, install and sign in to the official Codex CLI, verify `codex login status`, and enable AI assistance in **Settings**. The CLI must support `exec --ignore-user-config --ephemeral --output-schema` and the feature flags in `lib/codex.ts`; the verified local CLI was 0.155.0-alpha.16.3. Unsupported versions fail visibly without switching billing routes. Codex uses your own allowance; subscription access is not unlimited or free API access. The worker prepares at most the configured number of new AI briefs daily and never sends them. Generated prose still needs factual review.

For Composio, add `COMPOSIO_API_KEY` to your private `.env`, restart the app, then verify it in **Connections**. Connection links request Gmail read-only or GitHub profile/email access and lead to provider consent. The application stores a stable opaque owner ID and session ID; the key is never returned to the browser. No premium tools are enabled. Free-plan availability and limits remain subject to the provider.

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
