# Contributing

Use Node 22.22.3 and `npm ci`. Run `npm run setup` with Docker running, then `npm run dev` and `npm run worker`. Read [implementation status](IMPLEMENTATION_STATUS.md) before assuming a design feature exists.

Before a PR: `npm run format`, `npm test`, `npm run test:integration`, `npm run typecheck`, and `npm run build`. Integration tests create a disposable database; they never clear the owner's database. CI repeats the tests using its own PostgreSQL service. Keep changes focused and include a regression test for new behavioral boundaries.

Never commit `.env`, real profiles, private logs, model prompts, application materials, account/session links or backups. Use synthetic fixtures. Do not add external sending or browser submission behind an ordinary “approve” button: implement the immutable action ledger, scope checks, deduplication, ambiguous-outcome handling and independent receipt verification first.

New provider integrations must document permissions, prices, data sent, failure modes and supported capabilities. Do not expose a generic unrestricted tool-execution endpoint. A model must never grant itself credentials, change its evaluator or deploy its own code.

The runtime does not parse the design YAML templates. Keep future requirements clearly distinguished from the implemented README. Efficiency claims need measured comparisons with unchanged quality checks. Follow [security reporting](SECURITY.md) for vulnerabilities.
