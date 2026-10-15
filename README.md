# Gym App — full stack in Docker Compose

Frontend (React/Vite SPA) + backend (Fastify/Node) + MySQL, one command:

```sh
docker compose -f docker-compose.fastify.yml up --build
```

| Service  | URL                   |
| -------- | --------------------- |
| App UI   | http://localhost:3000 |
| Backend  | http://localhost:8080 |
| MySQL    | localhost:3306        |

The browser talks only to `:3000` — nginx proxies same-origin `/api/*`
to the backend, so there is no CORS split in the containerized setup.

## How it boots

- `db` — mysql:8.4, health-gated via `mysqladmin ping`.
- `backend` — Fastify/Node image that runs migrations on startup, then the
  server. Needs `JWT_SECRET`/`COOKIE_SECRET`, which come from
  `backend-fastify/.env` (gitignored — copy from `backend-fastify/.env.example`).
- `frontend` — production `vite build` served by nginx with an `/api`
  reverse proxy and SPA fallback.
- `seed` (profile `seed` only) — creates the initial OWNER user on a
  fresh database:
  ```sh
  SEED_EMAIL=owner@example.com SEED_PASSWORD=ChangeMe123! \
    docker compose -f docker-compose.fastify.yml --profile seed up seed
  ```

## Local development (without compose)

- Start only the DB container: `docker compose -f docker-compose.fastify.yml up -d db`
- Backend: `cd backend-fastify && cp .env.example .env && npm install && npm run dev`
- Frontend: `cd frontend && npm run dev` (`:5173`, talks to `VITE_API_BASE_URL`, default `http://localhost:8080`)
