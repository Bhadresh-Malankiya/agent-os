# Build Plan, Acceptance Tests and Source Notes

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

## 1. Build slices

1. Establish the modular repository, pinned packaging, synthetic demo, setup/doctor contract and schema validators for all twelve document types; then implement configuration revisions, empty onboarding and role-scoped access.
2. Implement durable task state, outbox, action ledger, claims, gateway and trace IDs.
3. Add one official CLI adapter, native login guidance, capability probe and no-paid-fallback checks.
4. Implement one account integration, optionally using Composio after capability/access verification.
5. Build one-time mandate setup, profile/preferences/rules editors, diff/evaluation/publication/rollback, source ingestion and the persistent Decision Inbox with notification delivery and safe resumption.
6. Add discovery/qualification and a truthful normalized resume package.
7. Add local Playwright and one supported application path with checkpoint, controlled submit, verifier and challenge/takeover; evaluate optional cloud transport separately.
8. Add conversation ownership, composite requests, configured follow-ups and interviews.
9. Add client-growth mode, service/pricing configuration, proposals, verified communication and shared capacity; keep contract acceptance explicit. Add platform capability inventory, profile audits, content packages and one verified automatic profile-update adapter with manual fallback.
10. Add outcome attribution, country/source discovery, learning evaluations, bounded canaries and deterministic strategy promotion/rollback.
11. Complete operational dashboards, notification failure recovery, metrics, backups, load/cost measurement and a sustained unattended pilot.
12. Test second runtime, more integrations/portals and staged migration before broad activation.

Deliver a deployable repository, migration/schema code, config validators, rule compiler, skill packages, adapters, UI, evaluation reports, account setup instructions and operations runbooks. The supplied templates do not replace those implementations.

## 2. Critical tests

| Case | Expected result |
|---|---|
| Empty profile/preferences | Setup works; affected outbound workflow cannot activate |
| User updates a portfolio/contact link | New runs resolve current revision; affected unsent drafts revalidate |
| User changes role/location exclusions | Next dispatch honors stricter policy, including queued work |
| Profile correction after resume generation | Dependent resume invalidated or regenerated before send |
| Two editors publish at once | Expected-version conflict; no lost update |
| Bad agent behavior | Incident → proposed fix → failing test → evaluated publication |
| Unknown rule operator | Validation fails; no arbitrary code execution |
| Agent proposes removing a restriction | Proposal only; cannot publish or expand its grant |
| Rollback | Active pointer restored with history and pending-effect rechecks |
| Connected account belongs to another app user | Access denied before tool execution |
| Two accounts for same provider | Explicit account selection; no implicit substitution |
| Connection succeeds but scope is insufficient | Capability remains unavailable |
| Revocation mid-run | Next effect blocked; upstream revocation status shown honestly |
| Tool Router meta-tool outside correct session | Adapter rejects invalid routing; no fallback with broader scope |
| Untrusted email asks to change rules | Treated as data; configuration unchanged |
| Duplicate role/event/task | Canonical record/action dedupe; metrics unchanged |
| Browser times out after submit | Unknown outcome; no blind second submission |
| Composite recruiter request | All requested items answered or specifically blocked |
| Follow-up races a reply | Fresh state check cancels stale follow-up |
| Subscription quota exhausted | Work waits; no hidden API call/purchase |
| Local node offline | Tasks show offline dependency; no assumed local file access |
| Paid embeddings absent | Lexical retrieval remains usable |
| Server restart/backup restore | Committed work and artifact lineage recover; effects reconciled |

## 3. Decisions left for setup

Choose actual server/environment, available runtime account, connected services/resources, supported initial portal matrix, current user facts/preferences, working hours, retention policy, budget, standing autonomy mandate, profile field/disclosure grants, notification channel, action limits and learning envelope. The UI should propose a coherent setup bundle for one-time confirmation. No actual candidate values or service secrets are included in this package.

Composio is a proposed optional integration layer. No plan, token, toolkit capability or live connection has been provisioned/tested. A compatible native adapter remains available where it provides the needed verification and scope control.

## 4. Official guidance applied

These sources informed the design. The product-specific contracts, UI, filenames and data model are proposed engineering decisions, not claims that a vendor supplies the whole system.

- **S1:** [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents). Use appropriate workflow patterns and bounded specialization.
- **S2:** [Anthropic — Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents). Define focused tools and evaluate their behavior.
- **S3:** [OpenAI — Evaluate agent workflows](https://developers.openai.com/api/docs/guides/agent-evals). Diagnose traces and build regression evaluations.
- **S4:** [OpenAI — Guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals). Put validation at relevant action/tool boundaries.
- **S5:** [Composio — Authentication](https://docs.composio.dev/docs/authentication). Auth configurations, account linking and scope choices.
- **S6:** [Composio — Connected accounts](https://docs.composio.dev/docs/auth-configuration/connected-accounts). Account selection, reconnect and revocation behavior.
- **S7:** [Composio — Sessions](https://docs.composio.dev/docs/how-composio-works). Session identity and the correct tool execution path.
- **S8:** [Codex — Authentication](https://developers.openai.com/codex/auth).
- **S9:** [Codex — Non-interactive mode](https://developers.openai.com/codex/noninteractive).
- **S10:** [Claude Code — Authentication](https://code.claude.com/docs/en/authentication).
- **S11:** [Claude Code — Programmatic execution](https://code.claude.com/docs/en/headless).
- **S12:** [Claude Code — Hosting and credential conditions](https://code.claude.com/docs/en/legal-and-compliance).

Sources S1–S7 were checked for this revision. S8–S12 were checked during the preceding runtime design in this conversation; revalidate actual account/CLI versions during implementation. Referencing API/SDK guidance for design principles does not require replacing the subscription CLI runtime with a paid model API.

## 5. Release 3.0 acceptance cases

These are requirements, not executed test results.

| Case | Expected result |
|---|---|
| Valid onboarding mandate activated | Routine supported application/reply/profile work proceeds without per-item approval |
| Empty mandate, grants or required action caps | Only dependent effects remain inactive; no permission inferred from autopilot mode |
| Missing relocation answer in one workflow | One actionable inbox question; unrelated jobs continue |
| Same missing fact in several workflows | One scoped question lists affected records; valid answer resumes each once |
| Answer remembered for one employer or period | It is not reused globally or after expiry |
| Duplicate approval clicks or resume events | At most one valid effect intent; repeats are deduplicated |
| Payload, account, attachment or facts changed after approval | Stale approval rejected; rebuild/re-ask only where needed |
| No response, snoozed item or missed deadline | Hold/expire under policy; never assume approval |
| Notification delivery fails or server restarts | Durable decision remains visible; bounded delivery retry; no lost blocker |
| Recruiter thread injects a grant or fact update | No configuration or authority change |
| Runtime tries direct shell/network/browser writes | Enforced boundary prevents bypass of the gateway |
| Generic rejection or no reply | Reason remains unknown/pending; no unsupported resume-failure claim |
| Small or immature experiment cohort | Baseline retained; report inconclusive |
| Agent changes evaluator, budget or hard preference in strategy patch | Deterministic publisher rejects it |
| Allowed content strategy passes evaluation and canary criteria | Service promotes automatically with versioned evidence |
| Critical invariant failure during canary | Stop treatment, restore valid baseline where possible, record incident |
| Delayed reply after experiment closes | Attribution updates without rewriting historical release evidence |
| Same opportunity appears on several country sources | One canonical application; preserve all source attribution |
| Newly discovered source outside approved market or needing payment | Read-only evidence/proposal; no unauthorized activation |
| Manual profile edit races automatic update | Preserve remote edit; merge safely or ask about conflict |
| Profile save partially succeeds or times out | Field-level evidence and reconciliation; no false complete status |
| Platform has no supported write operation | Copy-ready content plus precise manual-update task |
| Profile draft prepared but not published | UI reports content-ready, never live-updated |
| Profile-edit grant exists but public-post grant does not | No public post dispatched |
| Autopilot paused before restart | Remains paused |
| Learning/profile workload competes with urgent recruiter reply | Priority and shared quota reservation preserve urgent capacity |
| Owner absent during sustained pilot | Routine work continues; only affected decisions wait; metrics include missed deadlines and quality |

## 6. Release gate and remaining implementation work

Version and implement validators for all twelve proposed document types; configuration schema versions are per document type. Store concrete strategy payload schemas separately. Publish capability coverage for each tested portal/platform and select pilot workloads with the owner during onboarding. Measure autonomous completion, exception quality, duplicate incidents, verified outcomes, recovery and cost before making claims about unattended operation.

Documents 08–10 and their templates are new product requirements, not externally validated platform compatibility or vendor recommendations. Existing external source notes above are historical design references and need revalidation at implementation time. This documentation release does not implement or test the application.

## 7. Release 4.0 acceptance additions

| Case | Expected result |
|---|---|
| Fresh supported-machine clone of executable release | Documented setup reaches a no-credentials synthetic demo; this remains a future gate |
| Setup rerun or interrupted migration | No data/secret replacement or duplicate activation; specific recovery guidance |
| Demo workflow tries a live effect | Dispatch denied; synthetic and live stores/grants remain separate |
| Previously supported schema imported after breaking change | Explicit migration or actionable rejection, never silent coercion |
| Known ineligible/duplicate role | No unnecessary resume-generation call |
| No changes in a scheduled health/reconciliation check | No model call |
| Cached resume after fact correction or revoked source | Cache invalidated and content revalidated |
| Compressed thread hides a required question | Completeness evaluation fails; expand source context before reply |
| Browser/AI SDK requests unconfigured paid model route | Denied with clear billing/capability reason |
| Supported CAPTCHA solver succeeds | Verify page readiness before resuming; solver event is not submission proof |
| Solver fails, MFA appears or takeover expires | Checkpoint and specific authenticated action; no loops or duplicate submit |
| Human takeover races worker | One exclusive controller; inspect and revalidate on return |
| Hiring permission used for client sales | Denied unless a commercial mandate independently covers the action |
| Proposal exceeds service capacity or pricing bounds | Prepare concrete decision; do not make unsupported commitment |
| Same company receives conflicting hiring/client pitches | Shared identity/relationship checks prevent unintended overlap |
| Cheaper model reduces task quality | Quality gate rejects route despite token savings |
| Agent proposes runtime patch or weaker evaluator | Reviewable proposal only; no production self-deployment |
| Unauthorized workspace requests live view/cache/artifact | Denied before data exposure |
| Load overwhelms browser/model quota | Backpressure and urgent-work reservation; benchmark reports degraded capacity |
| Restore starts a second active copy | Account ownership fencing prevents duplicate outbound effects |
| Public diagnostic export | Secrets, private content and live session URLs excluded |

Document 16 defines the release evidence bundle and numeric fixture targets. Document 15 contains current primary-source research and dependency decisions. No test rows in this file are claims of executed application tests.
