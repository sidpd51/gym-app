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
| Language | Go 1.23+ |
| HTTP router | `chi` (`go-chi/chi/v5`) |
| DB driver | `pgx` v5 (`jackc/pgx/v5`) + `sqlc` generated queries |
| Database | PostgreSQL 15+ |
| Migration tool | `goose` (`pressly/goose`) — CLI-triggered, not auto on boot |
| Auth | `golang-jwt/jwt/v5` in httpOnly `SameSite=Strict` cookie + `gorilla/csrf` |
| Logging | `log/slog` (stdlib) — JSON in prod, text in dev |
| Config | `caarlos0/env/v11` → typed `Config` struct from env vars |
| Build output | Single static binary (~20 MB) via `go build` |

**Go 1.23+** is required (for `log/slog` features and `pgx` v5 compatibility). No separate runtime is installed on the target machine; the binary includes the Go runtime.

---

## Configuration

Config is loaded on startup from environment variables into a typed `*config.Config` struct using `caarlos0/env`. There is no `application.yml` — the binary reads `os.Environ()` directly. In production, the systemd unit's `EnvironmentFile=` (Linux) or NSSM's `AppEnvironmentExtra` (Windows) points at a mode-600 `.env` file.

### `internal/config/config.go` (template)

```go
package config

import (
    "time"
    "github.com/caarlos0/env/v11"
)

type Config struct {
    Env            string        `env:"ENV"              envDefault:"prod"`
    Port           int           `env:"PORT"             envDefault:"8080"`
    DatabaseURL    string        `env:"DATABASE_URL,required"`                       // postgres://user:pass@host:5432/gymdb
    JWTSecret      string        `env:"JWT_SECRET,required"`                         // ≥64 random chars
    CookieSecret   string        `env:"COOKIE_SECRET,required"`                      // ≥64 random chars; used by gorilla/csrf
    FrontendOrigin string        `env:"FRONTEND_ORIGIN"  envDefault:"http://localhost:5173"`
    SessionTTL     time.Duration `env:"SESSION_TTL"      envDefault:"8h"`
    BackupDir      string        `env:"BACKUP_DIR"       envDefault:"/opt/gym-backups"`
    LogLevel       string        `env:"LOG_LEVEL"        envDefault:"info"`
    HTTPSCert      string        `env:"HTTPS_CERT"`                                  // path to cert file; empty = plain HTTP
    HTTPSKey       string        `env:"HTTPS_KEY"`                                   // path to key file
}

func Load() (*Config, error) {
    var c Config
    return &c, env.Parse(&c)
}
```

### Required environment variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | Postgres connection URL (contains password) | Yes |
| `JWT_SECRET` | JWT signing key (≥64 random chars) | Yes |
| `COOKIE_SECRET` | CSRF cookie key (≥64 random chars) | Yes |
| `FRONTEND_ORIGIN` | CORS allowed origin | No (default: localhost:5173) |
| `PORT` | Listen port | No (default: 8080) |
| `SESSION_TTL` | JWT lifetime | No (default: 8h) |
| `BACKUP_DIR` | Where `pg_dump` writes | No (default: /opt/gym-backups) |
| `LOG_LEVEL` | debug / info / warn / error | No (default: info) |
| `HTTPS_CERT` / `HTTPS_KEY` | TLS cert + key paths | No (plain HTTP if omitted) |

**Rules:**
- No secrets in committed source or config files.
- In production, set via systemd `EnvironmentFile=` or NSSM env extras — never via a shell script committed to the repo.
- Commit an `.env.example` with placeholder values for developer reference.

### `.env.example`

```
# Copy to .env and fill in. Do not commit .env.
ENV=dev
PORT=8080
DATABASE_URL=postgres://gymuser:dev@localhost:5432/gymdb?sslmode=disable
JWT_SECRET=change-me-to-a-64-char-random-string-xxxxxxxxxxxxxxxxxxxxxxxxxx
COOKIE_SECRET=change-me-to-a-64-char-random-string-yyyyyyyyyyyyyyyyyyyyyy
FRONTEND_ORIGIN=http://localhost:5173
SESSION_TTL=8h
LOG_LEVEL=debug
BACKUP_DIR=./.backups
```

---

## Directory Structure

```
backend/
├── cmd/
│   └── server/
│       └── main.go                 ← entry: load config, build app, http.ListenAndServe
├── internal/
│   ├── app/                        ← builds chi router + wires everything
│   ├── config/                     ← Config struct + Load()
│   ├── db/
│   │   ├── db.go                   ← pgxpool.New(ctx, DATABASE_URL)
│   │   ├── migrations/             ← goose SQL files (001_init.sql, 002_...)
│   │   ├── queries/                ← sqlc input SQL files
│   │   └── sqlc/                   ← sqlc generated code (never hand-edited)
│   ├── middleware/                 ← auth, logger, csrf, cors, errorhandler
│   ├── common/                     ← errors, pagination, codegen, audit, permissions, scheduler
│   └── modules/
│       ├── auth/
│       ├── user/
│       ├── member/
│       ├── (…one package per feature…)
│       └── backup/
├── go.mod
├── go.sum
├── sqlc.yaml                       ← sqlc generator config
├── .env.example
├── .gitignore
└── Makefile                        ← optional: build / run / test / migrate / sqlc convenience targets
```

---

## Frontend Hosting

The React SPA is a set of static files produced by `npm run build`. Two hosting options:

**Option A — Go backend serves static files (Recommended)**
- Build the frontend into `frontend/dist/`.
- Embed with `//go:embed frontend/dist/*` into the Go binary, OR serve from disk with `http.FileServer(http.Dir("./public"))`.
- Register a chi handler that falls through to `index.html` for unknown paths (SPA client-side routing).
- Single port, single binary, single process. Simplest LAN setup.

**Option B — Separate static server**
- Nginx or Caddy serves the frontend; the Go backend serves only `/api/v1/*`.
- More flexible; allows HTTPS termination at the proxy level.
- CORS must allow the proxy's origin explicitly.

**OPEN DECISION:** Embed via `//go:embed` (single file to ship, zero chance of drift between frontend and backend versions) vs serve from disk (patch frontend without rebuilding the Go binary). Recommendation: embed for production releases, disk for development.

For a LAN gym system, **Option A is recommended** for operational simplicity.

---

## LAN / Network Architecture

```
Gym LAN (192.168.1.x)
│
├── Server Machine (e.g., 192.168.1.100)
│   ├── gym-backend binary (port 8080)
│   ├── PostgreSQL (port 5432, LAN-internal only)
│   └── Frontend (embedded in or served by gym-backend on port 8080)
│
├── Reception Tablet / PC  (browser → http://192.168.1.100:8080)
├── Trainer Phone          (browser → http://192.168.1.100:8080)
└── Owner Laptop           (browser → http://192.168.1.100:8080)
```

**PostgreSQL must NOT be exposed to the internet.** Bind it to `localhost` only (`listen_addresses = 'localhost'` in `postgresql.conf`).

**OPEN DECISION:** Whether to configure HTTPS with a self-signed certificate or local CA. Recommended even on LAN to prevent credential interception. In Go, HTTPS is `http.ListenAndServeTLS(addr, certFile, keyFile, handler)` — one line.

---

## Process Management

### Linux (systemd)

Use systemd to manage the Go binary on Linux:

```ini
# /etc/systemd/system/gym-backend.service

[Unit]
Description=Gym Management System Backend
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=gymapp
WorkingDirectory=/opt/gym-app
EnvironmentFile=/opt/gym-app/.env
ExecStart=/opt/gym-app/gym-backend
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
sudo systemctl enable gym-backend
sudo systemctl start gym-backend
sudo systemctl status gym-backend

# Stream live logs
sudo journalctl -u gym-backend -f
```

`log/slog` writes JSON lines to stdout; journald captures them. For human-friendly tailing, pipe through a small formatter such as `jq`:

```bash
sudo journalctl -u gym-backend -f -o cat | jq -r '"\(.time) \(.level) \(.msg)"'
```

### Windows (NSSM)

The gym PC is typically a Windows machine. **Autostart on boot is required**, not optional — the owner powers the PC off at night, and the backend must come back up without manual intervention. Otherwise the first check-in next morning fails with "connection refused," and the catch-up mechanism in `08-cross-cutting-concerns.md` (Intermittent Availability) is bypassed because the process never starts.

Wrap the Go binary with **NSSM** (Non-Sucking Service Manager) and set startup type to Automatic:

```powershell
# Run as Administrator
nssm install GymBackend "C:\gym-app\gym-backend.exe"
nssm set GymBackend AppDirectory "C:\gym-app"

# Load env from a file so secrets aren't in the service config
# (gym-backend.exe reads process env on startup via caarlos0/env)
nssm set GymBackend AppEnvironmentExtra ":ENV=prod"
# NSSM supports an env file via AppEnvironmentExtraFile in recent versions;
# alternatively script the env vars into AppEnvironmentExtra individually.

# Logs (NSSM rotates them)
nssm set GymBackend AppStdout "C:\gym-app\logs\stdout.log"
nssm set GymBackend AppStderr "C:\gym-app\logs\stderr.log"
nssm set GymBackend AppRotateFiles 1
nssm set GymBackend AppRotateOnline 1
nssm set GymBackend AppRotateBytes 10485760

# Autostart + depend on PostgreSQL
nssm set GymBackend Start SERVICE_AUTO_START
nssm set GymBackend DependOnService postgresql-x64-15

# Restart on crash (equivalent to systemd Restart=on-failure)
nssm set GymBackend AppExit Default Restart
nssm set GymBackend AppRestartDelay 5000

nssm start GymBackend
```

Verify after a reboot:

```powershell
Get-Service GymBackend
# Status should be Running; StartType should be Automatic
```

### PostgreSQL autostart

PostgreSQL must also autostart. The Windows installer sets this by default — verify:

```powershell
Get-Service postgresql-x64-15
# StartType = Automatic
```

If the owner (or a previous admin) set it to Manual, `DependOnService` won't help: NSSM only waits for a service that's actually configured to start. Fix with:

```powershell
Set-Service postgresql-x64-15 -StartupType Automatic
```

### Daily shutdown contract

Both the Linux and Windows setups above are configured so this sequence is transparent to users:

1. Owner powers off the PC at 22:00. All services stop cleanly.
2. Postgres flushes WAL and shuts down; no data loss.
3. Overnight, the midnight expiry job, 02:00 backup job, and 09:00 reminder job all miss their fire times.
4. Owner powers on at 06:00. Postgres starts first, then `gym-backend` starts.
5. The scheduler plugin runs `RunOverdueJobs()` before `http.ListenAndServe` fires — expiring overdue memberships, generating today's backup, sending still-relevant reminders.
6. By the first check-in at 06:30, state is correct.

If any of autostart, service dependency ordering, or the `scheduled_job_runs` table is missing, step 5 silently doesn't happen and the system drifts a day behind reality.

---

## Health Check

A plain chi route — no auth, no business logic — that checks the DB connection with a trivial query:

```go
// internal/app/app.go
r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
    if err := pool.Ping(r.Context()); err != nil {
        render.Error(w, common.NewInternalError("DB_UNREACHABLE"))
        return
    }
    render.JSON(w, 200, map[string]any{
        "status": "ok",
        "uptime": time.Since(startTime).Seconds(),
    })
})
```

```
GET /health
→ 200 OK
{ "status": "ok", "uptime": 123.4 }

GET /health   (DB down)
→ 500 (error middleware returns INTERNAL_SERVER_ERROR)
```

Used by monitoring scripts, a reverse proxy health probe, or a `curl` in cron. Request log level for `/health` is suppressed to warn so it doesn't flood INFO logs.

---

## Database Migration Strategy

`goose` applies versioned SQL migrations from `internal/db/migrations/`. Migrations run via **CLI, not on app startup** — this makes deploys reproducible and lets the operator review a migration before it applies.

```
internal/db/migrations/
├── 001_init.sql                ← creates all tables, enums, indexes, constraints
├── 002_seed_settings.sql       ← inserts the gym_settings row (id = 1)
├── 003_code_sequences.sql      ← Postgres sequences for MEM-, USR-, TRN-, etc.
└── 004_scheduled_job_runs.sql  ← tracking table for Intermittent Availability
```

Each file starts with goose annotations:

```sql
-- +goose Up
CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);

-- +goose Down
DROP TABLE members;
```

**Rules:**
- Migrations are **forward-only** in production. The `Down` section exists for local development only; never run `goose down` against prod.
- Every schema change requires a new versioned file; never edit a previously applied migration.
- `sqlc` reads these migration files as its schema source. Running `sqlc generate` after a schema change refreshes the generated Go code.

**Deploy sequence:**

```
1. Operator uploads new gym-backend binary + any new migration files to the server
2. Operator runs: goose -dir internal/db/migrations postgres "$DATABASE_URL" up
3. Operator restarts the service: sudo systemctl restart gym-backend  (or nssm restart GymBackend)
4. New binary starts, scheduler plugin runs catch-up, then listens
```

If the migration fails, the binary swap is skipped — the previous version keeps running.

---

## Deployment Strategy

### Build

```bash
# Produce a static Linux binary (common target for the gym server)
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o gym-backend ./cmd/server

# Produce a Windows binary (if the gym runs Windows)
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -o gym-backend.exe ./cmd/server

# Size check — expect ~15–25 MB
ls -lh gym-backend
```

`CGO_ENABLED=0` guarantees a fully static binary (no libc dependency), so it runs on any Linux distribution without matching glibc versions.

### Initial Setup (Linux)

```bash
# 1. Install Go (dev machine only) + PostgreSQL (server)
# Ubuntu/Debian on the server:
sudo apt update
sudo apt install postgresql postgresql-contrib

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

# 4. Deploy the binary
sudo cp gym-backend /opt/gym-app/gym-backend
sudo chmod +x /opt/gym-app/gym-backend
sudo chown gymapp:gymapp /opt/gym-app/gym-backend

# 5. Create the environment file (not committed to version control)
sudo tee /opt/gym-app/.env <<'EOF'
ENV=prod
DATABASE_URL=postgres://gymuser:your_secure_password@localhost:5432/gymdb?sslmode=disable
JWT_SECRET=replace_with_64_char_random_string
COOKIE_SECRET=replace_with_another_64_char_random_string
FRONTEND_ORIGIN=http://192.168.1.100:8080
BACKUP_DIR=/opt/gym-backups
LOG_LEVEL=info
EOF
sudo chmod 600 /opt/gym-app/.env
sudo chown gymapp:gymapp /opt/gym-app/.env

# 6. Apply migrations
sudo -u gymapp bash -c 'set -a; source /opt/gym-app/.env; set +a; \
  goose -dir /opt/gym-app/migrations postgres "$DATABASE_URL" up'

# 7. Tighten audit_logs privileges (see 07-auth-security.md)
sudo -u postgres psql -d gymdb -c 'REVOKE UPDATE, DELETE ON audit_logs FROM gymuser;'

# 8. Install and enable the systemd service
sudo cp gym-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable gym-backend
sudo systemctl start gym-backend

# Verify
sudo journalctl -u gym-backend -f --lines=80
```

### Routine Updates

```bash
# On the development machine:
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o gym-backend ./cmd/server
scp gym-backend gymserver:/opt/gym-app/gym-backend-new

# On the server:
sudo cp /opt/gym-app/gym-backend /opt/gym-app/gym-backend-previous   # keep rollback copy
sudo mv /opt/gym-app/gym-backend-new /opt/gym-app/gym-backend
sudo chown gymapp:gymapp /opt/gym-app/gym-backend
sudo chmod +x /opt/gym-app/gym-backend

# Apply any new migrations BEFORE restarting the service
sudo -u gymapp bash -c 'set -a; source /opt/gym-app/.env; set +a; \
  goose -dir /opt/gym-app/migrations postgres "$DATABASE_URL" up'

sudo systemctl restart gym-backend
sudo journalctl -u gym-backend -f --lines=50
```

---

## Rollback Strategy

**Code rollback:**

```bash
sudo cp /opt/gym-app/gym-backend-previous /opt/gym-app/gym-backend
sudo systemctl restart gym-backend
# Note: if the failed update included schema migrations, a database restore is also required.
```

**Database rollback:**

- Restore from the most recent backup (see Backup section below).
- This is the primary rollback mechanism for schema-level failures. Do not run `goose down` in production — too easy to lose data.

---

## Backup

### Backup Strategy

**Recommendation: PostgreSQL `pg_dump` invoked both from the Go backend and from a daily cron job.** The redundancy is intentional — if the Go service is down for the 02:00 window, the OS-level cron still fires.

```bash
# Manual one-off backup
pg_dump -U gymuser -d gymdb -f /opt/gym-backups/gymdb_$(date +%Y%m%d_%H%M%S).sql

# Scheduled daily backup (crontab for gymapp user, 2 AM daily)
0 2 * * * pg_dump -U gymuser -d gymdb -f /opt/gym-backups/gymdb_$(date +\%Y\%m\%d).sql
```

The in-process `daily_backup` cron job (registered via `robfig/cron` in `plugins/scheduler.go`) is idempotent: if a file for today's date already exists, it is a no-op. See **Intermittent Availability** in `08-cross-cutting-concerns.md`.

**Retention policy:**
- Keep the last 30 daily backups.
- Store backups in `/opt/gym-backups/` — separate from the application directory.
- **OPEN DECISION:** Replicate backups to an external drive or cloud storage (strongly recommended for disaster recovery).

### Backup API Endpoints

`POST /api/v1/backup/create` — OWNER only. The Go service invokes `pg_dump` via `os/exec.CommandContext`:

```go
func (s *Service) Create(ctx context.Context) (string, error) {
    filename := fmt.Sprintf("gymdb_%s.sql", time.Now().Format("20060102_150405"))
    path := filepath.Join(s.cfg.BackupDir, filename)

    cmd := exec.CommandContext(ctx, "pg_dump",
        "-U", s.cfg.DBUser,
        "-d", s.cfg.DBName,
        "-f", path,
    )
    cmd.Env = append(os.Environ(), "PGPASSWORD="+s.cfg.DBPassword)

    if out, err := cmd.CombinedOutput(); err != nil {
        return "", fmt.Errorf("pg_dump failed: %w — %s", err, out)
    }
    return filename, nil
}
```

`GET /api/v1/backup/list` — OWNER only. Lists files in `BackupDir` with timestamps and sizes.

**OPEN DECISION:** Whether the create endpoint streams the `.sql` file as an HTTP download or stores it server-side for a separate download step.

### Restore

`POST /api/v1/backup/restore` — OWNER only. Accepts a `.sql` backup file upload and restores the database via `psql`.

**Restore operation must:**
1. Require explicit confirmation from the Owner.
2. Back up the current database before restoring (safety net).
3. Terminate the process after restore (`os.Exit` via a graceful shutdown signal) so systemd/NSSM restart the service with a fresh connection pool.
4. Write an audit log entry after successful restore.

**CRITICAL:** A restore operation overwrites all current data. The UI must clearly communicate this before the Owner confirms.

**OPEN DECISION:** Backup/restore frontend UI is listed as planned scope but **not yet implemented**. The backend API should be built; frontend integration is a separate task.

---

## Disk and Storage Requirements

| Data | Estimated size after 3 years |
|---|---|
| Database (500 active members, full history) | ~100–300 MB |
| Daily backup files (30-day retention) | ~300 MB |
| Application logs | ~50 MB/month (with rotation) |
| `gym-backend` binary | ~20 MB |
| **Total** | ~1–2 GB |

A standard machine with 20 GB available disk is more than sufficient. On a Raspberry Pi 5 or a cheap mini-PC, this fits comfortably.

---

## Logging

Go uses `log/slog` from the standard library — no additional logging dependency required.

### `internal/middleware/logger.go` (template)

```go
package middleware

import (
    "log/slog"
    "net/http"
    "os"
    "time"
)

func NewLogger(env, level string) *slog.Logger {
    var handler slog.Handler
    opts := &slog.HandlerOptions{Level: parseLevel(level)}
    if env == "dev" {
        handler = slog.NewTextHandler(os.Stdout, opts)
    } else {
        handler = slog.NewJSONHandler(os.Stdout, opts)
    }
    return slog.New(handler)
}

func SlogRequestLogger(logger *slog.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            rw := wrapResponseWriter(w)
            next.ServeHTTP(rw, r)
            logger.Info("request",
                slog.String("method", r.Method),
                slog.String("path", r.URL.Path),
                slog.Int("status", rw.status),
                slog.Duration("duration", time.Since(start)),
                slog.String("ip", r.RemoteAddr),
            )
        })
    }
}
```

Log output in production (one JSON line per request):

```json
{"time":"2026-10-04T10:15:32Z","level":"INFO","msg":"request","method":"POST","path":"/api/v1/attendance","status":201,"duration":"43ms","ip":"192.168.1.42"}
```

Log rotation is handled by:
- **Linux:** journald captures stdout; `journalctl --vacuum-time=30d` keeps 30 days.
- **Windows:** NSSM's built-in log rotation (`AppRotateBytes 10485760` = rotate at 10 MB).

### What NOT to log

- Passwords (plain-text or hashed)
- Session cookies, JWT values, CSRF tokens
- Full request bodies (may contain PII)
- Any field named `password`, `password_hash`, `token`, `secret`

Redaction is enforced by never passing those fields into `slog.Any(...)` calls. There is no automatic redaction layer; discipline is the control.

---

## Monitoring

At this scale, monitoring is simple:

| Check | Method |
|---|---|
| Backend running | `systemctl status gym-backend` or `GET /health` |
| Database accessible | Included in `GET /health` (DB ping) |
| Disk space | `df -h` via cron alert |
| Backup file present | Shell script: alert if newest file in `BackupDir` is >24h old |

**No need** for Prometheus, Grafana, or an ELK stack at this scale. A small shell script that curls `/health` and checks backup freshness, with a mail/WhatsApp alert on failure, is sufficient.

---

## Development Environment

### Requirements

| Tool | Version |
|---|---|
| Go | 1.23+ |
| PostgreSQL | 15+ |
| `goose` CLI | latest (`go install github.com/pressly/goose/v3/cmd/goose@latest`) |
| `sqlc` CLI | latest (`go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`) |
| Node.js | 20+ (for the existing frontend) |

### Setup

```bash
# Backend
cd backend

# Install dependencies
go mod download

# Copy and edit local configuration
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, COOKIE_SECRET

# Apply migrations
goose -dir internal/db/migrations postgres "$DATABASE_URL" up

# Generate sqlc code (re-run after any migration or query change)
sqlc generate

# Dev loop
go run ./cmd/server

# Run tests
go test ./...

# Build release binary
go build -o gym-backend ./cmd/server

# Frontend (existing — no changes)
cd ../frontend
npm run dev
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

**OPEN DECISION:** Whether to provide a `docker-compose.yml` in the repository for the development database.

Unlike auto-migrate-on-boot frameworks, `goose` requires an explicit CLI run. A convenience `Makefile` target wraps this:

```makefile
migrate-up:
	goose -dir internal/db/migrations postgres "$$DATABASE_URL" up

migrate-down:
	goose -dir internal/db/migrations postgres "$$DATABASE_URL" down

sqlc:
	sqlc generate

dev:
	go run ./cmd/server

test:
	go test ./...
```
