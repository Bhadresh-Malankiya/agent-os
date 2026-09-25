# Profile Presence, Discoverability and Content

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

## 1. Coverage and inventory

Agent OS should manage the candidate's professional presence alongside applications. Build a capability registry covering professional networks, general/regional job boards, employer talent pools, recruitment-agency databases, specialist talent marketplaces, code/project portfolios, personal websites, industry communities and alumni directories. Select relevance by profession and market rather than creating every possible account.

Every actual platform has an adapter record: country/role relevance, profile URL/account owner, supported fields, limits, read/draft/publish/verify capabilities, authentication, permitted automation, account tier, last-tested date and known restrictions. Display **Supported**, **Read only**, **Content ready**, **Needs connection**, **Manual update**, **Unavailable**, or **Not evaluated** honestly. A platform appearing in a catalog does not mean publishing works. Research current services during onboarding and periodic discovery; this specification does not assert a current complete platform list.

New-platform discovery runs automatically within authorized research. Account creation, payment, new terms acceptance and visibility expansion require mandate coverage or a Decision Inbox item. Do not copy private contact data or sensitive facts into public profiles just because they exist in the master profile.

## 2. Profile audit

Snapshot the current profile through authorized access. Compare against verified candidate facts, target roles, selected markets and platform-specific requirements. Check:

- Headline and role clarity; searchable skills grounded in actual experience.
- Summary quality, relevant achievements, dates, consistent seniority and readable experience bullets.
- Evidence quality, working portfolio links, project descriptions and accessible contact routes.
- Consistency across resume, profiles and portfolio without forcing identical wording everywhere.
- Availability, preferred roles/locations and contact settings against their freshness and disclosure policy.
- Missing required fields, language/localization, file limits, formatting and supported discoverability settings.

Each finding carries a severity, evidence, proposed fix, verified claim references and expected practical benefit. A completeness or clarity score is an internal rubric with published components; it is not a provider search rank or a universal ATS score. Only report impressions, profile views and recruiter searches when the platform supplies them. Never invent missing metrics.

## 3. Ready-to-use content package

Generate platform-specific headline alternatives, about/summary, experience bullets, skills ordering, project descriptions, portfolio case-study drafts, recruiter introduction, relevant resume attachment and any permitted availability text. Respect exact field lengths and supported formatting. Include field-by-field before/after, claim map, target role/market, rationale and current version dependencies.

Where selected by the owner, also prepare evidence-based professional posts or project updates. Public posting has its own audience, topic and cadence grant; profile-edit permission does not automatically authorize posts, comments, endorsements, connection requests or messages. Avoid manufactured achievements, keyword stuffing and repeated promotional spam. Translation/localization preserves meaning and facts.

Missing metrics or project details create a consolidated evidence request, not fabricated numbers. Produce all content that is supported by known facts while holding only dependent sections.

## 4. Automatic publication and manual fallback

Audit → draft → factuality/field validation → grant and version check → serialize per account/profile → publish supported changes → read back and compare → record confirmation and snapshot.

During setup the owner can authorize ongoing edits to selected public fields and reversible settings. With that mandate, ordinary verified wording changes publish automatically without a new approval. Sensitive identity, compensation, work-authorization, contact, visibility and availability fields need explicit field/disclosure coverage; unknown values remain blocked.

Before publishing, compare the current remote version/content hash with the audit snapshot. Preserve manual edits; rebase nonconflicting changes and ask only about unresolved conflicts. Invalidate queued payloads when source facts change. A multi-field partial save is recorded per field and reconciled, not reported as a complete success. An uncertain save is OUTCOME_UNKNOWN until read-back resolves it.

If publishing is unsupported, provide a complete copy-ready package with exact field names, navigation/deep link, current content, replacement content and remaining steps. Put the manual update in the Decision Inbox and continue other work. After the owner reports completion, verify by read-back if possible; otherwise label **Owner reported**, not independently verified. Do not claim the profile was updated merely because a draft was created.

Restoration uses the previous snapshot only when current facts/grants still permit it and no newer manual edit would be overwritten. If read-back or rollback is impossible, flag that capability before automatically changing the field; operations requiring unavailable verification remain content-ready/manual.

## 5. Visibility strategy and learning

Prioritize evidence-backed positioning, relevant platform coverage, coherent project proof, current availability and responsive communication. Track qualified inbound contacts and interviews attributable to a platform where observable. Distinguish self-reported source, observed referral and unknown attribution. Treat provider visibility metrics as supporting indicators, not proof of hiring benefit.

Avoid changing the same profile repeatedly to chase noisy results. Apply a seven-day default minimum interval per field unless correcting a verified factual error, broken link, urgent availability change or owner instruction. Profile experiments share one controlled exposure timeline; do not pretend visitors were randomly assigned to historical versions. Use the cautious learning process in 09_LEARNING_AND_MARKET_INTELLIGENCE.md.

The Profiles UI shows platform status, audit findings, ready content, verified live fields, last sync, conflicts, manual tasks and available outcome metrics. A Coverage view proposes relevant missing platforms by country/role with evidence and setup effort. Broad coverage is a continuing discovery process; no design can promise every platform, first-place search visibility or guaranteed recruiter attention.

## 6. Hiring versus service positioning

Profiles can support employment, consulting or both according to the owner's selected mode and audience grants. Generate service descriptions and case studies for client acquisition from verified work, and career-specific summaries for hiring. Detect inconsistent availability or conflicting positioning across platforms rather than publishing incompatible promises.

Default to draft/audit outputs early in the release sequence; activate automatic field publication only after an adapter passes verification and ownership tests. Evaluate profile content on clarity, evidence, relevance and observed qualified inbound outcomes. Reuse validated sections by exact fact/template version to reduce generation cost. Executive-style advice is not evidence of the candidate's seniority or employment history.
