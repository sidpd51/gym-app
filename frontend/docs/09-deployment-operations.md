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
| Language | Java 21 (LTS) |
| Framework | Spring Boot 3.x |
| Build tool | **OPEN DECISION** (Maven recommended — see `02-system-architecture.md`) |
| Database | **OPEN DECISION** (PostgreSQL 15+ recommended) |
| Migration | **OPEN DECISION** (Flyway recommended) |
| Auth | Spring Security — session-based or JWT (**OPEN DECISION**) |

**Java 21** is the recommended LTS version. Spring Boot 3.x requires Java 17 minimum; Java 21 provides virtual threads and improved GC performance for future flexibility.

---

## Configuration

Spring Boot reads configuration from `src/main/resources/application.yml`. Environment variables override individual properties at runtime using the `${ENV_VAR:default}` syntax.

### `application.yml` (template)

```yaml
server:
  port: ${PORT:8080}

spring:
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/gymdb}
    username: ${DB_USER:gymuser}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate       # Flyway owns the schema; Hibernate must not modify it
    show-sql: false
    properties:
      hibernate:
        jdbc:
          time_zone: UTC
  flyway:
    enabled: true
    locations: classpath:db/migration

management:
  endpoints:
    web:
      exposure:
        include: health,info   # Spring Boot Actuator
  endpoint:
    health:
      show-details: when-authorized

gym:
  frontend-origin: ${FRONTEND_ORIGIN:http://localhost:5173}
  session-secret: ${SESSION_SECRET}
  session-expiry-hours: ${SESSION_EXPIRY_HOURS:8}
```

### Required environment variables

| Variable | Description | Required |
|---|---|---|
| `DB_PASSWORD` | Database password | Yes |
| `SESSION_SECRET` | Session signing secret (≥64 random chars) | Yes |
| `DATABASE_URL` | JDBC URL | No (default: localhost) |
| `DB_USER` | Database username | No (default: `gymuser`) |
| `FRONTEND_ORIGIN` | CORS allowed origin | No (default: localhost) |
| `PORT` | Server listen port | No (default: `8080`) |
| `SESSION_EXPIRY_HOURS` | Session TTL in hours | No (default: `8`) |

**Rules:**
- No secrets in committed config files.
- In production, set environment variables via a systemd `EnvironmentFile` or `/etc/environment`.
- Commit an `application-example.yml` with placeholder values for developer reference.

---

## Directory Structure

```
gym-backend/
├── src/
│   ├── main/
│   │   ├── java/com/fitzone/gym/
│   │   │   ├── common/          ← shared infrastructure
│   │   │   ├── auth/
│   │   │   ├── user/
│   │   │   ├── member/
│   │   │   ├── membershipplan/
│   │   │   ├── membership/
│   │   │   ├── payment/
│   │   │   ├── attendance/
│   │   │   ├── trainer/
│   │   │   ├── assignment/
│   │   │   ├── lead/
│   │   │   ├── expense/
│   │   │   ├── inventory/
│   │   │   ├── equipment/
│   │   │   ├── notification/
│   │   │   ├── report/
│   │   │   ├── settings/
│   │   │   ├── auditlog/
│   │   │   ├── search/
│   │   │   └── backup/
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-prod.yml
│   │       └── db/
│   │           └── migration/   ← Flyway SQL (V1__init.sql, V2__seed.sql, ...)
│   └── test/
│       └── java/com/fitzone/gym/
├── pom.xml                      ← Maven (or build.gradle for Gradle)
└── .gitignore
```

---

## Frontend Hosting

The React SPA is a set of static files produced by `npm run build`. Two hosting options:

**Option A — Spring Boot serves static files (Recommended)**
- Copy `frontend/dist/` contents to `src/main/resources/static/`.
- Spring Boot automatically serves everything in `static/` as HTTP resources.
- Single port, single JAR, single process. Simplest LAN setup.

**Option B — Separate static server**
- Nginx or Caddy serves the frontend; Spring Boot serves only the API.
- More flexible; allows HTTPS termination at the proxy level.
- Spring Boot CORS config must allow the Nginx origin explicitly.

For a LAN gym system, **Option A** is recommended for operational simplicity.

---

## LAN / Network Architecture

```
Gym LAN (192.168.1.x)
│
├── Server Machine (e.g., 192.168.1.100)
│   ├── Spring Boot JAR (port 8080)
│   ├── PostgreSQL (port 5432, LAN-internal only)
│   └── Frontend (static files served by Spring Boot on port 8080)
│
├── Reception Tablet / PC  (browser → http://192.168.1.100:8080)
├── Trainer Phone          (browser → http://192.168.1.100:8080)
└── Owner Laptop           (browser → http://192.168.1.100:8080)
```

**PostgreSQL must NOT be exposed to the internet.** Bind it to `localhost` only (`listen_addresses = 'localhost'` in `postgresql.conf`).

**OPEN DECISION:** Whether to configure HTTPS with a self-signed certificate or local CA. Recommended even on LAN to prevent credential interception.

---

## Process Management

Use **systemd** to manage the Spring Boot process on Linux:

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
ExecStart=/usr/bin/java -jar /opt/gym-app/gym-backend.jar \
    --spring.profiles.active=prod
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

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

**OPEN DECISION:** On non-Linux servers (e.g., Windows), use NSSM (Non-Sucking Service Manager) to wrap the JAR as a Windows Service.

---

## Health Check

Spring Boot Actuator exposes a health endpoint when `spring-boot-starter-actuator` is on the classpath:

```
GET /actuator/health
→ 200 OK
{
  "status": "UP",
  "components": {
    "db":        { "status": "UP" },
    "diskSpace": { "status": "UP" }
  }
}
```

This checks both the application process and the database connection in a single request. Used by systemd's `ExecStartPost` check, monitoring scripts, or a reverse proxy health probe.

---

## Database Migration Strategy

**OPEN DECISION:** Flyway (recommended) or Liquibase. Examples below use Flyway.

Flyway applies SQL migration files automatically at application startup when `spring.flyway.enabled=true`:

```
src/main/resources/db/migration/
├── V1__init.sql          ← creates all tables, enums, indexes, constraints
├── V2__seed_settings.sql ← inserts the gym_settings row (id = 1)
└── V3__...               ← future schema changes, always additive
```

**Rules:**
- Migrations are **forward-only** in production. No destructive rollback migrations.
- Every schema change requires a new versioned file; never edit a previously applied migration.
- `spring.jpa.hibernate.ddl-auto=validate` — Hibernate validates the schema against entity mappings but does not modify it. Flyway owns the schema.

**Startup sequence:**
```
1. Spring Boot starts
2. Flyway detects and applies any pending migrations
3. Hibernate validates entity mappings against the current schema
4. Application begins accepting requests
```

If Hibernate validation fails (entity mapping diverges from schema), the application fails to start — catching mapping errors before serving traffic.

---

## Deployment Strategy

### Build

```bash
# Maven: produce a self-contained executable JAR
./mvnw clean package -DskipTests

# Output: target/gym-backend-<version>.jar

# Gradle equivalent
./gradlew clean build -x test
# Output: build/libs/gym-backend-<version>.jar
```

### Initial Setup

```bash
# 1. Install Java 21 and PostgreSQL on the server machine
# Ubuntu/Debian:
sudo apt update
sudo apt install openjdk-21-jre-headless postgresql postgresql-contrib

# 2. Create database and user
sudo -u postgres psql <<'SQL'
CREATE USER gymuser WITH PASSWORD 'your_secure_password';
CREATE DATABASE gymdb OWNER gymuser;
GRANT ALL PRIVILEGES ON DATABASE gymdb TO gymuser;
SQL

# 3. Create application directory and dedicated service user
sudo useradd -r -s /bin/false gymapp
sudo mkdir -p /opt/gym-app /opt/gym-backups
sudo chown gymapp:gymapp /opt/gym-app /opt/gym-backups

# 4. Deploy the JAR
sudo cp target/gym-backend.jar /opt/gym-app/gym-backend.jar
sudo chown gymapp:gymapp /opt/gym-app/gym-backend.jar

# 5. Create the environment file (not committed to version control)
sudo tee /opt/gym-app/.env <<'EOF'
DATABASE_URL=jdbc:postgresql://localhost:5432/gymdb
DB_USER=gymuser
DB_PASSWORD=your_secure_password
SESSION_SECRET=replace_with_64_char_random_string
FRONTEND_ORIGIN=http://192.168.1.100:8080
EOF
sudo chmod 600 /opt/gym-app/.env
sudo chown gymapp:gymapp /opt/gym-app/.env

# 6. Install and enable the systemd service
sudo cp gym-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable gym-backend
sudo systemctl start gym-backend

# Flyway migrations run automatically on first startup.
# Verify:
sudo journalctl -u gym-backend -f --lines=80
```

### Routine Updates

```bash
# On the development machine:
./mvnw clean package -DskipTests
scp target/gym-backend.jar gymserver:/opt/gym-app/gym-backend-new.jar

# On the server:
sudo cp /opt/gym-app/gym-backend.jar /opt/gym-app/gym-backend-previous.jar  # keep rollback copy
sudo mv /opt/gym-app/gym-backend-new.jar /opt/gym-app/gym-backend.jar
sudo systemctl restart gym-backend

# Confirm startup (migrations + Hibernate validation logged here):
sudo journalctl -u gym-backend -f --lines=50
```

---

## Rollback Strategy

**Code rollback:**
```bash
# Replace the JAR with the previous version and restart
sudo cp /opt/gym-app/gym-backend-previous.jar /opt/gym-app/gym-backend.jar
sudo systemctl restart gym-backend

# Note: if the update included schema migrations, a database restore is also required.
```

**Database rollback:**
- Restore from the most recent backup (see Backups section below).
- This is the primary rollback mechanism for schema-level failures.

---

## Backup

### Backup Strategy

**Recommendation: PostgreSQL `pg_dump` invoked from Spring Boot + a daily cron job**

```bash
# Manual one-off backup
pg_dump -U gymuser -d gymdb -f /opt/gym-backups/gymdb_$(date +%Y%m%d_%H%M%S).sql

# Scheduled daily backup (crontab for gymapp user, 2 AM daily)
0 2 * * * pg_dump -U gymuser -d gymdb -f /opt/gym-backups/gymdb_$(date +\%Y\%m\%d).sql
```

**Retention policy:**
- Keep the last 30 daily backups.
- Store backups in `/opt/gym-backups/` — separate from the application directory.
- **OPEN DECISION:** Whether to replicate backups to an external drive or cloud storage (strongly recommended for disaster recovery).

### Backup API Endpoints

`POST /api/v1/backup/create` — OWNER only. Spring Boot invokes `pg_dump` via `ProcessBuilder`, saves the `.sql` file to the configured backup directory.

`GET /api/v1/backup/list` — OWNER only. Lists backup files with timestamps and sizes.

**OPEN DECISION:** Whether the backup endpoint streams the `.sql` file as an HTTP download or stores it server-side for a separate download step.

### Restore

`POST /api/v1/backup/restore` — OWNER only. Accepts an uploaded `.sql` backup file and restores the database.

**Restore operation must:**
1. Require explicit confirmation from the Owner.
2. Back up the current database before restoring.
3. Restart the Spring Boot application after restore to reset any in-memory state.
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
| Spring Boot JAR | ~60–80 MB |
| **Total** | ~2–4 GB |

A standard machine with 20 GB available is more than sufficient.

---

## Logging

Spring Boot uses **SLF4J + Logback** by default — no additional logging dependency is required.

### Logback configuration (`src/main/resources/logback-spring.xml`)

```xml
<configuration>
    <!-- Human-readable console output for local/dev -->
    <springProfile name="local,dev">
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
            </encoder>
        </appender>
        <root level="DEBUG">
            <appender-ref ref="CONSOLE"/>
        </root>
        <logger name="com.fitzone.gym" level="DEBUG"/>
        <logger name="org.hibernate.SQL" level="DEBUG"/>
    </springProfile>

    <!-- Rolling file appender for production -->
    <springProfile name="prod">
        <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>/var/log/gym-app/gym-backend.log</file>
            <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
                <fileNamePattern>/var/log/gym-app/gym-backend.%d{yyyy-MM-dd}.log.gz</fileNamePattern>
                <maxHistory>30</maxHistory>
            </rollingPolicy>
            <encoder>
                <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
            </encoder>
        </appender>
        <root level="INFO">
            <appender-ref ref="FILE"/>
        </root>
    </springProfile>
</configuration>
```

Log files rotate daily and retain 30 days of history. System-level `logrotate` can supplement for disk-space alerts.

---

## Monitoring

At this scale, monitoring is simple:

| Check | Method |
|---|---|
| Backend running | `systemctl status gym-backend` or `GET /actuator/health` |
| Database accessible | Included in `/actuator/health` (`db` component) |
| Disk space | `df -h` via cron alert |
| Backup file present | Shell script: alert if newest backup in `/opt/gym-backups/` is >24h old |

**No need** for Prometheus, Grafana, or an ELK stack at this scale. A simple shell script that checks the above conditions and sends an alert (email or WhatsApp message) is sufficient.

---

## Development Environment

### Requirements

| Tool | Version |
|---|---|
| Java (JDK) | 21+ |
| Maven | 3.9+ (or Gradle 8+) |
| PostgreSQL | 15+ |
| Node.js | 20+ (for the existing frontend) |

### Setup

```bash
# Backend
cd gym-backend

# Copy and edit local configuration
cp src/main/resources/application.yml src/main/resources/application-local.yml
# Edit application-local.yml: set your local DB URL and credentials

# Start with local profile (Flyway migrations run on first start)
./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# Run tests
./mvnw test

# Build executable JAR
./mvnw clean package

# Frontend (existing — no changes)
cd frontend
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

Flyway migrations run automatically on application startup with `spring.flyway.enabled=true`. No separate migration command is needed during development.
