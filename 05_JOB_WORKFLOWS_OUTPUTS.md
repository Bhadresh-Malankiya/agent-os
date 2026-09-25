# Job Workflows and Expected Outputs

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

## 1. Opportunity lifecycle

Input can be a supplied URL, source scan, recruiter thread or imported tracker record. Resolve canonical identity, preserve original evidence, evaluate the active user's configured preferences, then qualify, exclude with reasons, or request specific verification. No personal market/stack preferences are hardcoded into agents.

For eligible opportunities, resolve the legitimate application route and prepare the role-specific resume package. Claim the application or initial-contact action, execute through the gateway, verify evidence, update the database and next-action state, then hand conversation ownership to the conversation role.

One requisition may have multiple source aliases; different requisitions must not collapse because their titles match. Store a stable semantic action key so wording changes do not permit duplicate outreach.

## 2. Resume package

Use current verified profile facts and immutable source assets. Tailor structure, wording, emphasis and relevant project order to the role. Missing experience stays missing. Every factual claim maps to supporting evidence. A role-specific validated package may be reused if its profile/JD dependencies are unchanged.

Outputs: PDF, editable source, claim map, validation report and metadata containing profile/JD/skill/template versions, content hash and role reference. Validate extracted text, contact fields, reading order, rendering, margins, overflow and attachment format before use.

Filename contract:

`{candidate-slug}__{company-slug}__{role-slug}__{job-key}__resume__v{NN}.pdf`

Derive the candidate slug from the active verified profile only at runtime. Normalize Unicode, lowercase safe characters, collapse punctuation/whitespace into hyphens, cap the full filename at 180 characters, reserve suffix space, and include a stable digest of the canonical opportunity ID with collision handling. Use database artifact IDs as identity; filenames are readable locators.

## 3. Browser applications

Open an isolated session bound to workspace, user, account, domain and application attempt. Inspect form and map fields to verified answers, permitted generated text, optional omission or user-needed input. Upload the immutable validated resume, validate errors and review the final payload.

Immediately before submission recheck ownership, live rules/grants, current profile dependencies, application uniqueness and confirmation capability. Record action intent, dispatch final submission, then capture receipt/page/email evidence. A timeout after clicking is OUTCOME_UNKNOWN until reconciled. Uploading a file or opening a thank-you-like page is not automatically sufficient proof.

Supported portal adapters specify login, form families, file upload, multi-step behavior, receipt pattern, known limitations and last tested version. Unknown layouts may be inspected read-only; unsupported final submission becomes a precise task.

For login challenges, candidate assessments, missing forced answers, sensitive documents or binding decisions, save completed safe work and a resumable checkpoint. The UI shows the exact question/action, URL, deadline and authenticated takeover path. Do not expose session cookies in an ordinary artifact.

## 4. Replies, follow-ups and interviews

The conversation owner has access to the complete current thread and processes a validated digest, outstanding request checklist and exact relevant messages, retrieving original history whenever needed for completeness; it distinguishes human replies from automatic acknowledgements, extracts all requested items, delegates bounded subtasks and returns one coherent response. Only verified human-positive evidence can create reply-priority work; a discovered lead cannot manufacture that signal.

Follow-up cadence comes from published preferences/rules and has no personal default in the empty template. Timers use explicit business calendar/timezone choices. Recheck current thread before effect; stop on applicable reply, rejection, bounce, confirmed next step, completed sequence or user-managed state. Coalesce missed windows rather than sending a burst.

Calendar coordination checks timezone, current availability and configured buffers. Proposed slots, candidate acceptance, recruiter confirmation and recorded events are distinct. Reconcile existing invitations before creating another event.

## 5. Output contract

| Stage | Required output | Proof / validation |
|---|---|---|
| Research | Source scan and role candidates | Direct URLs, dates, evidence |
| Qualification | Verdict and criterion reasons | Active preference/profile/source versions |
| Resume | Role-specific package | Claim and render QA |
| Outreach | Draft, recipients, attachment versions and intent | Provider acceptance/sent reference, not an invented read receipt |
| Application | Answer map, attempt and outcome | Verified receipt or explicit unknown/blocker |
| Reply | Full request checklist and coherent response | Correct thread/message references |
| Interview | Meeting state, timezone, event reference | Confirmation evidence |
| User exception | Single actionable remaining step | Saved checkpoint and current context |
| Reporting | Outcomes, blockers and system health | Drill-down to actual database records |

## 6. Default automatic operation and exceptions

After onboarding, execute eligible routine stages under standing grants without per-item approval. Consult verified profile, current thread and scoped remembered answers before asking. If a required decision remains unresolved, prepare all independent work, save a checkpoint and create one Decision Inbox item with exact missing information, recommendation, evidence and deadline. Other opportunities continue. A valid answer resumes the affected work after fresh validation; silence never authorizes an effect.

Calendar booking/acceptance can be automatic within an explicit scheduling mandate and live availability. Negotiation may communicate only approved compensation/availability boundaries; accepting an offer, changing those boundaries or making a binding commitment outside the mandate requires a decision.

## 7. Presence and learning outputs

Alongside applications, audit relevant connected profiles, generate ready-to-use platform-specific content and automatically publish supported fields covered by standing grants. Otherwise provide the exact manual update package. Track draft, live-verified, owner-reported and unknown states separately.

Each completed workflow emits versioned outcome evidence to learning; feedback includes explicit reasons when available and unknown reasons otherwise. Resume variants, source allocation and outreach experiments never create duplicate applications. Country discovery and new-platform proposals extend relevant coverage under the rules in documents 09 and 10.

## 8. Commercial workflow, browser challenges and efficiency

Client growth follows its own lead → qualification → discovery/proposal → authorized outreach/bid → verified response → scope/contract-decision flow in document 11. Proposal templates and truthful case studies reuse verified assets; forecasts are not revenue and price estimates are not unauthorized commitments. Capacity is reserved across hiring interviews and client calls/projects.

Supported browser challenges can use a configured provider solver; unresolved CAPTCHA, MFA and identity checks become secure takeover tasks without discarding progress. Never resubmit after an ambiguous final effect merely because the browser was recovered. Document 13 specifies these states.

Apply eligibility and deduplication before expensive tailoring; reuse current validated packages, deterministic rendering and known form recipes. Preserve all requested items when compressing thread context. Verify effects outside the generation model and measure total cost including retries. First-hours outputs are useful materials and supported verified actions, not guaranteed hiring or sales outcomes.
