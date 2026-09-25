# Profile, Preferences and Rule Change Management

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

## 1. Separate sources of truth

| File / eventual UI | What belongs here | What does not belong here |
|---|---|---|
| profile.template.yaml / Profile | Verified identity, facts, claims, links, asset references, availability | Desired job markets or agent permissions |
| preferences.template.yaml / Preferences | Target roles/locations/stacks, work modes, compensation preference, communication style | Provider credentials or tool grants |
| rules.yaml / Rules | Action gates, retry/loop limits, follow-up policy, autonomy behavior, stop conditions | Candidate biography embedded in prompts |
| connections.template.yaml / Connections | Account IDs, selected resources, grant references, secret references | Raw secrets committed to files |
| autonomy.template.yaml / Autopilot | Standing mandate references, exception routing and workflow activation | Implicit access from a mode toggle |
| learning.template.yaml / Learning | Allowed strategy fields, experiment limits and evaluation requirements | Permission to change verified facts or protected policy |
| presence.template.yaml / Profiles | Platform inventory, audit and publication behavior | Assumed support for every platform |
| growth.template.yaml / Work mode and Services | Client offering, mode, commercial boundaries and shared capacity | Implied sales consent from hiring access |
| efficiency.template.yaml / Efficiency | Call routing, context/cache rules and measurement | Permission to lower factuality or skip effect checks |
| browser.template.yaml / Browser | Transport, challenge policy, session and takeover limits | Universal website support |
| deployment.template.yaml / Installation | Demo/live packaging, setup and release-readiness contract | Claim that an installer currently exists |
| runtime.template.yaml / Runtimes | Deployment, CLI selection, concurrency, budgets and recovery defaults | User qualifications or fabricated account entitlement |

Templates describe desired schemas. Runtime truth lives in immutable, validated database revisions. Files are import/export artifacts; editing a file must not silently mutate an active deployment. The UI edits the same revision model, avoiding two competing sources of truth.

## 2. Revision lifecycle

Owner-controlled configuration: Draft → Schema validated → Impact preview → Regression tested → Owner published → Active → Superseded or Rolled back.

Bounded strategy revisions use the distinct automatic evaluation/canary/promotion path below; they do not bypass owner-controlled publication.

Every revision has ID, monotonically allocated version, author, timestamp, reason, schema version, parent version, diff, validation results and content hash. Use compare-and-swap when publishing against an expected active version. A concurrent editor gets a conflict and must merge; it does not overwrite another user's change.

An active configuration bundle references a compatible profile, preferences, rules, autonomy mandate, learning policy, presence configuration, growth mode, efficiency policy, browser policy, deployment configuration, connection grants and runtime configuration. Promoted strategies reference the exact controlling bundle and cannot exceed it. Publish the bundle pointer transactionally so new runs cannot observe a half-updated combination. No real user values are included in these draft templates.

## 3. When updates apply

| Change | New runs | Existing runs |
|---|---|---|
| Tone, ranking preference, ordinary procedure | Next active bundle | Finish pinned version unless explicitly replanned |
| New profile link / contact correction | Current verified revision | Invalidate unsent drafts/artifacts depending on the changed field |
| Corrected claim or changed availability | Current verified revision | Revalidate affected answer/resume before external action |
| New exclusion, user-managed flag, revoked permission, emergency pause | Immediate dispatch barrier | Cancel/hold affected pending effects; completed effects remain audited |
| Permission expansion | After explicit owner publication/grant | No automatic expansion of previously authorized intents |
| Retry or scheduling change | New timers use new policy | Reconcile existing timers under an explicit migration policy; no burst sends |

Each external intent records dependency versions and payload hash. The gateway compares critical dependencies at dispatch. If a relevant fact/rule changed, rebuild and revalidate the payload; do not silently send a stale approved artifact.

## 4. Fixing unwanted agent behavior

1. Open the failed run or incorrect outcome and record the expected behavior.
2. Classify the root cause: wrong fact, wrong preference, unclear skill, missing rule, wrong tool contract, runtime bug, connector failure or ambiguous outcome.
3. Route the fix to the right layer. Do not add prompt rules to hide a database race or expired credential.
4. Create a minimal proposed revision linked to the incident and a failing regression case.
5. Replay in a sandbox with recorded/mocked effects; compare outcome, latency and allowance use.
6. Require all critical invariants and relevant regression cases to pass; summarize changed behavior and affected runs.
7. Owner publishes protected configuration or rejects it. An allowed strategy-only change may instead use the deterministic release service under the published learning envelope. Canary rollout begins with limited permitted scope.
8. Monitor actual outcome metrics and roll back the active pointer if regression appears.

Operations agents can propose fixes and tests. They cannot publish rules, rewrite verified profile, expand access or suppress a failing evaluation. Trace-based evaluation helps identify routing, handoff and instruction failures [S3].

## 5. Proposed rules engine

`rules.yaml` is a declarative policy specification with named enforcement points and an allowlisted predicate/effect vocabulary. Implement this vocabulary in deterministic code. Do not evaluate arbitrary JavaScript, shell expressions, remote code or model-generated predicates from a rule file.

Rule scopes can be global, workflow, agent, connector, account or entity. Platform authorization invariants are non-overridable by model output. For applicable published operating rules: explicit stop/deny wins; unresolved conflicts block the affected action. A more specific rule can narrow access, not exceed a grant. Agent prose is lowest authority and cannot override these checks.

Ordinary style instructions are soft quality rules with evaluations. Duplicate prevention, unauthorized writes, sensitive-data handling and confirmed-outcome requirements are deterministic effect gates. A run log records rule IDs and evaluated results.

## 6. UI requirements

Profile editor: typed sections, links/assets picker, provenance, verification dates, effective dates, conflicts and dependency preview. Preferences editor: structured role/market/stack lists, exclusions, work modes, priorities and scheduling choices; no hidden defaults imported from past conversations.

Rules editor: category, scope, enforcement point, plain-language explanation, structured condition, action, priority, draft diff, affected workflows, dry-run preview, evaluation result, publish and rollback. Display which rules blocked a task and how to address the actual missing prerequisite.

Configuration History: compare revisions, view publisher/reason, find runs using a version, and export a scrubbed template. Profile export is explicit; diagnostic exports omit personal data by default.

## 7. Standing authority and strategy publication

Owner publication during onboarding supplies standing authority for ordinary actions; it does not require the owner to approve every draft. Store the selected workflow types, accounts, fields, audiences, market/compensation boundaries, disclosure choices and spending/action caps explicitly. Mode defaults to autopilot, but only validated, granted capabilities activate.

Separate a strategy revision from a rules/preferences/facts revision. Strategies may choose among validated layouts, reorder verified content, adjust permitted wording/timing and allocate research within the approved envelope. The deterministic release service validates field paths and ranges, complete diffs, base versions, source dependencies, independent evaluator outcomes and canary requirements. Direct agent writes to active strategy pointers are denied. Empty or unknown envelopes cannot auto-publish.

Protected rules, grants, factual claims, hard preferences, runtime code, evaluation thresholds and caps still need the owner or an authorized engineering release. Route decisions through the inbox with a concrete diff; do not require approval for every eligible learning change. Immediate restrictions invalidate incompatible pending strategies. Rollback never restores revoked access or superseded facts. Record service identity, mandate version and promotion evidence for every automatic release.

## 8. Configuration ownership and compatibility

There are twelve document types in the draft bundle. User-facing setup/editor screens own each field; advanced imports use the same validators. Avoid conflicting copies: profile owns factual availability, preferences owns meeting windows and job targets, growth owns service capacity/pricing, autonomy references the grants, browser owns session/challenge behavior, connections owns account/resource bindings, runtime owns process/concurrency settings, and deployment owns packaging. Field references resolve to compatible pinned versions.

When multiple valid caps apply, enforce the most restrictive applicable account, workflow, daily and monthly bound. Share atomic budget/capacity reservations across modes; a commercial workflow cannot spend the same available hours or allowance already reserved by a hiring workflow. Missing required caps do not mean unlimited. Reject incompatible or cyclic policy references during bundle validation.

Do not silently reinterpret a draft schema revision. The release 4.0 runtime contract is schema version 2; other newly introduced document types start at 1. The prior change of automatic_workflow_activation from boolean to a policy enum must be migrated or rejected explicitly, not coerced. Typed active configuration schemas and migration code still need implementation. Performance-oriented strategies cannot edit immutable evidence, caps, evaluation thresholds or authorization.
