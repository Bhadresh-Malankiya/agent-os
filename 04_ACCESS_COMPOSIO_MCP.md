# Access, Composio, MCP and Connection Setup

> **Implementation note (v0.1.0):** This document describes the target design. See [README](README.md) and [implementation status](IMPLEMENTATION_STATUS.md) for the running local alpha; broader capabilities below remain planned.

## 1. Connection architecture

Provide one internal adapter contract for native APIs, optional Composio-managed integrations and reviewed MCP servers. Each operation declares schema, account/resource scope, read/write classification, timeout, idempotency capability, cost visibility and result-verification behavior.

Composio is an optional account/tool access layer, not the model runtime, business database or permission authority. Its connection capacity, supported actions and pricing are separate from a ChatGPT/Claude subscription. Do not claim universal access: some services require an OAuth app, admin approval, provider API key, paid plan, or direct browser authentication.

## 2. Composio connection flow

Composio documents auth configurations and secure connection links for user authentication [S5]. Proposed Agent OS flow:

1. The authenticated owner selects a toolkit and required operations.
2. The backend maps the logged-in app identity to a stable workspace/user identity; never trust a browser-supplied arbitrary user ID.
3. Select a compatible managed/custom auth configuration with minimal scopes.
4. Create the supported connection flow and send the user to its official Connect Link.
5. Verify completion through the backend, account ownership, provider identity, granted scope and connection health; a success redirect alone is insufficient.
6. Store connected-account/auth-config references and permitted resource mappings, not exposed refresh tokens.
7. Run a harmless read test and show account identity. Grant selected agents specific operations separately.
8. Writes continue through the Agent OS action ledger and gateway before adapter dispatch.

The UI supports multiple accounts with explicit selection; a work account must not silently substitute for a personal one. Connected-account documentation covers hosted linking, reconnect and revocation behavior; pin an SDK version and implement current documented methods, not copied deprecated snippets [S6].

## 3. Tool Router sessions

If Tool Router is used, create sessions for the correct application identity and configured toolkits/accounts. Keep session references separate from connected-account references. Execute session meta-tools through the documented session execution path; Composio distinguishes this from direct execution [S7].

Do not expose unrestricted dynamic execution or batch tools that evade the gateway. Either constrain session execution to individually authorized operations, wrap every nested write with enforced checks, or keep that broad capability disabled. Session-level tool discovery cannot expand an agent grant.

## 4. Required capabilities

| Capability | Allowed implementation choices | Setup/verification requirement |
|---|---|---|
| Email | Native provider API or supported Composio toolkit | Correct account, selected read/send scope, thread and Sent verification |
| Calendar | Native or supported Composio toolkit | Selected calendar, availability and event capabilities |
| Documents/files | Native, Composio or reviewed MCP | Selected folder/file scope and version handling |
| Tracker/spreadsheet | Native or supported Composio toolkit | Exact resource/columns, read test, serialized mapped writes |
| Public research | Supported research/search adapter | Source access, evidence refs, cost/limits disclosed |
| Browser applications | Isolated local/server/hosted browser service | Own session authentication and permitted domains; not supplied automatically by Composio |
| Internal knowledge | Scoped internal tool API/MCP | ACL-filtered sources and provenance |
| Custom business app | Reviewed API or MCP contract | Correct audience, scopes, schemas and safe diagnostics |

## 5. Authentication and credential controls

Connections are configured after the relevant account owner completes the provider's flow. The system can prepare and test a flow; it cannot infer consent from an installed plugin or access from a chat session elsewhere.

Composio API credentials, native API credentials and browser secrets reside in a vault or provider-managed store. Configuration contains references only. Official model CLI login is a separate credential lifecycle; do not import its session tokens into Composio or MCP.

Validate webhook signatures/origin and deduplicate event IDs. In OAuth flows validate state/callback bindings and applicable PKCE. In MCP enforce intended audience and no token pass-through. Block private-network destinations and unsafe redirects for user-supplied URLs. Keep credentials out of logs, model context and downloadable diagnostics.

Disconnect first revokes application grants and stops pending effects. Then attempt upstream revocation where supported and report its status accurately. Deleting a local mapping is not proof that upstream access was revoked. Reconnection must revalidate identity/scope, not silently resume every prior permission.

## 6. Setup and account UI

Pages: Integrations catalog, Connected accounts, Resource selection, Agent grants, Connection health, Browser sessions and Runtime login. A card displays implemented/planned status, provider identity, account label, required/granted scopes, selected resources, dependent agents, last successful read/write, error and reconnect/revoke controls.

For Composio expose adapter mode, selected toolkit, auth-config reference, connected-account reference and health in an advanced panel. Keep vendor implementation details out of ordinary task flows. Unknown quotas/capabilities are shown as unknown; they are not inferred from successful authentication.

No account is connected by this starter. `connections.template.yaml` remains empty and disabled until setup and capability verification are implemented and completed.

## 7. Profile capabilities and standing grants

Extend the adapter contract with profile read, field update, public post, account creation and read-back verification as separate operations. Store supported fields, provider constraints, visibility/audience scope, last-tested version and verification method. Publishing a profile and publishing a post are different grants. A generic connected account or Composio toolkit is not proof that either operation exists.

One-time onboarding bundles the user's selected grants into a standing mandate. Subsequent supported actions use that mandate automatically; newly required access creates one actionable decision. Catalog discovery can run read-only under a research grant. Unavailable writes yield copy-ready content and a manual task, not a claimed update. Keep supported/manual/unknown capability states visible in the UI.

## 8. Cloud browser, commercial and extension access

The default browser route is local isolated Playwright. Optional cloud transport needs its own provider connection, spending cap, account capability probe and acceptance of the data transfer. The browser's model gateway is separately disabled unless explicitly configured; a browser API key is not permission for unlimited model spend. Use browser.template.yaml for session/challenge settings and keep credentials in connection secret references.

Client prospect research, proposal submission, paid bids and client communication are separate capabilities from hiring. New providers/plugins pass schema, license, cost and gateway conformance review. An MCP tool is not a trusted extension merely because it is discoverable. Document supported/no-write/manual paths for each capability; no automatic provider signup or purchase happens in this starter.
