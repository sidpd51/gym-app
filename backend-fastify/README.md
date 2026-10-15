# Gym Backend (Fastify)

TypeScript/Fastify port of the Go backend in [`../backend`](../backend). Same REST API (`/api/v1/...`), same
PostgreSQL schema, same cookie-JWT + CSRF contract, so the existing frontend works unchanged. Design docs
still live in [`../backend/docs/`](../backend/docs/).

## Stack

| Concern | Choice |
|---|---|
| Runtime / language | Node 20+, TypeScript (ESM) |
| HTTP | Fastify 5 (`@fastify/cors`, `@fastify/cookie`, `@fastify/rate-limit`) |
| DB driver | `pg` with hand-written SQL (the queries from the Go `sqlc` files) |
| Migrations | goose-format SQL in `migrations/`, applied by `src/db/migrate.ts` (shares the `goose_db_version` table, so a DB migrated by the Go backend is already up to date) |
| Auth | HS256 JWT in `gym_session` httpOnly cookie; signed double-submit CSRF (`gym_csrf` cookie + `X-CSRF-Token`) |
| Validation | `zod` → `400 VALIDATION_FAILED` with `details.fields` |
| Scheduler | `cron-parser` + timers, with `scheduled_job_runs` boot catch-up (Asia/Kolkata) |
| Logging | Fastify's pino (JSON) |
| Tests | `vitest` against a real throwaway PostgreSQL (`embedded-postgres`) |

## Layout

```
src/
  server.ts          entrypoint: pool, scheduler catch-up, listen, graceful shutdown
  app.ts             Fastify wiring: CORS, cookies, CSRF, auth, module mounting
  config.ts          env -> typed Config
  common/            errors, permissions, audit, codegen, pagination, validate, scheduler, time
  db/                pool + query helpers, migrator
  plugins/           auth (JWT + permissions), csrf, error handler
  modules/<feature>/ routes.ts (HTTP + zod), service.ts (SQL + business rules), index.ts (factory)
  scripts/           migrate.ts, seed.ts
migrations/          goose SQL migrations (copied from ../backend)
test/                integration tests
```

## Run

```bash
cp .env.example .env            # edit secrets
npm install
npm run dev                     # tsx watch, http://localhost:8080
npm run migrate                 # after `npm run build`; or: npx tsx src/scripts/migrate.ts up
SEED_EMAIL=owner@example.com SEED_PASSWORD='ChangeMe123!' npm run seed
npm test                        # spins up an embedded PostgreSQL; no Docker needed
```

Docker: `backend-fastify/Dockerfile` runs migrations then the server (same contract as the Go image). To use it in
the root `docker-compose.yml`, change `build: ./backend` to `build: ./backend-fastify` for the `backend` and
`seed` services (`seed` entrypoint: `["node", "dist/scripts/seed.js"]`).
