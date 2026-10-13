# Gym Backend

Backend for the local/LAN Gym Management System. Single Go binary serving a REST API over HTTPS to staff users (owner, admin, receptionist, trainer) on the gym's local network. Not internet-facing, not member-facing.

Design docs live in [`docs/`](docs/) — this README is only how to run and work on the service.

## Stack

| Concern | Choice |
|---|---|
| Language | Go 1.26 |
| HTTP router | `go-chi/chi/v5` |
| DB driver | `pgx/v5` + `pgxpool` |
| SQL layer | `sqlc` (generated into `internal/db/sqlc/`) |
| Migrations | `goose` (SQL files in `internal/db/migrations/`) |
| Database | PostgreSQL 15+ |
| Auth | JWT (httpOnly cookie) + `gorilla/csrf` |
| Validation | `go-playground/validator/v10` |
| Scheduler | `robfig/cron/v3` |
| Logging | `log/slog` (text in dev, JSON in prod) |
| Config | `caarlos0/env/v11` |

Architecture is a **modular monolith** — see `docs/02-system-architecture.md`.

## Layout

```
cmd/
  server/        HTTP entry point (main.go)
  seed/          One-shot: creates initial OWNER user
internal/
  app/           Router + middleware + feature wiring
  authjwt/       JWT signer/verifier
  config/        Env → typed Config
  common/        Shared helpers (scheduler, pagination, codegen)
  db/
    db.go        pgxpool factory
    migrations/  goose SQL migrations
    queries/     sqlc input .sql files
    sqlc/        sqlc-generated Go
  middleware/    Auth, logging, recovery, CORS helpers
  modules/       Feature packages (member, membership, payment, …)
    <feature>/
      dto.go      Request/response types + validation tags
      service.go  Business logic + transactions
      handler.go  HTTP wiring, Mount(r chi.Router)
docs/            Design docs (requirements → deployment)
Dockerfile      Backend image (goose migrations run at container boot)
entrypoint.sh   Migrate-then-serve container entrypoint
Makefile         dev / build / migrate / sqlc targets
```

Each module is self-contained and mounted from `internal/app/app.go`.

## Prerequisites

- Go 1.26+
- Docker (full stack via the repo-root `docker compose.yml`)
- `goose` — `go install github.com/pressly/goose/v3/cmd/goose@latest`
- `sqlc` — `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`
- PostgreSQL 15 client tools (`pg_dump`, `psql`) only for Windows-host
  backup/restore — otherwise set `BACKUP_USE_DOCKER_EXEC=1` in `.env`

## Quickstart

```bash
cp .env.example .env            # then edit secrets

make db-up                      # start PostgreSQL on :5432
make migrate-up                 # apply all migrations

# Seed the initial OWNER user (idempotent; no-op if users exist)
DATABASE_URL=... SEED_EMAIL=owner@example.com SEED_PASSWORD=changeme123 \
  go run ./cmd/seed

make dev                        # go run ./cmd/server → http://localhost:8080
```

Health check: `GET /health` returns server + DB status and uptime.

## Make targets

| Target | Purpose |
|---|---|
| `make dev` | Run the server from source |
| `make build` | Build `bin/gym-backend` |
| `make test` | `go test ./...` |
| `make fmt` / `make vet` / `make tidy` | Formatting, static checks, module tidy |
| `make db-up` / `make db-down` / `make db-logs` | PostgreSQL via docker-compose |
| `make migrate-up` / `make migrate-down` / `make migrate-status` | goose migrations (reads `DATABASE_URL` from `.env`) |
| `make sqlc` | Regenerate `internal/db/sqlc/` from `internal/db/queries/` |

## Configuration

All config is read from environment variables (see `internal/config/config.go` and `.env.example`).

| Var | Required | Notes |
|---|---|---|
| `ENV` | no | `dev` or `prod`; controls log format. Default `prod`. |
| `PORT` | no | HTTP port. Default `8080`. |
| `DATABASE_URL` | **yes** | `postgres://user:pass@host:port/db?sslmode=…` |
| `JWT_SECRET` | **yes** | ≥ 32 chars. Signs session cookies. |
| `COOKIE_SECRET` | **yes** | ≥ 32 chars. First 32 bytes used as CSRF key. |
| `FRONTEND_ORIGIN` | no | Allowed CORS origin. Default `http://localhost:5173`. |
| `SESSION_TTL` | no | Go duration. Default `8h`. |
| `BACKUP_DIR` | no | Where `pg_dump` writes daily backups. Default `/opt/gym-backups`. |
| `LOG_LEVEL` | no | `debug` / `info` / `warn` / `error`. Default `info`. |
| `HTTPS_CERT`, `HTTPS_KEY` | no | If both set, cookies are flagged `Secure`. |
| `PGDUMP_BIN`, `PSQL_BIN` | no | Override `pg_dump`/`psql` paths when the default on `PATH` is older than the server. |

## Request flow

1. CORS (allows the configured frontend origin, credentials on)
2. Recoverer → Logger → RealIP
3. `/health` — bypasses auth and CSRF
4. `/api/v1/auth/login` and `/api/v1/auth/logout` — public, bypass CSRF
5. Everything else under `/api/v1/` is CSRF-protected (`gorilla/csrf`, cookie-based) and gated by `RequireAuth` which validates the JWT cookie.

Protected routes expect `X-CSRF-Token` on mutating requests. Fetch it from `GET /api/v1/csrf-token`.

## Scheduler

`cmd/server/main.go` starts `common.Scheduler` (cron) before the HTTP server:

1. Registers jobs (daily backup, notification sweeps — see `internal/modules/notification/jobs.go`).
2. Calls `RunOverdueJobs` to catch up anything missed while the server was off (laptop shutdown overnight is expected on-site).
3. Starts the cron ticker.

See `docs/09-deployment-operations.md` → "Daily shutdown contract".

## Testing

```bash
make test
```

Unit tests use stdlib `testing` + `testify`. HTTP tests use `net/http/httptest`. Integration tests spin up PostgreSQL via `testcontainers-go` where present.

## Further reading

| Doc | Topic |
|---|---|
| `docs/01-requirements.md` | Scope, actors, functional + non-functional requirements |
| `docs/02-system-architecture.md` | Stack choices and monolith rationale |
| `docs/03-domain-model.md` | Entities and relationships |
| `docs/04-database-design.md` | Schema, indexes, enums |
| `docs/05-api-design.md` | REST conventions, error envelope, pagination |
| `docs/06-backend-lld.md` | Module internals and transaction patterns |
| `docs/07-auth-security.md` | JWT, CSRF, cookie flags, RBAC |
| `docs/08-cross-cutting-concerns.md` | Logging, validation, codegen, audit |
| `docs/09-deployment-operations.md` | Build, deploy, backups, scheduler |
| `docs/10-backend-development-plan.md` | Phase-by-phase build order |
| `docs/11-licensing.md` | Licensing notes |
| `docs/frontend-integration.md` | Contract for the SPA client |
