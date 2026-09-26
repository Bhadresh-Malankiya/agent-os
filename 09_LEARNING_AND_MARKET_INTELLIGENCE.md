# Learning, Recruiter Feedback and Market Intelligence

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

## 1. Objective and evidence

Improve qualified human responses, interviews and offer quality while reducing unnecessary owner effort and waste. Optimize within verified facts, owner preferences, grants and budgets. Learning is not permission to invent achievements, change target markets or raise message volume beyond limits.

Capture versioned evidence for discovery source, country, hiring geography, role family, seniority, company, application route, resume version, profile snapshot, outreach variant, timing and downstream outcomes. Store employer country separately from allowed work location and candidate work authorization. Link recruiter feedback to exact message excerpts and observed events, with access controls and retention.

Classify acknowledgement, human reply, positive reply, explicit rejection, assessment, interview, offer, bounce, opt-out, pending and unknown separately. Record an explicit rejection reason only when stated. Otherwise keep it unknown or label a hypothesis. Silence, a closed job or a generic rejection does not prove that a resume format failed. Do not infer recruiter motives, private ATS scores, hidden hiring criteria or unsupported personality traits.

## 2. Feedback loop

1. Ingest and deduplicate verified outcomes; preserve contradictory and late-arriving evidence.
2. Compare relevant cohorts by role, market, seniority, route, time period and candidate eligibility. Account for job age, selection bias and changes in candidate availability.
3. Identify a bounded hypothesis: for example, a clearer relevant-project summary may improve responses for a particular role family.
4. Produce a versioned change with supporting evidence, expected benefit, uncertainty, affected fields, baseline, evaluation and rollback plan.
5. Run factuality, formatting, permission, privacy and workflow regression checks using held-out cases. The proposer cannot edit the evaluator or suppress failures.
6. A deterministic release service may canary only allowed strategy changes under the standing learning mandate. Protected changes become Decision Inbox proposals.
7. Collect mature outcomes and compare against the baseline. Promote, retain baseline, roll back or mark inconclusive; log the decision and evidence.

## 3. What can improve automatically

| Within the approved learning envelope | Requires a decision or engineering release |
|---|---|
| Reorder already verified resume bullets or projects | New qualifications, employment facts or achievements |
| Select tested resume layouts and role-specific emphasis | Changing eligibility, compensation boundaries or target countries |
| Adjust outreach wording and timing inside approved windows/cadence | New disclosure, new recipients outside grant, or increased contact caps |
| Reallocate research effort among permitted sources | New paid service, credentials, blocked source or unsupported connector |
| Improve profile wording in granted fields | Identity/contact/visibility changes outside the field grant |
| Rank opportunities within hard preference filters | Changing rules, permission enforcement, runtime code or evaluation thresholds |

Agents propose typed patches. A separate deterministic publisher checks an exact allowlist, unchanged protected values, active grant, evaluator results and expected version. Store strategies separately from owner policies; an agent cannot disguise a policy edit as a strategy parameter. Automatic rollback is allowed only to a still-valid strategy under current rules and facts.

## 4. Experiment contract

Record hypothesis, cohort definition, allocation unit, immutable assignment, baseline/treatment versions, primary metric, guardrails, sample-size rationale, maturity window, review time, maximum duration, cost reservation and stopping rule before exposure. Assign once per opportunity; do not send competing applications or duplicate outreach to test variants. Use company-level grouping when contact contamination would distort results. Log any confounding profile or runtime changes.

Attribution stores first discovery, all known sources and actual application route separately. Deduplicate syndicated jobs. Separate delivered/confirmed sends from attempts; show positive human replies per mature delivered first contact, and interviews per mature confirmed application. Do not sum overlapping source cohorts as independent successes.

Use a delivered-contact denominator only when actual delivery evidence is available. Otherwise label it mature confirmed sends; provider acceptance or a Sent-folder record does not prove delivery, reading or attention. Keep metric definitions stable within an experiment and display unavailable delivery data as unknown.

A bounded experiment may start without evidence of improvement, but not without validation and exposure limits. Automatic promotion requires sufficient mature evidence under the predeclared test, not a universal sample-count shortcut or one good reply. Display uncertainty intervals where meaningful. Sequential tests need an explicit stopping method; otherwise review at the fixed endpoint. No response inside the observation window remains pending. Low-volume cohorts can remain inconclusive indefinitely and use the baseline.

Start conservatively: one active experiment per overlapping cohort, no more than 10% eligible exposure, seven-day minimum observation and thirty-day maximum experiment duration. These are proposed safety defaults, not statistically sufficient sample sizes or guaranteed hiring response times. Each experiment must also configure a suitable maturity window, sample-size/stopping plan and measurable guardrail thresholds before activation. Preserve delayed outcomes after closure; recompute reports without silently rewriting historic release decisions.

Stop immediately for unsupported claims, unauthorized disclosure or duplicate external effects. Also stop or roll back for predeclared bounce/complaint/quality/cost regressions. Restore unsent content to the valid baseline. Already sent messages cannot be recalled by rolling back a strategy. Public profile restoration is itself a verified external action and must not overwrite newer manual edits.

## 5. Country and source discovery

Maintain a living country × role × seniority × hiring-route source registry. Discover regional job boards, employer career pages, specialist recruitment agencies, professional communities, university/alumni networks, remote-work boards, startup ecosystems, industry associations and talent directories. A category is a research target, not a promise of integration or a verified vendor recommendation.

For every concrete source record its URL, category, supported markets/languages, role coverage, candidate eligibility, access requirements, cost, automation capability, freshness, provenance, quality indicators and observed funnel. Check current first-party evidence when adding a service. Separate popularity from demonstrated results for this candidate; mark insufficient data explicitly. Avoid fixed claims that a country or platform is always the best.

Discover public sources read-only under an explicit discovery grant. New sources move through DISCOVERED → REVIEWED → PILOT → ACTIVE, or RESTRICTED/RETIRED. Automatic pilot admission requires every onboarding criterion: allowed market/category, supported access, current legitimacy evidence, no blocked destination, no new payment/login/terms acceptance, existing research grant and budget. Application, contact and publishing grants are evaluated separately. Otherwise prepare an exception with the proposed benefit and exact missing permission. Prioritize these as setup opportunities rather than repeating one question for every job.

Rank source allocation using eligible fresh opportunities, confirmed applications, mature positive replies/interviews, cost per useful outcome, duplicate/stale-job rate and owner effort. Keep bounded exploration within the same budget so early winners do not permanently hide new sources. Country research may propose a new market; it cannot change work authorization or activate an excluded market.

## 6. Dashboard and outputs

Learning Center shows observation versus hypothesis, sample counts, maturity, evidence, current baseline, canaries, automatic promotions, rollbacks and reasons. Market Map shows coverage and outcomes by country, role and source with unknown cells visible. Recruiter Insights summarizes requested skills, common explicit objections, requested documents and response timing at thread/company/cohort level without pretending to know private decisions.

Outputs include a weekly learning report, source allocation plan, country opportunity map, resume/content variant report and factual profile-improvement proposals. Reporting frequency is configurable; experiments and ingestion run without requiring report approval. No promised interview uplift or guaranteed ranking is supplied by this design.

## 7. Cost-aware learning and commercial cohorts

Treat token/context/model-route changes as evaluated optimizations with fixed factuality and completion floors; compare cold and warm cache costs including failures. Preserve a held-out suite, independent scoring and periodic human calibration. Store allowed strategy changes separately from protected efficiency/routing policy. Model-produced code patches can be proposed for maintainer review but cannot deploy themselves.

Split hiring and client-growth cohorts. Commercial outcomes include qualified response, discovery call, scoped proposal, accepted contract and evidenced payment; never treat a sent proposal as won revenue. Improve service positioning using verified case studies, not fabricated achievements or unsupported promises. Source discovery respects the relevant market and commercial/hiring communication policy.

Low-volume users may not accumulate enough evidence for statistical promotion quickly. Deliver factual audits and deterministic error fixes promptly while retaining baseline strategies until sufficient evidence exists. No training of foundation models or pooling of private users' data is part of the default self-improvement design.

## Current UI distinction

The Agents view now exposes evidence-backed **execution maturity**, separate from this document's planned strategy learning. L0/L1/L2 badges update from actual recent runs and source state; they do not establish recruiter-outcome improvement or authorize strategy promotion. The Learning view remains observational. Do not reinterpret 20 successful local preparations as evidence that a resume strategy is effective.
