# Operations

## Supported deployment

v0.1 is a single-owner local app bound to `127.0.0.1:3100`. PostgreSQL is bound to `127.0.0.1:55432`. Host validation and same-origin JSON mutation checks protect the local surface, but this is not a multi-user authentication system. Do not put a public reverse proxy in front of it.

The minimum runtime is Node 22.22.3. Start Docker first, then `npm run setup`. Use `npm run doctor` after changes. There is no Redis dependency in this alpha: PostgreSQL row locks and transactional local effects provide durable dispatch. Redis/BullMQ remain design options for a later distributed deployment.

## Background operation on macOS

Build and run `npm run service:install`. The installer copies a runtime to `~/.local/share/agent-os` so the background service does not depend on interactive access to the protected Documents directory. `.env` remains private in both locations. Database records remain in the same Docker volume. Changes in the source checkout require a fresh build and reinstall to update the staged runtime.

The installer creates `~/Library/LaunchAgents/dev.agent-os.web.plist` and `dev.agent-os.worker.plist`. They run at login and restart after a crash. Logs are in `~/.local/share/agent-os/private/logs/`. Log rotation is not implemented; inspect disk use periodically. Docker must already be running, including after a reboot. Launching Docker on login is a separate operating-system preference.

```sh
launchctl kickstart -k gui/$(id -u)/dev.agent-os.web
launchctl kickstart -k gui/$(id -u)/dev.agent-os.worker
```

To stop them without deleting your data:

```sh
launchctl bootout gui/$(id -u)/dev.agent-os.web
launchctl bootout gui/$(id -u)/dev.agent-os.worker
```

The plist files remain and will load at the next login. Move those two files out of LaunchAgents if you want to disable future startup. Do not terminate unrelated Node or Docker processes.

Linux: run `npm start` and `npm run worker` as your own unprivileged services using a supervisor of your choice, with this checkout as working directory and its private environment. No packaged systemd installer is included or verified. Windows background installation is not tested.

## Backups and recovery

`npm run backup` creates a private SQL dump under ignored `backups/` using the container's matching `pg_dump`. Copy encrypted backups to storage you control. The dump contains your profile and all workflow data. Back up `.env` separately in a password manager; do not commit it.

Before restoring, stop the worker and take a new backup. Restore into a separate database for verification first, rather than overwriting the only copy:

```sh
docker compose exec -T postgres createdb -U agent_os agent_os_restore
docker compose exec -T postgres psql -U agent_os -d agent_os_restore < backups/SELECTED_FILE.sql
```

Use a fresh database name if it already exists. Point a separate private test environment at the restored database and inspect counts before switching production. Restoring from this command is an operator action, not an automatic application button. The initial schema uses additive `IF NOT EXISTS` changes; destructive migrations and automated rollback are not included.

## Failure handling

- **Database down:** requests show a connection error; the worker retries without logging private payloads.
- **Worker stopped:** queued local work persists; UI shows a stale heartbeat after 20 seconds. Model work runs with an independent heartbeat.
- **Local worker crash:** transactional package writes roll back together. A new worker can claim the queued work. It never partially writes a package then records completion separately.
- **AI interruption:** failed/stale inference is recorded; no blind retry or paid fallback. Attempt count contributes to the configured daily cap. Stale detection runs when AI assistance is enabled. Re-enabling AI does not retry completed or failed opportunity briefs automatically.
- **Source failure:** error appears in Connections; automatic retries occur on the next six-hour cycle. Manual Sync now is available. Source fetches are restricted to fixed provider hosts, with redirects disabled.
- **Account expired:** use the provider connection flow again. This alpha does not consume email or execute tools after connection.
- **Pause:** Settings pauses new local processing, not a model call already in flight. In-flight local/model output may still complete; no external write occurs.

## Runtime data and boundaries

One local owner and twelve database connections per process. There is no row-level tenant isolation. Do not treat a source's location text as verified country data. Source matching is title filtering and skill overlap, not an objective hiring score. Descriptions may contain malicious instructions; they are treated as data, and no external write tool is available in the application.

All scheduling uses the PostgreSQL server's day boundary (UTC in the Docker configuration). UI dates use your browser locale. Model token counts come from CLI events; missing counts remain unknown. Hard limits apply to attempts/time/context size; there is no guaranteed model-token ceiling because the provider controls reasoning and prompt overhead.

## Continuous performance mode

Settings now exposes Balanced or Performance execution. Performance uses half the detected logical CPU capacity, bounded to 1–8 local preparation tasks (7 on the verified 14-core machine). This is concurrent asynchronous work, not a promise to consume every CPU core. Intake, local preparation, model inference and heartbeat run independently; a slow model no longer stalls other work.

Local package caps are configurable up to 1,000/day. AI attempts are separately configurable up to 100/day and still use a single account session, existing provider limits, bounded context and a 120-second timeout. Three AI failures within 30 minutes pause further attempts until failures age out. No additional credentials, premium providers or paid fallback are activated by performance mode.

A local preparation failure rolls back its effects and retries with delay. After three failed attempts it is quarantined and a decision item is created; healthy jobs continue. Fixed provider source hosts and an 8 MB streaming response cap bound input. A database advisory lock prevents simultaneous source fetches. Model generation is cancelled when its database connection reports failure.

These tests cannot exhaust every failure scenario. This release still prepares drafts rather than sending applications. Continuous local work requires Docker and an awake computer. The in-app activity view shows the active execution mode and concurrency.

## Evidence and activity

Run `npx tsx --env-file=.env scripts/import-evidence.ts private/evidence.json` to import a reviewed private JSON array of `{ "topic": "performance", "content": "Exact documented excerpt", "source": "Source and location" }`. Supported topics are defined in `lib/clarifications.ts`. Each entry is content-addressed and deduplicated. Only import authorized professional evidence; this does not crawl the filesystem or read credentials. Deactivating a stale row in `knowledge_facts` invalidates future clarification results. Updates to evidence do not modify verified profile facts or authorize external effects.

The new Resolver lane independently prepares evidence context and records blockers. `agent_activity` stores current lane state; `audit_log` retains attributed actions and clarification evidence IDs/revision hashes. Both are private database data included in SQL backups. No retention deletion or audit export interface is implemented. A process interruption can leave an old activity row; the UI shows offline/stale status rather than asserting continued work.
