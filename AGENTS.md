# Repository guidance

This repository contains a working local alpha plus broader design documents. README.md and IMPLEMENTATION_STATUS.md describe executable scope. The numbered documents and YAML contracts are a roadmap.

- Use Node from .nvmrc; npm ci; format, tests, integration tests and build before pushing.
- Keep private owner data, keys, runtime prompts, logs and backups ignored. Never print keys or serialize provider account secrets into API responses.
- Do not expand external effects silently. Email/calendar execution is limited to explicitly approved exact payloads on the bound account. Browser application submission and publishing remain unavailable.
- Preserve transactional local effects and queue deduplication. Model inference runs separately with bounded attempts; no hidden paid fallback.
- Test on a disposable database. Never truncate the owner's live tables.
- macOS background services run the staged runtime in ~/.local/share/agent-os. Rebuild and reinstall after source changes; do not confuse a source edit with a deployed change.
- Avoid broad process termination or changes to unrelated projects, accounts and machine settings.
