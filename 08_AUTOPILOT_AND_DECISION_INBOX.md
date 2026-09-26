# Autopilot and Decision Inbox

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

Design release 4.0. This document defines proposed behavior; no runtime or UI is implemented in this starter.

## 1. Product promise

Set up once, then let Agent OS operate the selected hiring/client-growth pipelines and professional presence within an owner-approved mandate. Autopilot is the default operating mode after validated onboarding. The owner should not need to open the dashboard to keep routine work moving. Ask only when a required decision cannot be resolved from verified facts, standing instructions, supported capabilities and current evidence.

This is exception-driven autonomy, not a guarantee that every website, recruiter or hiring outcome can be controlled. Account challenges, candidate assessments, new facts and binding commitments can still require the owner. An unanswered exception holds its affected dependency branch; unrelated work continues.

## 2. One-time onboarding and standing mandate

1. Import resume, evidence, portfolio and existing profile URLs. Extract facts and prepare a consolidated confirmation screen; ask about conflicts and missing mandatory facts together.
2. Select hiring, client growth or both; configure services, pricing/capacity and commercial communication if applicable. Capture target roles, seniority, markets, employment types, work authorization, relocation, compensation boundaries, exclusions and availability. Suggest a coherent configuration for confirmation rather than requiring the owner to write policies.
3. Connect selected accounts through their native flows, verify identity/resources, and inventory supported read, draft, publish, send, submit and calendar operations separately.
4. Present one plain-language mandate covering automatic applications, communications, scheduling, profile edits, discovery and bounded learning. Record grants with account, operation, resource, field, audience, volume and spend limits. A mandate never creates a capability a provider does not offer.
5. Confirm follow-up cadence, allowed meeting times, disclosure rules, daily action limits, operating budgets and exception-notification choices. Limits with missing required values cannot activate dependent effects. Setup screens propose values; this empty starter does not invent personal choices.
6. Run account health checks, a dry-run application and content previews. Summarize automatic actions and remaining unsupported capabilities. Activate ready workflows together; optional missing accounts do not block the entire workspace.

Once activated, routine work does not require per-item approval. Re-confirm only an expansion of the mandate or a decision outside it. A pause survives restart; restart does not reactivate paused work. Future workflow types require coverage under the mandate before activation.

## 3. Decision routing

| Situation | Automatic behavior | Owner interruption |
|---|---|---|
| Eligible job, verified answers, supported route, active grant | Prepare, validate, submit and verify | None |
| Known recruiter question, factual reply, permitted disclosure | Answer in the correct thread and verify | None |
| Meeting within approved hours and booking mandate | Check live conflicts, book/accept as permitted, verify | None; record as activity |
| Resume emphasis or profile wording within verified claims and granted fields | Generate, check, publish if supported | None |
| Missing required fact or conflicting evidence | Search already authorized sources and reusable answers, then save checkpoint | One specific question |
| Uncertain but optional cosmetic choice | Use validated baseline and record decision | None |
| Unsupported mandatory form, unresolved CAPTCHA, MFA or expired login | Save safe progress and create authenticated takeover task | Action needed |
| New spending, new account access, changed target country, salary outside mandate | Prepare exact proposal | Approval needed |
| Assessment, identity verification, offer acceptance, binding declaration | Prepare context and permitted supporting material | Candidate action needed |
| Possible previous send/submit acceptance | Reconcile with bounded retries and deadlines | Only if evidence remains unavailable or deadline requires intervention |
| Quota, transient outage, or browser crash | Wait/recover within policy; release worker | Notify on material delay or required action |

An agent's confidence score alone cannot authorize an action. Required facts need verified sources; critical ambiguity needs resolution. Responses about protected/sensitive information follow explicit disclosure preferences, not inferred demographics. No response is never treated as consent.

## 4. Decision Inbox UI

The global bell displays a persistent badge for actionable items. Dashboard cards separate **Needs your answer**, **Needs approval**, **Needs you to act**, and **Resolved**. Informational activity and learning digests do not inflate the action badge. Filters include deadline, company, workflow, account and impact; mobile layout supports the same core actions.

Each decision card includes:

- A plain-language question, why it cannot be resolved, and what is blocked.
- Company/platform, affected jobs or profiles, deadline with timezone, urgency and source evidence.
- Recommended answer plus alternatives, uncertainty, and consequences; free text remains available.
- The exact outbound content, recipients, attachment versions, profile diff or proposed expense when approval is required.
- Buttons appropriate to the item: answer, approve once, reject, edit, snooze, skip opportunity, or open secure takeover.
- Optional **Remember this answer** with an explicit scope and expiry preview. One approval does not silently become a standing grant.
- A saved progress summary and automatic continuation after a valid answer.

Decision records contain workspace/user, type, entity references, dedupe key, question version, payload hash, evidence, prerequisite versions, options, recommendation, due/expiry time, state, answer, answering actor, remember scope, and resume target. Do not put cookies or secret credentials in cards.

Lifecycle: OPEN → ANSWERED → REVALIDATING → RESOLVED, with SNOOZED, EXPIRED, CANCELLED and SUPERSEDED branches. Claim answers transactionally; duplicate clicks cannot trigger duplicate effects. A stale answer never approves a changed payload. Revalidate facts, grants, entity ownership and deadline before resuming. Reopen only if the changed context truly needs a new decision.

Persist the decision and notification outbox atomically with the blocked state. Deduplicate repeated missing facts across workflows, while listing each affected entity. Batch nonurgent questions; avoid repeatedly asking for the same verified answer. Expiry skips/holds the affected work under policy and records missed opportunities; it never auto-approves. Snoozing past a deadline shows the consequence.

In-app notifications are always available after setup. Optional email/push notifications require a selected authorized channel. Track delivery separately from reading and resolution; retry delivery within bounds without duplicating decision records. Respect quiet hours except owner-selected urgent types. External notifications contain minimal context and authenticated links.

## 5. Continuous operation

Prioritize incoming recruiter requests, interviews, deadline-sensitive approved work and outcome reconciliation ahead of discovery and learning. Waiting for a human consumes no model worker. Maintain bounded work queues, daily account limits, cost reservations and a spend stop. Produce activity records automatically; send digests only on the owner's configured cadence.

Success means fewer avoidable interruptions with correct, verified outcomes. Track autonomous completion rate, human minutes per week, questions per completed workflow, repeated questions, decision age, missed deadlines, duplicate incidents and recovery time. Do not improve the autonomy metric by guessing facts, hiding blockers or dropping difficult cases.

## 6. End-to-end example

Setup completed → country/role discovery → qualification → tailored resume → authorized application → receipt → recruiter requests availability and an unknown relocation date → system prepares availability, asks one relocation question in the Decision Inbox, and continues other applications → owner answers once → full reply is revalidated and sent → interview is booked within the standing mandate → outcome contributes to a bounded learning experiment.

## 7. Additional mode and browser decisions

Client proposals outside scope, price or capacity bounds show the concrete offer and consequence in the same inbox. Hiring and sales permissions remain distinct. A supported provider may resolve an authorized CAPTCHA under its configured budget; unresolved challenges open secure browser takeover, not a request to paste credentials into a message. Suspend the worker during takeover and revalidate before continuing.

The UI remains useful during quota waits, outages or user absence because decisions and state are persisted independently of a model. Show elapsed time and actionable next steps; do not use a model loop to redraw status. See documents 11–16 for release 4.0 scope and gates.

## Implemented automatic clarification (local alpha)

The Resolver lane checks every ten seconds while preparation is enabled. It retrieves exact excerpts from the saved profile and privately imported `knowledge_facts`, classifies supported question topics, and records source-backed context. It uses no model calls. Questions with absent topics, current commitments, eligibility, or claims needing corroboration remain **blocked** with reasons; documented-only context may be resolved automatically. This is deterministic retrieval with conservative topic coverage, not a general question-answering verifier.

Availability, fees, hours, current employment dates and eligibility are never inferred from historical portfolio text. Imported portfolio metrics remain self-reported. Existing owner-resolved answers are preserved. Repeated passes do not duplicate audits; profile or evidence changes trigger re-evaluation of Resolver-owned items. Unsupported submission and connection requests are visible capability blockers, not silently approved actions. Other local work continues. No sending, publishing or browser submission is introduced.

Activity & audit shows each lane's current task/state and last update, attributed workflow runs, and the latest 100 durable audit records. Older audit rows remain in PostgreSQL. This is a local operational log, not tamper-proof compliance storage. Existing pre-release events are retained in the journal; historical actor details are not fabricated.
