# 08 — Cross-Cutting Concerns

## Validation

### Three-Layer Validation

| Layer | What it catches | How |
|---|---|---|
| **Request validation** (API boundary) | Missing fields, wrong types, format violations (phone regex, email format, `amount > 0`) | TypeBox schemas registered on the Fastify route (`body`, `querystring`, `params`) — Fastify compiles them to Ajv validators |
| **Business validation** (Service layer) | Rules requiring DB state (duplicate phone, active membership already exists, negative stock) | Service-layer checks (`SELECT EXISTS`, status lookups) before mutations |
| **Database constraints** | Last-resort guard: UNIQUE, NOT NULL, CHECK, FK | `postgres` driver surfaces `code: '23505'` (unique violation), `23503` (FK violation), etc.; the error handler plugin maps these to `409` / domain-specific errors |

All three layers must be present. Never rely on only one.

### Request Validation (TypeBox)

Request schemas are declared in `modules/<feature>/schemas.ts` and referenced on routes via the `schema` option. Fastify's TypeBox type provider gives both runtime validation and compile-time types:

```ts
// modules/member/schemas.ts
import { Type, Static } from '@sinclair/typebox';

export const CreateMemberRequest = Type.Object({
  firstName:     Type.String({ minLength: 2, maxLength: 50 }),
  lastName:      Type.String({ minLength: 2, maxLength: 50 }),
  phone:         Type.String({ pattern: '^\\d{10}$' }),
  email:         Type.Optional(Type.String({ format: 'email' })),
  dateOfBirth:   Type.Optional(Type.String({ format: 'date' })),  // YYYY-MM-DD
  amount:        Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
  durationInDays: Type.Optional(Type.Integer({ minimum: 1 })),
});
export type CreateMemberRequest = Static<typeof CreateMemberRequest>;
```

Common TypeBox constructs for request DTOs:

| Need | TypeBox |
|---|---|
| Required field | `Type.String()`, `Type.Integer()`, `Type.Number()` |
| Optional field | `Type.Optional(...)` |
| Nullable | `Type.Union([..., Type.Null()])` |
| String length bounds | `Type.String({ minLength, maxLength })` |
| Non-empty string | `Type.String({ minLength: 1 })` |
| Regex | `Type.String({ pattern: '^\\d{10}$' })` |
| Email | `Type.String({ format: 'email' })` |
| Date (YYYY-MM-DD) | `Type.String({ format: 'date' })` |
| Datetime (ISO) | `Type.String({ format: 'date-time' })` |
| UUID | `Type.String({ format: 'uuid' })` |
| Numeric bounds | `Type.Integer({ minimum, maximum })`, `Type.Number({ exclusiveMinimum })` |
| Enum / literal set | `Type.Union([Type.Literal('ACTIVE'), Type.Literal('INACTIVE')])` |

Validation failures produce `400 Bad Request` with Fastify's `err.validation` array populated; the error handler plugin converts this to the standard `ApiError` response shape.

### Business Validation (Service layer)

Business rules that require database state live in service functions and throw domain errors:

```
Member phone uniqueness       → MemberPhoneDuplicateError (409)
One active membership         → MembershipAlreadyActiveError (409)
Duplicate attendance          → AttendanceAlreadyMarkedError (409)
Stock sufficiency             → InsufficientStockError (422)
Plan must be ACTIVE to use    → BusinessRuleError (422)
Lead already converted        → LeadAlreadyConvertedError (409)
Attendance settings check     → AttendanceNotAllowedError (422)
```

Business validation runs **before** `sql.begin()` is called. If validation fails, the transaction is not started.

---

## Error Handling

### Standard Error Response

```json
{
  "status": 409,
  "code": "MEMBER_PHONE_DUPLICATE",
  "message": "A member with this phone number already exists.",
  "details": { "field": "phone", "value": "9876543211" }
}
```

Implemented via `app.setErrorHandler(...)` in `plugins/error-handler.ts` — see `06-backend-lld.md` for the full handler code. It maps:

- `AppError` subclasses → `err.httpStatus` + `err.code` + `err.message` + `err.details`.
- Fastify validation errors (`err.validation`) → `400 VALIDATION_ERROR` with the validation details array.
- `postgres` driver error code `23505` (unique violation) → `409 UNIQUE_CONSTRAINT_VIOLATION`.
- Any other thrown error → `500 INTERNAL_SERVER_ERROR` (logged with full stack via `req.log.error`).

### HTTP Status Reference

| Status | Meaning | When |
|---|---|---|
| `200` | OK | Successful GET, PATCH |
| `201` | Created | Successful POST (resource created) |
| `204` | No Content | Successful DELETE |
| `400` | Bad Request | Request validation failure (TypeBox schema) |
| `401` | Unauthorized | Not authenticated |
| `403` | Forbidden | Authenticated but lacks permission |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Unique constraint / business state conflict |
| `422` | Unprocessable Entity | Business rule violation (not a conflict) |
| `500` | Internal Server Error | Unexpected server-side failure |

### Database Constraint Errors

When the `postgres` driver throws with `code: '23505'`, the error handler plugin returns a generic `409 UNIQUE_CONSTRAINT_VIOLATION` with the constraint name in `details`. For better UX, services do an application-level `SELECT EXISTS` check before the insert and throw a domain-specific error (`MEMBER_PHONE_DUPLICATE`) — but the DB-level check still fires as a safety net under race conditions.

---

## Logging

Fastify ships with Pino built in — `req.log` is a request-scoped logger with a `reqId`, method, URL, and status attached automatically. No external logging library is required.

### Request Logging

Every incoming request is logged automatically at `info` level with request/response pairs. In production the output is JSON lines (one object per line) suitable for `journalctl` or shipping to a log aggregator:

```
{"level":30,"time":"2026-10-04T10:15:32.411Z","pid":1234,"hostname":"gym-server","reqId":"req-7","req":{"method":"POST","url":"/api/v1/attendance","remoteAddress":"192.168.1.42"},"userId":"u003","msg":"incoming request"}
{"level":30,"time":"2026-10-04T10:15:32.454Z","reqId":"req-7","res":{"statusCode":201},"responseTime":43,"msg":"request completed"}
```

Fields: timestamp, method, URL, status, duration, `reqId`, `userId` (if authenticated). The `userId` is attached by a small `onRequest` hook after `requireAuth` populates `req.user`.

Request bodies are **not** logged (may contain PII or passwords). Pino's `redact` option is configured to strip any field named `password`, `passwordHash`, `token`, or `secret` if it ever appears in a logged object.

### Pino Configuration

```ts
// plugins/logger.ts (illustrative — passed to Fastify at construction, not registered)
export const loggerConfig = {
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: ['password', 'passwordHash', 'token', 'secret', '*.password', 'req.headers.cookie', 'req.headers.authorization'],
    censor: '[REDACTED]',
  },
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,  // JSON lines to stdout; systemd/journalctl handles rotation
};
```

In production, logs go to stdout and are captured by systemd/journald. For long-term retention, `pino-roll` can be used to write daily rotating files directly:

```ts
transport: { target: 'pino-roll', options: {
  file: '/var/log/gym-app/gym-backend.log',
  frequency: 'daily',
  size: '50m',
  mkdir: true,
}}
```

### Application Errors

Unhandled errors are logged by the error handler plugin with the full `err` object (stack trace included). Stack traces are **never** returned to the client in production — the `500` response contains only `INTERNAL_SERVER_ERROR` code + a generic message.

```ts
req.log.error({ err }, 'unhandled error');
```

### Business Events (INFO level)

```
INFO  membership  Membership created: memberId=m001 planId=p002 endDate=2027-03-30
INFO  payment     Payment recorded: paymentId=pay042 amount=1500 method=UPI
INFO  lead        Lead converted: leadId=l012 → memberId=m089
```

Written from service code via `app.log.info({ memberId, planId, endDate }, 'Membership created')`. Fastify's logger supports child loggers scoped to a module name, which keeps structured logging consistent.

### What NOT to log

- Passwords (plain-text or hashed)
- JWTs or any `Authorization` header value
- Full request bodies containing sensitive PII
- Any field named `password`, `passwordHash`, `token`, `secret`, `cookie`

---

## Audit Logging

### Which actions produce audit records

| Entity | Audited actions |
|---|---|
| User | CREATE, UPDATE, DELETE, LOGIN, LOGOUT |
| Member | CREATE, UPDATE, DELETE |
| MembershipPlan | CREATE, UPDATE, DELETE |
| Membership | CREATE |
| Payment | CREATE |
| Attendance | CREATE |
| Trainer | CREATE, UPDATE, DELETE |
| Lead | CREATE, UPDATE, DELETE |
| Expense | CREATE, UPDATE, DELETE |
| InventoryItem | CREATE, UPDATE, DELETE |
| InventoryTransaction | CREATE |
| Equipment | CREATE, UPDATE, DELETE |
| EquipmentMaintenance | CREATE |
| NotificationRecord | CREATE |
| Settings | UPDATE |

### Audit write strategy

- `auditLog(tx, { ... })` is called from within the service's `sql.begin()` block.
- The audit log INSERT participates in the same transaction as the primary operation.
- If the primary operation throws, the transaction rolls back — the audit record is also rolled back, maintaining consistency.
- For failed operations outside a transaction (e.g., failed login), `auditLog` is called with the top-level `sql` client — the audit record is written independently.

See `common/audit.ts` in `06-backend-lld.md` for the helper implementation.

---

## Pagination

### Request parameters

```
GET /api/v1/members?page=1&pageSize=20&search=rahul&status=ACTIVE
```

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | 1-based page number |
| `pageSize` | int | 20 | Records per page (max 100) |
| `search` | string | — | Text search query |
| `status` | string | — | Filter by status enum |
| `fromDate` | string | — | Start of date range (`YYYY-MM-DD`) |
| `toDate` | string | — | End of date range (`YYYY-MM-DD`) |

In SQL, `page=1` maps to `OFFSET 0 LIMIT 20`; `page=2` maps to `OFFSET 20 LIMIT 20`.

### Response shape

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 147,
    "totalPages": 8
  }
}
```

Implemented via a generic `PageResponse<T>` helper in `common/pagination.ts`:

```ts
// common/pagination.ts
import { Type, type TSchema } from '@sinclair/typebox';

export const PageMeta = Type.Object({
  page:       Type.Integer({ minimum: 1 }),
  pageSize:   Type.Integer({ minimum: 1 }),
  total:      Type.Integer({ minimum: 0 }),
  totalPages: Type.Integer({ minimum: 0 }),
});

export const PageResponse = <T extends TSchema>(item: T) =>
  Type.Object({
    data: Type.Array(item),
    meta: PageMeta,
  });

export interface PageQuery {
  page: number;
  pageSize: number;
}

export function parsePageQuery(q: { page?: number; pageSize?: number }): PageQuery {
  const page = Math.max(1, q.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, q.pageSize ?? 20));
  return { page, pageSize };
}

export function toPageMeta(page: number, pageSize: number, total: number) {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}
```

Repository functions return `{ rows, total }`; the service wraps them in `{ data: rows.map(toResponse), meta: toPageMeta(...) }`. The `total` typically comes from a `COUNT(*) OVER ()` window function in the same query, or a separate `COUNT` query — both are cheap at this scale.

---

## Search

### Global Search

- `GET /api/v1/search?q=<query>`
- Minimum query length: 2 characters.
- Maximum 5 results per category.
- Case-insensitive.
- Permission-aware: only searches entities the caller has `view` permission for.

**SQL approach (PostgreSQL `ILIKE`):**

```ts
// modules/search/service.ts (illustrative)
const pattern = `%${q}%`;

const [members, trainers, leads] = await Promise.all([
  canView('members:view')
    ? sql`
        SELECT id, member_code, first_name, last_name, phone
        FROM members
        WHERE first_name ILIKE ${pattern}
           OR last_name  ILIKE ${pattern}
           OR phone      ILIKE ${pattern}
           OR member_code ILIKE ${pattern}
        LIMIT 5
      ` : [],
  canView('trainers:view') ? sql`...` : [],
  canView('leads:view')    ? sql`...` : [],
]);
```

`ILIKE` with `%q%` is fine at ~500 members; if the dataset ever grows an order of magnitude, add a `pg_trgm` GIN index on the searched columns.

---

## Date and Time

### Timezone

All business logic operates in **`Asia/Kolkata` (IST, UTC+5:30)**.

- `TIMESTAMPTZ` columns store UTC. The `postgres` driver returns JavaScript `Date` objects.
- Node's default timezone must not be relied on for business logic — always construct dates using a known timezone (e.g., `date-fns-tz`'s `zonedTimeToUtc` / `utcToZonedTime` or `Intl.DateTimeFormat` with `timeZone: 'Asia/Kolkata'`).
- `DATE` columns (membership dates, attendance) store calendar dates with no timezone — compare using `YYYY-MM-DD` strings or `date-fns`'s date-only helpers.

### Type Mapping

| Domain concept | TypeScript type | DB column type |
|---|---|---|
| Date-only (membership dates, attendance) | `string` (`YYYY-MM-DD`) | `DATE` |
| Timestamp (createdAt, updatedAt, audit) | `Date` (JS) / `string` (ISO 8601) on the wire | `TIMESTAMPTZ` |
| Time-only (attendance window) | `string` (`HH:MM`) | `VARCHAR(5)` or `TIME` |

The `postgres` driver returns `TIMESTAMPTZ` as a JS `Date` and `DATE` as a string by default — services convert to the response-shape type explicitly.

### "Today" in Queries

```ts
import { formatInTimeZone } from 'date-fns-tz';

const today = formatInTimeZone(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
// → "2026-10-04"
```

Never use `new Date().toISOString().slice(0, 10)` — that yields a UTC date, which is one day behind IST for the first 5.5 hours of each day.

---

## Money

### Currency

All monetary values are in **Indian Rupees (INR)**.

**Storage representation: `DECIMAL(10,2)` rupees, carried as `string` in TypeScript.**

| Why | |
|---|---|
| `DECIMAL` is exact — no floating-point rounding | SQL semantics guarantee this |
| The `postgres` driver returns `DECIMAL` as a `string` in JS (because JS `number` cannot represent all DECIMAL values precisely) | correctness by default |
| TypeScript services treat money as `string` and only convert to `number` for display | prevents accidental float arithmetic |

For arithmetic, use a decimal library (`decimal.js`) in the rare cases where sums or multiplications happen in app code. Most arithmetic should happen in SQL (`SUM(amount)`) where DECIMAL semantics are preserved.

```ts
// Request schema
Type.String({ pattern: '^\\d+(\\.\\d{1,2})?$' })  // e.g. "1500.00"
```

Or accept `Type.Number({ exclusiveMinimum: 0 })` at the boundary and convert to string before inserting — either is defensible; pick one and apply consistently.

**Never use `number` end-to-end for monetary values.** JavaScript `number` is IEEE-754 double and cannot represent all decimal rupee amounts precisely.

---

## Transactions

Transaction rules under the `postgres` driver:

1. **Service layer only.** Not in route handlers, not in repositories.
2. **Use `sql.begin(async (tx) => { ... })`.** The driver issues `BEGIN` / `COMMIT` / `ROLLBACK` automatically — commit on resolve, rollback on reject. Nested `sql.begin` creates savepoints.
3. **Read-only operations don't need a transaction.** Postgres auto-commits each statement; wrapping a single `SELECT` in `sql.begin` adds no benefit.
4. **Repositories accept either `sql` or `tx`.** This lets a repository function compose into a service's transaction without forcing one when none is needed.
5. **Rollback is automatic.** Any thrown error inside the `sql.begin` callback triggers rollback. Domain errors (`AppError` and subclasses) are regular thrown errors, so they roll back correctly.

See `06-backend-lld.md` for canonical examples.

---

## Idempotency

| Operation | Risk | Mitigation |
|---|---|---|
| Mark attendance | Duplicate for same member+date | DB `UNIQUE(member_id, attendance_date)` → `409` |
| Create membership | Two active memberships | DB partial unique index + service check → `409` |
| Record payment | Double payment | **OPEN DECISION:** Accept optional `idempotencyKey`; not implemented in v1 |

---

## Concurrency

### Duplicate attendance

Two simultaneous attendance requests for the same member and date → the second INSERT fails on the `UNIQUE(member_id, attendance_date)` constraint. The `postgres` driver surfaces `code: '23505'`; the error handler plugin maps it to `409 ATTENDANCE_ALREADY_MARKED` (the service also throws the domain error pre-insert on the common path).

### Double membership creation

Two simultaneous membership creation requests → the partial unique index `UNIQUE(member_id) WHERE status='ACTIVE'` rejects the second INSERT. Same mapping: `409 MEMBERSHIP_ALREADY_ACTIVE`.

### Inventory stock race condition

Two concurrent `STOCK_OUT` requests could both pass the stock-sufficiency check before either updates. Prevention: `SELECT ... FOR UPDATE` inside the transaction, which takes a row-level lock on the inventory item:

```ts
await sql.begin(async (tx) => {
  const [item] = await tx`
    SELECT id, current_stock, minimum_stock, status
    FROM inventory_items
    WHERE id = ${itemId}
    FOR UPDATE
  `;
  if (!item) throw new NotFoundError('INVENTORY_ITEM_NOT_FOUND', 'Item not found');

  const newStock = item.current_stock - quantity;
  if (newStock < 0) throw new InsufficientStockError('INVENTORY_INSUFFICIENT_STOCK', 'Not enough stock');

  await tx`INSERT INTO inventory_transactions ${tx(txData)}`;
  await tx`UPDATE inventory_items SET current_stock = ${newStock}, status = ${deriveStatus(newStock, item.minimum_stock)} WHERE id = ${itemId}`;
  await auditLog(tx, { ... });
});
```

`FOR UPDATE` serializes concurrent transactions touching the same row — the second request blocks until the first commits, then re-reads the (now-updated) stock and either succeeds or correctly fails the stock check.

---

## Intermittent Availability

The gym PC is typically powered off outside operating hours. Scheduled jobs that were supposed to fire during the shutdown window are missed; without a catch-up strategy, membership expiries don't apply, reminders don't go out, and daily backups never happen. The design handles this with two mechanisms: **persistent job-run tracking** and **catch-up on boot**. Both are implemented in `plugins/scheduler.ts`.

### Scheduled job tracking table

A single small table records when each named job last completed successfully:

```sql
CREATE TABLE scheduled_job_runs (
  job_name     TEXT PRIMARY KEY,
  last_run_at  TIMESTAMPTZ NOT NULL
);
```

Seeded with one row per registered job on first startup (`last_run_at = 'epoch'`). Each job updates its row within the same transaction as its primary work, so a partial failure never records a run that didn't happen.

### Jobs covered

| Job name | Normal schedule (IST) | Treated as overdue when |
|---|---|---|
| `expire_memberships` | 00:00 daily | `last_run_at` is before today's 00:00 IST |
| `send_expiry_notifications` | 09:00 daily | `last_run_at` is before today's 09:00 IST AND wall clock is past 09:00 |
| `daily_backup` | 02:00 daily | `last_run_at` is more than 24h ago |

### Catch-up on boot

During app startup — after plugins register but before `.listen()` — the scheduler plugin reads `scheduled_job_runs` and runs any overdue job synchronously before accepting traffic:

```ts
// plugins/scheduler.ts (conceptual)
export const schedulerPlugin: FastifyPluginAsync = async (app) => {
  await runOverdueJobs(app.sql);
  cron.schedule('0 0 * * *', () => withJobRun(app.sql, 'expire_memberships', expireMemberships),         { timezone: 'Asia/Kolkata' });
  cron.schedule('0 9 * * *', () => withJobRun(app.sql, 'send_expiry_notifications', sendReminders),      { timezone: 'Asia/Kolkata' });
  cron.schedule('0 2 * * *', () => withJobRun(app.sql, 'daily_backup', runBackup),                       { timezone: 'Asia/Kolkata' });
};

async function runOverdueJobs(sql: Sql) {
  for (const job of REGISTERED_JOBS) {
    if (await isOverdue(sql, job)) {
      await withJobRun(sql, job.name, job.handler);
    }
  }
}

async function withJobRun(sql: Sql, jobName: string, handler: (tx: Sql) => Promise<void>) {
  await sql.begin(async (tx) => {
    await handler(tx);
    await tx`
      INSERT INTO scheduled_job_runs (job_name, last_run_at) VALUES (${jobName}, NOW())
      ON CONFLICT (job_name) DO UPDATE SET last_run_at = EXCLUDED.last_run_at
    `;
  });
}
```

Jobs must be **idempotent** so a catch-up run is safe:
- `expire_memberships` — `UPDATE memberships SET status='EXPIRED' WHERE status='ACTIVE' AND end_date < CURRENT_DATE`. Running it twice has no effect the second time.
- `send_expiry_notifications` — inserts `notification_records` rows; a `UNIQUE(membership_id, type, DATE(created_at))` partial index prevents duplicate reminders on the same day.
- `daily_backup` — writes `gymdb_YYYYMMDD.sql` to the backup directory; if a file for today's date already exists, the job is a no-op.

### What's not covered

- Sub-daily cadence (hourly, 15-min) is not needed in v1 and is not supported by the pattern as written. Adding it would require a per-interval overdue check rather than the daily one above.
- The *external dispatch* side of notifications (SMS/WhatsApp/Email) runs inside the job but depends on provider availability. The `notification_records` row is written transactionally; a failed external send is retried out-of-band (see Phase 15 in `10-backend-development-plan.md`).

### Dependency: autostart on boot

Catch-up only runs if the backend process actually starts after boot. Autostart is configured at the OS level — see `09-deployment-operations.md` for the systemd (Linux) and NSSM (Windows) setups. **Without autostart, this entire mechanism is bypassed.**

---

## Testing Strategy

(Full testing strategy is detailed in `06-backend-lld.md`. Summary here for cross-cutting reference.)

| Test type | Tool | Purpose |
|---|---|---|
| Unit | Vitest | Service business rules, helpers, permission map |
| Route / integration | Vitest + `app.inject()` + Testcontainers | Full request pipeline: validation → auth → handler → DB |
| DB constraint | Vitest + Testcontainers (raw `postgres` client) | Unique constraints, partial indexes, migrations apply cleanly |

**Principle:** Every business rule in a service must have at least one unit test covering the happy path and the error path. Every DB constraint must have at least one Testcontainers test verifying it fires.

**Test isolation:** Each test suite starts with a clean schema (either by truncating all tables in a `beforeEach`, or by spinning up a fresh Testcontainers instance per suite). Tests do not depend on data left by previous tests.

---

## API Documentation

`@fastify/swagger` + `@fastify/swagger-ui` generate an OpenAPI 3.1 document from the TypeBox schemas already attached to each route — no separate annotation layer. Swagger UI is available at `/docs` in development and internal review environments:

```ts
// plugins/swagger.ts
await app.register(fastifySwagger, {
  openapi: {
    info: { title: 'Gym Management API', version: '1.0.0' },
    servers: [{ url: '/api/v1' }],
  },
  transform: jsonSchemaTransform,  // from @fastify/type-provider-typebox
});
await app.register(fastifySwaggerUi, { routePrefix: '/docs' });
```

Because the OpenAPI document is derived from the same schemas that validate requests, there is no risk of docs drifting from reality. Disable the Swagger UI route in production via config if preferred.
