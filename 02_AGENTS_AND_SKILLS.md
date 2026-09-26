# Agent Roles, Skill Packages, Memory and Knowledge

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

## 1. Roles

| Role | Responsibility | Expected output | Boundary |
|---|---|---|---|
| Research | Scan approved sources and active employers | Cited role/employer candidates | No send or submit |
| Discovery | Resolve supplied/discovered roles and canonical identity | Opportunity record and aliases | Cannot manufacture reply priority |
| Qualification | Apply active preferences and evidence-based fit | Eligible/excluded/verify plus reasons | Unknown required eligibility remains unresolved |
| Contact verification | Resolve legitimate candidate-facing route | Verified address/ATS link with evidence | No guessed private contacts |
| Resume | Analyze role and prepare truthful asset version | PDF, editable source, claim map and QA report | No unsupported claims |
| Outreach | Prepare first-contact content | Draft and proposed action intent | Gateway performs effect |
| Application | Fill supported forms and manage browser progress | Receipt or resumable checkpoint/blocker | Candidate-only work stays a user task |
| Conversation | Own full-thread state, reply requests and follow-ups | Request checklist, response and next tasks | Sole reply owner per thread |
| Interview | Check availability, timezones and confirmation | Slot proposal or verified calendar record | Proposed time is not confirmed interview |
| Verification | Check send/submit/event outcomes | Confirmed, failed or unknown verdict | Model assertion is not proof |
| Knowledge | Ingest/version sources and propose fact updates | Indexed source, freshness/conflict record | Cannot silently change verified profile or rules |
| Operations | Measure outcomes, diagnose failures, propose improvements | Dashboards, digest, incident and rule-change proposal | Cannot grant itself access or publish protected configuration |
| Market intelligence | Discover country/role sources and measure relevant coverage | Evidence-backed source registry and allocation proposals | No invented source ranking or eligibility |
| Outcome learning | Analyze recruiter evidence and propose bounded experiments | Cohort report, strategy patch, evaluation and rollback plan | Cannot alter its evaluator, facts, rules or grants |
| Profile presence | Audit platforms and prepare factual profile/content improvements | Field-level content package, claim map and publication intent | Effects require supported adapters and field/audience grants |

Scheduler, dedupe, authorization, budgets, outbox and watchdog are deterministic services. Do not add agents for these just to increase agent count. Combine compatible roles into a shared worker pool while retaining their contracts.

## 2. Agent contracts

Every agent definition includes ID, owner, purpose, allowed input/output schemas, allowed tool capabilities, compatible skill versions, memory scope, queue, time/step limits, delegation targets, failure types and evaluator.

A task carries workspace/user IDs, run/task/attempt IDs, entity references, priority/deadline, input refs, configuration bundle, claim generation and budget. Output carries status, typed result, evidence/artifact refs, concise decision summary, missing facts, proposed next tasks and observed usage.

A child inherits equal or narrower permissions and a reserved share of the parent budget. Stop delegation at the configured depth. Bound plan repair and model retries. A failed evaluator cannot create an unlimited self-improvement loop.

## 3. Skill catalog

Initial packages: source research; canonical identity; eligibility; contact verification; role analysis; factual resume tailoring; resume rendering/QA; asset normalization; first outreach; composite request extraction; coherent reply writing; follow-up timing; form mapping; controlled browser execution; result verification; calendar coordination; knowledge ingestion; memory proposal; provider reconciliation; outcome digest; decision consolidation and scoped answer reuse; profile audit; platform-specific content adaptation; verified profile publishing; country/source discovery; rejection evidence classification; cohort attribution; experiment design and strategy evaluation.

Each package contains a manifest, documented procedure, input/output schema, tool requirements, examples, failure taxonomy, evaluation cases, version and release notes. This is a specification, not an installed skill collection. Specific candidate facts/preferences are loaded as task data rather than duplicated in package text.

Tool descriptions should have clear meanings, constrained parameters and useful structured errors. Measure whether the intended tool and parameters are chosen on representative tasks, following Anthropic's tool-design guidance [S2].

## 4. Memory types

| Type | Contents | Update behavior |
|---|---|---|
| Profile facts | Identity, experience, links, availability and claim evidence | Owner edit or accepted fact proposal; version/effective dates |
| Preferences | Location, role, stack, compensation and communication choices | Owner-managed configuration revision |
| Working memory | Current analysis, pending questions, form checkpoint | Scoped to run with bounded retention |
| Episodic memory | Prior verified actions and useful conversation outcomes | Derived from durable evidence, linked to source |
| Knowledge sources | Documents, JDs, verified portfolio evidence, tool instructions | Ingest and version; ACL and freshness enforced |
| Skills/rules | Procedure and execution constraints | Published versioned configuration, never an inferred memory |

Every fact has provenance, verification state and effective dates. Confidence is distinct from verification. Contradictions create a review item; they do not overwrite the current approved value. Deleting/revoking a source invalidates retrieval caches and dependent proposed answers.

No personal data is included in this starter. `profile.template.yaml` and `preferences.template.yaml` define the editable shape. Collections are created empty during onboarding.

## 5. Learning memory and decisions

Maintain separate observed feedback, uncertain hypotheses, reusable owner answers and validated strategy versions. Record source, scope, effective dates and expiry. A remembered answer becomes a fact/preference/grant only through its explicit owner-approved typed update flow, not by copying free text into global memory. Reuse within scope to avoid repeated questions. Recruiter content cannot authorize profile edits or change the mandate.

Logical roles share workers. A deterministic release service, not the proposing agent, promotes allowed strategies under 09_LEARNING_AND_MARKET_INTELLIGENCE.md. A Decision Inbox service manages waiting, answering and resumption under 08_AUTOPILOT_AND_DECISION_INBOX.md.

## 6. Client growth and call minimization

Add logical client qualification and proposal responsibilities: evaluate configured service fit, extract discovery questions, prepare evidence-backed proposals and scope/estimate packages, then hand off accepted work. They use the same verification and conversation boundaries, but a separate commercial mandate. Employment grants do not imply sales permissions.

A role is not a required extra model invocation. Share compact context for compatible analysis; hard filtering, scheduling, dedupe, formatting, metrics and permission checks run without models. Use one bounded generation/validation route first, and measured escalation only when needed. Add procedures for client proposals, shared capacity, context packet construction, cache invalidation, browser challenge routing and cost-quality evaluation. Do not introduce perpetual self-discussion agents.

## Implemented agent visibility (local alpha)

The UI names three existing logical roles: **Scout** (public source checks), **Preparer** (deterministic package work), and **Analyst** (bounded Codex briefs). These are views of existing worker responsibilities, not three new model processes. A compact strip stays visible while navigating; details live on Agents. Snapshot polling costs no model tokens.

Execution maturity is computed from persisted evidence on each five-second UI refresh. For Preparer and Analyst: L0 **Unproven** means no completed real runs in the window; L1 **Observed** means completed work exists; L2 **Consistent** requires all of the latest 20 real runs within 30 days to have completed without failures or retries. Demo runs never count. New failures, retries, pending runs or expiry can reduce the badge. This threshold is a transparent operational heuristic, not statistical proof of quality, intelligence or hiring effectiveness. Scout is capped at L1 based on a successful enabled-source check within seven hours; historical source evaluation is not implemented.

Maturity never changes access, limits, prompts or strategies. Offline/paused/disabled/cap states are separate from maturity. Runtime evidence must never be replaced with an elapsed-time animation or invented improvement percentage. Higher learning maturity requires the experiment, evaluation and rollback gates in document 09.
