# Outreach OS — working flow and design decisions

Updated 2026-09-27. This is the executable workflow, not the broader autonomous-submission roadmap.

## What runs automatically

1. With agents enabled, a persisted schedule becomes due every hour by default. Overview supports 1, 3, 6, 12 or 24 hours and “Run batch now.” The worker must be running on an awake host.
2. Scout checks up to 20 enabled Greenhouse/Lever boards per batch. Existing per-source matching, response limits and a maximum of 50 new matches per refresh apply. Repeated listings are deduplicated.
3. If client prospecting is enabled, an observed company hiring role can create one client prospect per company. It is explicitly a hiring signal, not a contract, verified budget, verified contact or request for services.
4. Valid-profile leads queue preparation within daily limits. Existing packages become editable email drafts automatically, even without Gmail access. AI can improve untouched job drafts within the existing Sol/medium budget; owner edits are preserved. Client signal intros stay conservative and source-grounded.
5. Each batch records start/end, checked sources, added leads, queued packages and notes. Drafts may finish after the batch; the current draft count is authoritative. PostgreSQL locks prevent overlapping batches; interrupted passes retain their effects and later passes deduplicate them.

## The owner's short flow

**Overview → Leads → Drafts.** Review the source, add a verified recipient, edit and save the message. Choose:

- **Open email app / Open Gmail draft:** opens an unsent message with the text filled. It does not send or create a provider receipt. Gmail handoff is independent of Composio. Long URLs may not work in every mail client; use the email file instead.
- **Résumé PDF / Cover note:** downloadable material using saved facts or the saved draft. The PDF is the saved base résumé, not invented job-specific employment history. The current embedded font covers Latin-script text; other scripts need an appropriate font before relying on the export.
- **Email + résumé (.eml):** a MIME email file with the saved message and a PDF attachment, marked `X-Unsent`. Import/open it in a mail client that supports draft files. Mail links cannot attach local files automatically.
- **Approve connected send:** only when the required account is connected and the exact saved payload has been approved. Existing account binding, suppression, daily limits and contact cooldown remain enforced.
- **I sent this myself:** a separate confirmation records an owner-reported send. It is not independently verified delivery and does not resend anything. These records count toward subsequent automatic contact cooldowns.

Missing compensation, availability or work-authorization facts stay out of messages. Optional review notes are collapsed; they do not block unrelated draft preparation. Never guess contact addresses. No browser application submission, CAPTCHA automation, automatic reply ingestion or confirmed client-demand search is implemented.

## Competitor review and what we adopted

Reviewed official product/help pages on 2026-09-27; these are product descriptions, not independently benchmarked claims.

| Product | Observed pattern | Decision here |
|---|---|---|
| [Teal](https://www.tealhq.com/how-it-works) | Job tracking plus résumé preparation | Keep lead, draft and downloadable résumé close together. |
| [Huntr](https://huntr.co/) | Job/contact/interview tracking and résumé/cover-letter tools | Provide concise stage views, outcome records and materials without exposing every configuration on the main page. |
| [Apollo sequences](https://knowledge.apollo.io/hc/en-us/articles/27155594412173-How-to-Run-Multichannel-Outreach-Sequences-in-Apollo) | Scheduled outreach steps, draft preparation and mailbox-dependent sends | Separate discovery/preparation scheduling from approved delivery; offer an explicit manual email route when a mailbox is unavailable. |

We did not copy outcome claims, scrape competitors, subscribe to prospect databases or claim feature parity. Broader verified-contact sourcing and reply-aware sequences need additional supported data sources and account access.

## Maintenance and limits

Run format, unit/integration checks, build and Docker CI before release. Test with synthetic data or disposable databases; never send real test messages. Preserve private profile data, credentials and backups. A source failure should appear as a batch note without losing other work. Check logs and batch history for recurring failures rather than silently increasing model spend.

The default schedule does not create infinite work: it rechecks configured sources and only prepares new eligible records. Discovering entirely new companies globally, verifying recipient emails, and finding paid contract requests are not provided by these public job-board adapters. Add known boards and client opportunities explicitly. No number of leads, interviews or client wins is guaranteed.
