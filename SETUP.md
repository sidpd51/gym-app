# Setup

**Prerequisites:** Docker Desktop

## 1. Environment

```sh
cp backend-fastify/.env.example backend-fastify/.env
```

Open `backend-fastify/.env` and set:

```
JWT_SECRET=<random 64-char string>
COOKIE_SECRET=<random 64-char string>
```

Generate values:
```sh
openssl rand -hex 32   # run twice — one for each
```

## 2. Start

```sh
docker compose -f docker-compose.fastify.yml up --build -d
```

| Service | URL |
|---------|-----|
| App UI | http://localhost:3000 |
| API | http://localhost:8080 |
| MySQL | localhost:3306 |

## 3. Seed owner account (first time only)

```sh
SEED_EMAIL=owner@example.com SEED_PASSWORD=ChangeMe123! \
  docker compose -f docker-compose.fastify.yml --profile seed up seed
```

Login at http://localhost:3000 with the email/password you set above.

## Stop

```sh
docker compose -f docker-compose.fastify.yml down
```

To also delete database:
```sh
docker compose -f docker-compose.fastify.yml down -v
```
