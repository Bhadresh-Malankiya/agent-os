# Product Strategy, Hiring and Client Growth

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

Design release 4.0: proposed requirements, not implemented capabilities or measured outcomes.

## 1. Founder review and product focus

The strongest product is an evidence-backed opportunity assistant: find relevant work, prepare persuasive truthful materials, execute permitted steps, and remember the outcome. Its advantage should be verified completion, low owner effort and predictable cost. Agent count, application volume and GitHub popularity are not success metrics.

The existing design has good authorization and recovery boundaries, but was missing a narrow first release, client acquisition, a repeatable installation contract, a concrete browser choice and cost/quality measurements. Address those before adding more autonomous roles. Start with one self-hosted owner/workspace and a small tested adapter set. Preserve workspace isolation in the data model; do not advertise hosted multi-tenant readiness until its separate tests pass.

“Think like an experienced founder” is a review perspective, not a candidate credential. Never turn aspirations about experience, model creation or employment at a named company into profile facts. Prestigious target employers can be configured by the user, but eligibility and achievements must be evidenced. No claimed affiliation with or endorsement by public executives.

## 2. Three selectable modes

| Mode | Objective | Distinct configuration and outputs |
|---|---|---|
| Hiring | Relevant interviews and suitable employment | Role/market filters, resume, application answers, interview preparation, offer comparison |
| Client growth | Qualified commercial conversations and suitable projects | Services, ideal client, case studies, discovery questions, proposal, estimate and scope |
| Both | Balanced employment and project pipelines | Shared availability/capacity; separate identities, messaging, budgets, exclusions and reporting |

Default setup asks for mode once. Existing job-search grants do not authorize sales outreach. In Both mode, avoid contacting the same company through conflicting pitches; deduplicate company/person relationships across pipelines and ask only about material conflicts. Make mode allocation and reserved response capacity explicit.

## 3. Client acquisition lifecycle

Configured service offering → approved source discovery → canonical lead and evidence → fit/budget/timing assessment → relevant proof/case study → tailored introduction or proposal → authorized send or supported bid → verified send/submission → conversation and discovery call → revised scope/estimate → contract decision → accepted-project handoff.

Services specify deliverables, evidence of past work, exclusions, rate/pricing boundaries, currency, available hours, start date and capacity. Leads include organization, public business need, source/date, contact route, target geography and confidence; private budgets and purchase intent remain unknown unless evidenced. Sources can include inbound inquiries, approved project boards, agency partnerships, public tenders and existing referral relationships. A paid bid or new marketplace account needs grant and budget coverage.

Generate concise proposals containing the client's observed need, proposed approach, scope, assumptions, milestones, dependencies, acceptance criteria, timing estimate, price/range where authorized and relevant proof. A speculative observation must be labeled, not presented as a private audit or established failure. Ask consolidated scoping questions when necessary; never promise an unverified implementation time to win work.

Automatic follow-ups, replies and meeting booking operate within the commercial mandate. Respect opt-outs, exclusion lists, provider limits and selected jurisdictions; launch requires an applicable communication policy, not a universal legal-compliance claim. Do not scrape private contacts, guess personal addresses, invent referrals, create bulk unsolicited campaigns or make fake testimonials. Contract signature, guarantees, exclusivity, IP transfer, unusual liabilities and discounts outside configured bounds become concrete Decision Inbox items.

Winning a project is followed by a structured handoff: agreed scope, authorized price, milestones, dependencies, client decisions and open risks. Autonomous execution of arbitrary client projects, invoicing, payments and deployment are separate future capabilities with their own permissions, not silently included in acquisition mode. Track signed work and paid revenue separately; a proposal is not revenue.

## 4. High-quality hiring strategy

Use a target-company/role shortlist with live official role evidence. Map each important requirement to verified work, a concrete example or a visible gap. Prepare a focused resume, relevant portfolio proof and a company-specific introduction. Offer a realistic learning or portfolio plan for gaps; generating a plan does not mean the candidate has acquired the skill.

Prepare interview practice, system-design questions, factual achievement stories and questions for the hiring team. Provide practice and scheduling support; identity-bound assessments and actual interviews remain candidate activities. Optimize relevance and proof before increasing volume. Separate employment, contract and consulting outcomes so feedback is not pooled incorrectly.

## 5. First useful results within hours

These are proposed product targets after the application exists, on a supported machine with working accounts, sufficient model allowance and complete required facts. They are not current performance results or promises of external responses.

| Window after prerequisites | Demonstrable output |
|---|---|
| First 15 minutes | Demo dashboard, synthetic workflow, visible question/answer/resume cycle |
| First 30–60 minutes after live setup | Profile audit, evidence gaps, a prioritized shortlist if eligible opportunities exist |
| First 1–3 hours | At least one complete verified resume/application package or client proposal; authorized supported delivery when possible; exact blockers otherwise |
| Following days | Measured replies, source quality, owner effort and gradual profile improvements |
| Sufficient mature evidence | Tested strategy improvements, with inconclusive cohorts retaining baseline |

Never fill a shortlist with irrelevant opportunities to satisfy a target. Display no-fit and blocked states honestly. Recruiters and clients control response timing, interviews and purchases; the product cannot guarantee employment at a named company or a contract within hours.

## 6. Release sequence and defensibility

Release A: offline demo and reliable setup. Release B: complete hiring workflow plus one supported application adapter, inbox and resume QA. Release C: client proposals, one contact integration and capacity coordination. Release D: profile publication, market discovery and bounded outcome learning. Each stage requires the preceding operational gates; profile draft/audit tools may ship earlier without claiming automatic publishing.

Make portability, reproducible benchmarks, useful contributor fixtures and clear capability coverage the open-source differentiators. Share sanitized procedures and synthetic tests; candidate data, recruiter messages and customer documents remain private. Extensions must improve measured cost/quality or add tested coverage. A famous framework is not itself a product advantage.
