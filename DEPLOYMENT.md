# Docker and your own server

This release supports one owner. Run web, worker and PostgreSQL together on a Docker host. The dashboard binds only to loopback; the database has no published port. The app does not implement user authentication, so do not expose it publicly or add an unauthenticated reverse proxy.

## Start locally

Install Docker with Compose v2. Use the Node version in `.nvmrc` for the one-time secret generator (or run it with Docker as shown below). From the repository root:

```sh
node scripts/docker-setup.mjs
docker compose --env-file deploy/.env -f compose.server.yaml up -d --build --wait
```

If you only have Docker, generate the environment without installing Node:

```sh
docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/app" -w /app node:22.22.3-bookworm-slim node scripts/docker-setup.mjs
```

Open http://127.0.0.1:3101. This is a separate workspace from the original local app on port 3100. Complete access setup and paste your profile. No private profile, Composio key or Codex credentials are baked into the image. `deploy/.env` is private and ignored by Git. Optionally set `COMPOSIO_API_KEY` there, then rerun the Compose command to recreate services.

To enable AI, sign in inside the container using the supported device login flow:

```sh
docker compose --env-file deploy/.env -f compose.server.yaml exec web codex login --device-auth
docker compose --env-file deploy/.env -f compose.server.yaml exec worker codex login status
```

Complete the displayed authorization yourself. Your account may require enabling device-code authentication. The web and worker share a dedicated persistent Codex volume, not the host's whole Codex directory. No API fallback is enabled. Until login is complete, use preparation mode and leave AI assistance off. Explicit models remain Sol/medium for briefs and Luna/low for profile parsing. Linux CLI is pinned to 0.157.1; account availability and sandbox support must be checked on your host before enabling AI.

## Run on your own Linux server

Use an existing machine with Docker Engine and Compose v2, clone this repository and run the same commands. Start with 2 CPU cores and 4 GB RAM as a practical test configuration; this is not a measured capacity guarantee. Database size, source counts, inference allowance and concurrency determine capacity. Build on the host or transfer a privately built image. The same Dockerfile supports the host architecture; no public image has been published.

Keep port 3101 and PostgreSQL closed in the server firewall. From your laptop:

```sh
ssh -N -L 3101:127.0.0.1:3101 YOUR_USER@YOUR_SERVER
```

Open http://127.0.0.1:3101 locally. OAuth returns through that same address while the tunnel is open. `APP_PORT` controls both the loopback mapping and expected origin; use the same local tunnel port. Do not change it to an arbitrary public domain without adding and testing authentication. Server resources and model/connector usage are billed separately; this repository does not provision a paid server.

## Check and operate

```sh
docker compose --env-file deploy/.env -f compose.server.yaml ps
docker compose --env-file deploy/.env -f compose.server.yaml logs --tail 60 web worker migrate
```

Web health checks the database; worker health checks its heartbeat. Health does not prove AI login, Google consent or email delivery. Docker restarts exited services; an unhealthy-but-running service needs investigation. Logs are rotated. Services run as a non-root user without added Linux capabilities; neither the Docker socket nor host directories are mounted.

Stop without deleting data:

```sh
docker compose --env-file deploy/.env -f compose.server.yaml down
```

**Do not add `--volumes` unless you intend to erase the workspace and login.** Named volumes retain database, private runtime files and Codex authentication. This configuration uses different names from the original local database. Restart Docker/your server to resume services; local Docker Desktop still requires an awake computer.

## Backup, update and restore

Before updating, save a private database backup:

```sh
mkdir -p backups
chmod 700 backups
(umask 077; docker compose --env-file deploy/.env -f compose.server.yaml exec -T postgres pg_dump -U agent_os -d agent_os > backups/server.sql)
```

Verify the command succeeded and the file is nonempty. Keep encrypted off-host copies. This backs up application data, not provider login; reauthorize after a lost credential volume. Pull the intended revision, then rerun `up -d --build --wait`; the idempotent migration service applies the schema before web/worker start. Keep a previous image and backup: database changes are not automatically reversible.

To migrate an existing workspace, first stop its web and worker to prevent duplicate scheduled work. Back up its database using its existing backup procedure. Restore only into a new empty server database while the new web/worker are stopped, then run the schema migration and start services. Do not merge two live databases or run two outbound workers against copied approvals. Reconnect provider accounts and review approvals before enabling external actions. Existing host credentials and secrets are not migrated automatically.

## Known limits

This is a private single-server deployment, not high availability or an internet-facing multi-user service. Google can still block Composio consent. Provider and account limits still apply. Linux container authentication/model execution require account setup; a healthy preparation stack does not claim that OAuth or AI authorization is complete.
