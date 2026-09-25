# Security policy

v0.1.0 is a local alpha. It is not a supported public multi-user service or a security certification. Bind to loopback and do not expose it through a public proxy. Anyone with access to the local machine's user session may access the dashboard.

The server rejects unexpected Host headers; mutation routes require the configured same-origin Origin. SQL inputs are parameterized. Profile data is private in PostgreSQL, `.env` is mode 0600 on setup, and runtime artifacts/backups are excluded from Git. Composio keys remain server-side. This is not equivalent to encrypted database storage or a multi-tenant authorization layer.

The application has no email-send, browser-submit or publishing endpoint. Codex executes with read-only sandboxing, user config ignored, optional tools disabled, a restricted environment and an isolated work directory. Generated prose is untrusted draft content. Evidence-ID validation does not guarantee factual correctness. Personal profiles and descriptions are sent to the selected Codex provider only when AI assistance is enabled.

Report privately through the repository's **Security → Report a vulnerability** flow when enabled. If unavailable, request a private reporting route from the maintainer without disclosing exploit details publicly. Never attach real credentials, personal records, account-link URLs or private logs to an issue.

Supported release: current local alpha only, best-effort fixes. There is no formal response SLA. Security changes need relevant tests and dependency checks. Planned controls are described in [design acceptance](16_RELIABILITY_SECURITY_AND_ACCEPTANCE.md); their presence there does not mean they are implemented.
