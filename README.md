# Gym App — full stack in Docker Compose

Frontend (React/Vite SPA) + backend (Go/chi) + Postgres, one command:

```sh
docker compose up --build
```

| Service  | URL                   |
| -------- | --------------------- |
| App UI   | http://localhost:3000 |
| Backend  | http://localhost:8080 |
| Postgres | localhost:5432        |

The browser talks only to `:3000` — nginx proxies same-origin `/api/*`
to the backend, so there is no CORS split in the containerized setup.

## How it boots

- `db` — postgres:15-alpine, health-gated via `pg_isready`.
- `backend` — Go image that runs **goose migrations first**, then the
  server (`backend/entrypoint.sh`). Needs `DATABASE_URL`/`JWT_SECRET`/
  `COOKIE_SECRET`, which come from `backend/.env` (gitignored — copy
  from `backend/.env.example`). Backups land in the `gym-backups`
  volume (`BACKUP_DIR=/opt/gym-backups`); `pg_dump` ships inside the
  image, no host tooling needed.
- `frontend` — production `vite build` served by nginx with an `/api`
  reverse proxy and SPA fallback.
- `seed` (profile `seed` only) — creates the initial OWNER user on a
  fresh database:
  ```sh
  SEED_EMAIL=owner@example.com SEED_PASSWORD=ChangeMe123! \
    docker compose --profile seed up seed
  ```

## Data safety

The db volume is **external** (`backend_gym-postgres-data`) and reused
from the earlier backend-local compose setup — moving compose to the
repo root does not orphan existing data. `docker compose down` never
deletes it (only an explicit `docker volume rm` does).

## Local development (without compose)

- Backend only needs the db: `cd backend && make db-up` (uses the root
  compose file), then `make dev` + `make migrate-up`.
- Frontend dev server: `cd frontend && npm run dev` (`:5173`, talks to
  `VITE_API_BASE_URL`, default `http://localhost:8080`).
