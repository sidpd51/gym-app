# 09 — Deployment & Operations

## Overview

This is a **local LAN application**. It runs on a single machine inside the gym and is accessed by staff from browsers on the same network. The deployment must be:

- Simple to set up and maintain by a non-specialist.
- Recoverable from failures quickly.
- Reliable during gym operating hours.
- Not dependent on internet connectivity for core operations.

---

## Runtime Stack

| Component | Technology |
|---|---|
| Runtime | Node.js 22 LTS |
| Language | TypeScript 5 (compiled to JavaScript via `tsc`) |
| Framework | Fastify 5.x |
| Package manager | pnpm |
| Database | PostgreSQL 15+ |
| Migration tool | `node-pg-migrate` (SQL-first versioned files) |
| Auth | `@fastify/jwt` + `@fastify/cookie` (signed JWT in httpOnly cookie) |
| Process manager | systemd running `node dist/server.js` |

**Node.js 22 LTS** is the recommended runtime. ESM-first (`"type": "module"` in `package.json`, `"module": "NodeNext"` in `tsconfig.json`). No bundler — `tsc` emits plain `.js` files to `dist/` which Node runs directly.

---

## Configuration

Configuration lives in environment variables, loaded via `env-schema`. The schema validates required-ness and types at startup — missing or malformed values cause the app to fail-fast before accepting any requests.

### `src/config/env.ts`

```ts
import { envSchema } from 'env-schema';
import { Type, Static } from '@sinclair/typebox';

const EnvSchema = Type.Object({
  NODE_ENV:             Type.Union([Type.Literal('development'), Type.Literal('production'), Type.Literal('test')]),
  PORT:                 Type.Integer({ default: 8080 }),
  LOG_LEVEL:            Type.Union([Type.Literal('fatal'), Type.Literal('error'), Type.Literal('warn'), Type.Literal('info'), Type.Literal('debug'), Type.Literal('trace')], { default: 'info' }),

  DATABASE_URL:         Type.String(),                       // postgres://user:pass@host:5432/db
  DATABASE_POOL_MAX:    Type.Integer({ default: 20 }),

  JWT_SECRET:           Type.String({ minLength: 64 }),
  COOKIE_SECRET:        Type.String({ minLength: 64 }),
  SESSION_TTL_HOURS:    Type.Integer({ default: 8 }),

  FRONTEND_ORIGIN:      Type.String({ default: 'http://localhost:5173' }),
  BACKUP_DIR:           Type.String({ default: '/opt/gym-backups' }),
});

export type Env = Static<typeof EnvSchema>;

export const env: Env = envSchema({ schema: EnvSchema, dotenv: true });
```

Called once in `server.ts` and attached to the Fastify instance via `app.decorate('config', env)` so plugins and routes can read typed config via `app.config.XXX`.

### Required environment variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | Postgres connection URL (`postgres://user:pass@host:5432/db`) | Yes |
| `JWT_SECRET` | JWT signing secret (≥64 random chars) | Yes |
| `COOKIE_SECRET` | Cookie signing secret (≥64 random chars) | Yes |
| `NODE_ENV` | `development` / `production` / `test` | Yes |
| `PORT` | Server listen port | No (default: `8080`) |
| `LOG_LEVEL` | Pino log level | No (default: `info`) |
| `FRONTEND_ORIGIN` | CORS allowed origin | No (default: localhost) |
| `SESSION_TTL_HOURS` | JWT expiry in hours | No (default: `8`) |
| `BACKUP_DIR` | Directory where `pg_dump` output is written | No (default: `/opt/gym-backups`) |
| `DATABASE_POOL_MAX` | `postgres` driver connection pool size | No (default: `20`) |

**Rules:**
- No secrets in committed files. Commit a `.env.example` with placeholder values for developer reference.
- In production, set environment variables via a systemd `EnvironmentFile`.
- Generate secrets with `openssl rand -hex 32` (gives 64 hex chars = 256 bits).

---

## Directory Structure

```
backend/
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── config/env.ts
│   ├── db/
│   │   ├── client.ts
│   │   └── migrations/
│   │       ├── 001_init.sql
│   │       ├── 002_seed_settings.sql
│   │       └── 003_code_sequences.sql
│   ├── plugins/
│   ├── common/
│   └── modules/
│       ├── auth/
│       ├── user/
│       ├── member/
│       ├── membershipPlan/
│       ├── membership/
│       ├── payment/
│       ├── attendance/
│       ├── trainer/
│       ├── assignment/
│       ├── lead/
│       ├── expense/
│       ├── inventory/
│       ├── equipment/
│       ├── notification/
│       ├── report/
│       ├── settings/
│       ├── auditLog/
│       ├── search/
│       └── backup/
├── test/
├── dist/                        ← tsc output; what gets deployed
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── .env.example
└── .gitignore
```

---

## Frontend Hosting

The React SPA is a set of static files produced by `pnpm --filter frontend build` (output: `frontend/dist/`). Served by Fastify using `@fastify/static` on the same port as the API:

```ts
// plugins/static.ts
import fastifyStatic from '@fastify/static';
import path from 'node:path';

await app.register(fastifyStatic, {
  root: path.resolve(process.cwd(), '../frontend/dist'),
  prefix: '/',
});

// SPA fallback: any non-API route returns index.html so client-side routing works
app.setNotFoundHandler((req, reply) => {
  if (req.url.startsWith('/api/')) {
    return reply.code(404).send({ status: 404, code: 'NOT_FOUND', message: 'Route not found' });
  }
  return reply.sendFile('index.html');
});
```

Single port, single process. Simplest LAN setup. If a separate static server is ever needed (e.g., to terminate HTTPS at an Nginx proxy), the Fastify app can simply skip `@fastify/static`.

---

## LAN / Network Architecture

```
Gym LAN (192.168.1.x)
│
├── Server Machine (e.g., 192.168.1.100)
│   ├── Node.js process (Fastify on port 8080)
│   ├── PostgreSQL (port 5432, LAN-internal only)
│   └── Frontend (static files served by Fastify on port 8080)
│
├── Reception Tablet / PC  (browser → http://192.168.1.100:8080)
├── Trainer Phone          (browser → http://192.168.1.100:8080)
└── Owner Laptop           (browser → http://192.168.1.100:8080)
```

**PostgreSQL must NOT be exposed to the internet.** Bind it to `localhost` only (`listen_addresses = 'localhost'` in `postgresql.conf`). The Node process connects to Postgres over the loopback interface.

**OPEN DECISION:** Whether to configure HTTPS with a self-signed certificate or local CA. Recommended even on LAN to prevent credential interception.

---

## Process Management

Use **systemd** to manage the Node process on Linux. Same unit shape as a JVM service; only `ExecStart` differs:

```ini
# /etc/systemd/system/gym-backend.service

[Unit]
Description=Gym Management System Backend
After=network.target postgresql.service

[Service]
Type=simple
User=gymapp
WorkingDirectory=/opt/gym-app
EnvironmentFile=/opt/gym-app/.env
ExecStart=/usr/bin/node /opt/gym-app/dist/server.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

# Harden the process
NoNewPrivileges=yes
ProtectSystem=strict
ReadWritePaths=/opt/gym-app /opt/gym-backups /var/log/gym-app
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable gym-backend
sudo systemctl start gym-backend
sudo systemctl status gym-backend

# Stream live logs
sudo journalctl -u gym-backend -f
```

Pino writes JSON lines to stdout; journald captures them. For human-friendly local tailing, pipe through `pino-pretty`:

```bash
sudo journalctl -u gym-backend -f -o cat | pino-pretty
```

### Windows Service (NSSM)

The gym PC is typically a Windows machine. **Autostart on boot is required**, not optional — the owner powers the PC off at night, and the backend must come back up without manual intervention. Otherwise the first check-in next morning fails with "connection refused," and the catch-up mechanism in `08-cross-cutting-concerns.md` (Intermittent Availability) is bypassed because the process never starts.

Wrap the Node process with **NSSM** (Non-Sucking Service Manager) and set startup type to Automatic:

```powershell
# Run as Administrator
nssm install GymBackend "C:\Program Files\nodejs\node.exe" "C:\gym-app\dist\server.js"
nssm set GymBackend AppDirectory "C:\gym-app"

# Load env from a file instead of embedding secrets in the service config
nssm set GymBackend AppEnvironmentExtra ":NODE_ENV=production"
# Node 20+: --env-file picks up DATABASE_URL, JWT_SECRET, COOKIE_SECRET, etc.
nssm set GymBackend AppParameters "--env-file=C:\gym-app\.env dist\server.js"

# Logs (NSSM rotates them)
nssm set GymBackend AppStdout "C:\gym-app\logs\stdout.log"
nssm set GymBackend AppStderr "C:\gym-app\logs\stderr.log"
nssm set GymBackend AppRotateFiles 1
nssm set GymBackend AppRotateOnline 1
nssm set GymBackend AppRotateBytes 10485760

# Autostart + depend on PostgreSQL
nssm set GymBackend Start SERVICE_AUTO_START
nssm set GymBackend DependOnService postgresql-x64-15

# Restart on crash (same intent as systemd Restart=on-failure)
nssm set GymBackend AppExit Default Restart
nssm set GymBackend AppRestartDelay 5000

nssm start GymBackend
```

Verify after a reboot:

```powershell
Get-Service GymBackend
# Status should be "Running"; StartType should be "Automatic"
```

### PostgreSQL autostart

PostgreSQL must also autostart. The standard Windows installer sets this by default — verify:

```powershell
Get-Service postgresql-x64-15
# StartType = Automatic
```

If the owner (or a previous admin) set it to Manual, start-order dependencies won't help: NSSM's `DependOnService` only waits for a service that's actually configured to start. Fix with:

```powershell
Set-Service postgresql-x64-15 -StartupType Automatic
```

### Daily shutdown contract

Both the Linux and Windows setups above are configured so that this sequence is transparent to users:

1. Owner powers off the PC at 22:00. All systemd / Windows services stop cleanly.
2. Postgres flushes WAL and shuts down; no data loss.
3. Overnight, the midnight expiry job, 02:00 backup job, and 09:00 reminder job all miss their fire times.
4. Owner powers on at 06:00. Postgres starts first, then the gym-backend service starts.
5. The scheduler plugin runs `runOverdueJobs()` before `.listen()` fires — expiring memberships, generating backup, sending any still-relevant reminders.
6. By the time the first check-in happens at 06:30, state is correct.

If any of autostart, service dependency ordering, or the `scheduled_job_runs` table is missing, step 5 silently doesn't happen and the system drifts a day behind reality.

---

## Health Check

A simple `/health` route — no auth, no business logic — that checks the DB connection with a trivial query:

```ts
// src/app.ts
app.get('/health', { logLevel: 'warn' }, async () => {
  await app.sql`SELECT 1`;
  return { status: 'ok', uptime: process.uptime() };
});
```

```
GET /health
→ 200 OK
{ "status": "ok", "uptime": 123.4 }

GET /health   (DB down)
→ 500 (error handler returns INTERNAL_SERVER_ERROR; monitoring treats non-200 as unhealthy)
```

Used by monitoring scripts, a reverse proxy health probe, or a simple `curl` in cron. `logLevel: 'warn'` prevents the health check from flooding INFO logs.

---

## Database Migration Strategy

`node-pg-migrate` applies SQL migrations from `src/db/migrations/`:

```
src/db/migrations/
├── 001_init.sql                 ← creates all tables, enums, indexes, constraints
├── 002_seed_settings.sql        ← inserts the gym_settings row (id = 1)
├── 003_code_sequences.sql       ← creates all _code_seq sequences
└── 004_...                      ← future schema changes, always additive
```

**Rules:**
- Migrations are **forward-only** in production. No destructive down-migrations.
- Every schema change requires a new versioned file; never edit a previously applied migration.
- Migrations are applied via an explicit CLI command (`pnpm migrate up`) separate from app startup. The Fastify process does **not** auto-run migrations on boot — this avoids race conditions when restarting during a schema change and keeps schema evolution a deliberate, operator-triggered step.

**Package.json scripts:**

```json
{
  "scripts": {
    "migrate:up":     "node-pg-migrate up --migrations-dir src/db/migrations --migration-filename-format utc",
    "migrate:down":   "node-pg-migrate down --migrations-dir src/db/migrations",
    "migrate:create": "node-pg-migrate create --migrations-dir src/db/migrations"
  }
}
```

**Deployment sequence:**

```
1. Deploy new dist/ to server
2. Run pnpm migrate up (apply any pending migrations)
3. systemctl restart gym-backend
4. Fastify starts; verifies DB connection; begins accepting requests
```

If a schema change is incompatible with the running app, follow the standard safe-migration pattern: deploy an app version that supports both old and new schemas, run the migration, deploy the version that uses only the new schema.

---

## Deployment Strategy

### Build

```bash
cd backend
pnpm install --frozen-lockfile
pnpm build          # runs: tsc -p tsconfig.build.json
# Output: dist/server.js, dist/app.js, dist/modules/..., etc.
```

Only `dist/`, `package.json`, `pnpm-lock.yaml`, and `src/db/migrations/` need to be deployed. Node's native ESM resolver loads the compiled `.js` files directly — no bundler, no `node_modules` bundling.

### Initial Setup

```bash
# 1. Install Node.js 22 and PostgreSQL on the server machine
# Ubuntu/Debian:
sudo apt update
sudo apt install -y curl ca-certificates postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs
sudo npm install -g pnpm

# 2. Create database and user
sudo -u postgres psql <<'SQL'
CREATE USER gymuser WITH PASSWORD 'your_secure_password';
CREATE DATABASE gymdb OWNER gymuser;
GRANT ALL PRIVILEGES ON DATABASE gymdb TO gymuser;
SQL

# 3. Create application directory and dedicated service user
sudo useradd -r -s /bin/false gymapp
sudo mkdir -p /opt/gym-app /opt/gym-backups /var/log/gym-app
sudo chown gymapp:gymapp /opt/gym-app /opt/gym-backups /var/log/gym-app

# 4. Deploy the compiled dist/ and dependencies
sudo cp -r backend/dist backend/package.json backend/pnpm-lock.yaml backend/src/db /opt/gym-app/
sudo -u gymapp pnpm --dir /opt/gym-app install --prod --frozen-lockfile
sudo chown -R gymapp:gymapp /opt/gym-app

# 5. Create the environment file (not committed to version control)
sudo tee /opt/gym-app/.env <<EOF
NODE_ENV=production
PORT=8080
DATABASE_URL=postgres://gymuser:your_secure_password@localhost:5432/gymdb
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)
FRONTEND_ORIGIN=http://192.168.1.100:8080
BACKUP_DIR=/opt/gym-backups
EOF
sudo chmod 600 /opt/gym-app/.env
sudo chown gymapp:gymapp /opt/gym-app/.env

# 6. Apply migrations
sudo -u gymapp bash -c 'cd /opt/gym-app && pnpm migrate:up'

# 7. Install and enable the systemd service
sudo cp gym-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable gym-backend
sudo systemctl start gym-backend

# Verify:
sudo journalctl -u gym-backend -f --lines=50
curl -s http://localhost:8080/health
```

### Routine Updates

```bash
# On the development machine:
cd backend
pnpm install --frozen-lockfile
pnpm build
tar czf gym-backend-new.tar.gz dist/ package.json pnpm-lock.yaml src/db/
scp gym-backend-new.tar.gz gymserver:/tmp/

# On the server:
sudo systemctl stop gym-backend                              # or leave running if backward-compatible
sudo tar xzf /tmp/gym-backend-new.tar.gz -C /opt/gym-app/
sudo -u gymapp pnpm --dir /opt/gym-app install --prod --frozen-lockfile
sudo -u gymapp bash -c 'cd /opt/gym-app && pnpm migrate:up' # apply any new migrations
sudo systemctl start gym-backend

# Confirm startup:
sudo journalctl -u gym-backend -f --lines=50
```

For zero-downtime restarts, use `systemctl reload-or-restart gym-backend` after confirming the new build is backward-compatible with the current schema.

---

## Rollback Strategy

**Code rollback:**
```bash
# Keep the previous dist/ as /opt/gym-app/dist-previous/ before each deploy.
sudo rm -rf /opt/gym-app/dist
sudo mv /opt/gym-app/dist-previous /opt/gym-app/dist
sudo systemctl restart gym-backend

# Note: if the update included schema migrations, a database restore is also required
# because node-pg-migrate migrations are forward-only in production.
```

**Database rollback:**
- Restore from the most recent backup (see Backups section below).
- This is the primary rollback mechanism for schema-level failures.

---

## Backup

### Backup Strategy

**Recommendation: PostgreSQL `pg_dump` invoked from a Fastify route handler + a daily cron job**

```bash
# Manual one-off backup
pg_dump -U gymuser -d gymdb -f /opt/gym-backups/gymdb_$(date +%Y%m%d_%H%M%S).sql

# Scheduled daily backup (crontab for gymapp user, 2 AM daily)
0 2 * * * pg_dump -U gymuser -d gymdb -f /opt/gym-backups/gymdb_$(date +\%Y\%m\%d).sql
```

The backend route invokes `pg_dump` as a subprocess via Node's `child_process.spawn`:

```ts
// modules/backup/service.ts (illustrative)
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';

export async function createBackup(filename: string): Promise<void> {
  const outPath = path.join(env.BACKUP_DIR, filename);
  await new Promise<void>((resolve, reject) => {
    const proc = spawn('pg_dump', ['-U', 'gymuser', '-d', 'gymdb'], {
      env: { ...process.env, PGPASSWORD: env.DB_PASSWORD },
    });
    proc.stdout.pipe(createWriteStream(outPath));
    proc.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`pg_dump exited ${code}`)));
    proc.on('error', reject);
  });
}
```

**Retention policy:**
- Keep the last 30 daily backups.
- Store backups in `/opt/gym-backups/` — separate from the application directory.
- **OPEN DECISION:** Whether to replicate backups to an external drive or cloud storage (strongly recommended for disaster recovery).

### Backup API Endpoints

`POST /api/v1/backup/create` — OWNER only. Spawns `pg_dump`, writes to `BACKUP_DIR`.

`GET /api/v1/backup/list` — OWNER only. Lists backup files with timestamps and sizes.

### Restore

`POST /api/v1/backup/restore` — OWNER only. Accepts an uploaded `.sql` backup file and restores the database using `psql`:

```ts
spawn('psql', ['-U', 'gymuser', '-d', 'gymdb', '-f', uploadedFilePath]);
```

**Restore operation must:**
1. Require explicit confirmation from the Owner.
2. Back up the current database before restoring.
3. Restart the Fastify process after restore (`systemctl restart gym-backend`) to reset any in-memory state (connection pool, cached settings).
4. Write an audit log entry after successful restore.

**CRITICAL:** A restore operation overwrites all current data. This must be clearly communicated in the UI before the Owner confirms.

**OPEN DECISION:** Backup/restore is listed as planned scope in the requirements but **the frontend UI is not yet implemented**. The backend API should be built; the frontend integration is a separate task.

---

## Disk and Storage Requirements

| Data | Estimated size after 3 years |
|---|---|
| Database (500 active members, full history) | ~100–300 MB |
| Daily backup files (30-day retention) | ~300 MB |
| Application logs | ~50 MB/month (with rotation) |
| Node.js runtime + dist/ + node_modules | ~150–200 MB |
| **Total** | ~2–4 GB |

A standard machine with 20 GB available is more than sufficient.

---

## Logging

Fastify ships with Pino. Logs are JSON lines on stdout; systemd/journald captures them.

### Pino configuration

Config lives in `src/app.ts` and `src/plugins/logger.ts`. In development, `pino-pretty` provides a human-readable transport; in production, raw JSON goes to stdout (and optionally to a rolling file via `pino-roll`):

```ts
// src/app.ts
import Fastify from 'fastify';
import { env } from './config/env.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: {
        paths: ['password', 'passwordHash', 'token', 'secret', 'req.headers.cookie', 'req.headers.authorization'],
        censor: '[REDACTED]',
      },
      transport: env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss.l' } }
        : undefined,
    },
  });
  // ... register plugins and routes
  return app;
}
```

For disk-backed rotation (if not relying on `journalctl --vacuum`), register `pino-roll` as the transport in production:

```ts
transport: {
  target: 'pino-roll',
  options: {
    file: '/var/log/gym-app/gym-backend.log',
    frequency: 'daily',
    size: '50m',
    mkdir: true,
    limit: { count: 30 },
  },
}
```

Pino is extremely fast (JSON-serialization-only) so it adds negligible latency even at high request rates — not that we'll see them.

---

## Monitoring

At this scale, monitoring is simple:

| Check | Method |
|---|---|
| Backend running | `systemctl status gym-backend` or `GET /health` |
| Database accessible | `GET /health` runs `SELECT 1` as part of its check |
| Disk space | `df -h` via cron alert |
| Backup file present | Shell script: alert if newest backup in `/opt/gym-backups/` is >24h old |

**No need** for Prometheus, Grafana, or an ELK stack at this scale. A simple shell script that checks the above conditions and sends an alert (email or WhatsApp message) is sufficient.

---

## Development Environment

### Requirements

| Tool | Version |
|---|---|
| Node.js | 22+ |
| pnpm | 9+ |
| PostgreSQL | 15+ (or Docker) |

### Setup

```bash
# Backend
cd backend

# Install dependencies
pnpm install

# Copy and edit local environment
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, COOKIE_SECRET

# Apply migrations
pnpm migrate:up

# Run in dev mode (tsx watches TypeScript files, reloads on change)
pnpm dev
# equivalent to: tsx watch src/server.ts

# Run tests
pnpm test                   # vitest
pnpm test:watch             # watch mode
pnpm test:coverage          # with coverage report

# Build production artifact
pnpm build                  # tsc -p tsconfig.build.json → dist/

# Run production artifact locally
node --env-file=.env dist/server.js

# Frontend (existing — no changes)
cd ../frontend
pnpm dev
```

### Local database setup

```bash
# Using a local PostgreSQL installation
createdb gymdb
psql gymdb -c "CREATE USER gymuser WITH PASSWORD 'dev'; GRANT ALL ON DATABASE gymdb TO gymuser;"

# Or using Docker (no local PostgreSQL install needed)
docker run -d --name gym-postgres \
  -e POSTGRES_USER=gymuser \
  -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_DB=gymdb \
  -p 5432:5432 postgres:15
```

A `docker-compose.yml` committed to the repo is recommended for one-command local setup (`docker compose up -d` brings up Postgres on `localhost:5432`).

Migrations do **not** run automatically on `pnpm dev` — run `pnpm migrate:up` after pulling schema changes.
