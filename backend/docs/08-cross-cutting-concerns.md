# 08 — Cross-Cutting Concerns

## Validation

### Three-Layer Validation

| Layer | What it catches | How |
|---|---|---|
| **Request validation** (API boundary) | Missing fields, wrong types, format violations (phone regex, email format, `amount > 0`) | `validate:"..."` struct tags on DTOs + `validator.Struct(&req)` in the handler |
| **Business validation** (service layer) | Rules requiring DB state (duplicate phone, active membership already exists, negative stock) | Service-layer checks returning `*common.AppError` before mutations |
| **Database constraints** | Last-resort guard: UNIQUE, NOT NULL, CHECK, FK | pgx returns a `*pgconn.PgError`; the error middleware inspects `.Code` and `.ConstraintName` to produce a domain error |

All three layers must be present. Never rely on only one.

### Request Validation Tags

Common `go-playground/validator/v10` tags used across request DTOs:

```
required                     field must be set / non-zero
omitempty                    skip validation if the field is empty
min=N / max=N                numeric or length bounds
len=N                        exact length
email                        email format (RFC 5322 subset)
numeric                      digits only
datetime=2006-01-02          parse with time.Parse(layout, value); use for date-only strings
gt=0 / gte=0                 greater-than / greater-or-equal (for numbers)
oneof=A B C                  enum-like whitelist
```

Example:

```go
type CreateMemberRequest struct {
    FirstName   string `json:"firstName"             validate:"required,min=2,max=50"`
    Phone       string `json:"phone"                 validate:"required,len=10,numeric"`
    Email       string `json:"email,omitempty"       validate:"omitempty,email"`
    DateOfBirth string `json:"dateOfBirth,omitempty" validate:"omitempty,datetime=2006-01-02"`
    Amount      string `json:"amount,omitempty"      validate:"omitempty,numeric,gt=0"`
}
```

Validation errors produce `400 Bad Request` via `render.ValidationError(w, err)`, which collects `validator.ValidationErrors` into a field-level details object:

```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed.",
  "details": [
    { "field": "phone", "rule": "len", "message": "phone must be exactly 10 characters" }
  ]
}
```

### Business Validation (service layer)

Business rules that require database state live in service methods and return typed errors:

```
Member phone uniqueness       → NewConflictError("MEMBER_PHONE_DUPLICATE", ...)        (409)
One active membership         → NewConflictError("MEMBERSHIP_ALREADY_ACTIVE", ...)     (409)
Duplicate attendance          → NewConflictError("ATTENDANCE_ALREADY_MARKED", ...)     (409)
Stock sufficiency             → NewBusinessRuleError("INVENTORY_INSUFFICIENT_STOCK", …)(422)
Plan must be ACTIVE to use    → NewBusinessRuleError("MEMBERSHIP_PLAN_INACTIVE", ...)  (422)
Lead already converted        → NewConflictError("LEAD_ALREADY_CONVERTED", ...)        (409)
Attendance settings check     → NewBusinessRuleError("ATTENDANCE_NOT_ALLOWED", ...)    (422)
```

Business validation runs **before** opening a transaction when the check is cheap and the operation might fail validation often. For checks that must be consistent with the write (one-active-membership, inventory stock), the check runs **inside** the transaction with the write — see the Concurrency section.

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

Implemented via the error middleware + `render.Error(w, err)` helper — see `06-backend-lld.md`.

### HTTP Status Reference

| Status | Meaning | When |
|---|---|---|
| `200` | OK | Successful GET, PATCH |
| `201` | Created | Successful POST (resource created) |
| `204` | No Content | Successful DELETE |
| `400` | Bad Request | Request validation failure (`@Valid`) |
| `401` | Unauthorized | Not authenticated |
| `403` | Forbidden | Authenticated but lacks permission |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Unique constraint / business state conflict |
| `422` | Unprocessable Entity | Business rule violation (not a conflict) |
| `500` | Internal Server Error | Unexpected server-side failure |

### Database Constraint Errors

When pgx returns a `*pgconn.PgError` (unique violation, FK violation, check violation), the repository or service inspects the code and maps it to a domain error:

```go
var pgErr *pgconn.PgError
if errors.As(err, &pgErr) {
    switch pgErr.Code {
    case "23505": // unique_violation
        switch pgErr.ConstraintName {
        case "uq_member_phone":
            return common.NewConflictError("MEMBER_PHONE_DUPLICATE",
                "A member with this phone number already exists.")
        case "uq_attendance_member_date":
            return common.NewConflictError("ATTENDANCE_ALREADY_MARKED",
                "Attendance has already been marked for this member on this date.")
        case "uq_membership_active_per_member":
            return common.NewConflictError("MEMBERSHIP_ALREADY_ACTIVE",
                "This member already has an active membership.")
        }
    case "23503": // foreign_key_violation
        return common.NewConflictError("REFERENCED_BY_OTHER_RECORDS",
            "This record is referenced by other records.")
    }
}
```

This mapping is centralised in a helper (`common/pgerr.go`) and called from repository methods that are known to collide with constraints.

---

## Logging

Logging uses the standard library `log/slog`. Prod uses `slog.NewJSONHandler(os.Stdout, ...)`; dev uses `slog.NewTextHandler(os.Stdout, ...)`. The handler is set globally via `slog.SetDefault(...)` during app startup.

### Request Logging

Chi's `middleware.RequestLogger` is wired with a custom `middleware.LogFormatter` that emits a structured slog record per request:

```
time=2026-09-30T10:15:32Z level=INFO msg="http request" method=POST path=/api/v1/attendance status=201 duration_ms=43 user_id=u003 request_id=01HK...
```

Fields: timestamp, level, msg, method, path, status, duration (ms), user_id (if authenticated), request_id.

Request bodies are **not** logged (may contain PII or passwords).

### Application Errors

Log all unhandled errors server-side via the error middleware before returning the 500 response:

```go
slog.ErrorContext(r.Context(), "unhandled error",
    slog.String("err", err.Error()),
    slog.String("path", r.URL.Path))
```

Stack traces are never returned to the client in production (`500` response contains only `INTERNAL_SERVER_ERROR` code + message). The chi `Recoverer` middleware captures panics with stack and logs them at ERROR.

### Business Events (INFO level)

```
level=INFO msg="membership created"  member_id=m001 plan_id=p002 end_date=2027-03-30
level=INFO msg="payment recorded"    payment_id=pay042 amount=1500 method=UPI
level=INFO msg="lead converted"      lead_id=l012 member_id=m089
```

Use `slog.InfoContext(ctx, "...", slog.String("...", ...))` so each line is structured. The request ID in context is included automatically by passing `ctx`.

### What NOT to log

- Passwords (plain-text or hashed)
- Session tokens or JWT values
- CSRF tokens
- Full request bodies containing sensitive PII
- Any field named `password`, `password_hash`, `token`, `secret`, `jwt`

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

- `common.AuditLog(ctx, tx, entry)` is called from within the service's `pgx.BeginTxFunc` block.
- The audit insert participates in the same transaction as the primary operation.
- If the primary operation returns an error, `BeginTxFunc` rolls back, and the audit record is also rolled back — maintaining consistency.
- For failed operations where there is no primary transaction (e.g., failed login), `common.AuditLogWithPool(ctx, pool, entry)` opens its own one-shot transaction.

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

Parsed by `common.ParsePageQuery(r)` which returns a typed struct and clamps `pageSize` to `[1, 100]`. In SQL, `OFFSET = (page - 1) * pageSize` and `LIMIT = pageSize`.

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

Implemented via a generic `PageResponse[T]` wrapper in `internal/common/pagination.go` using Go generics:

```go
type PageResponse[T any] struct {
    Data []T      `json:"data"`
    Meta PageMeta `json:"meta"`
}

type PageMeta struct {
    Page       int   `json:"page"`
    PageSize   int   `json:"pageSize"`
    Total      int64 `json:"total"`
    TotalPages int   `json:"totalPages"`
}

func NewPage[T any](data []T, page, pageSize int, total int64) PageResponse[T] {
    totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))
    return PageResponse[T]{
        Data: data,
        Meta: PageMeta{Page: page, PageSize: pageSize, Total: total, TotalPages: totalPages},
    }
}
```

Services call `common.NewPage(rows, q.Page, q.PageSize, total)` after fetching the page and a `SELECT COUNT(*)` for the same filters.

---

## Search

### Global Search

- `GET /api/v1/search?q=<query>`
- Minimum query length: 2 characters.
- Maximum 5 results per category.
- Case-insensitive.
- Permission-aware: only searches entities the caller has `view` permission for.

**Query approach:**

sqlc query file (`internal/db/queries/search.sql`):

```sql
-- name: SearchMembers :many
SELECT id, member_code, first_name, last_name, phone
FROM members
WHERE first_name ILIKE '%' || $1 || '%'
   OR last_name  ILIKE '%' || $1 || '%'
   OR phone      ILIKE '%' || $1 || '%'
   OR member_code ILIKE '%' || $1 || '%'
ORDER BY first_name
LIMIT 5;
```

The search service fires each permitted category query, aggregates the results, and returns a flat response grouped by category. All queries run against the same `pgxpool` without a transaction (they are read-only, each is atomic).

---

## Date and Time

### Timezone

All business logic operates in **`Asia/Kolkata` (IST, UTC+5:30)**.

Load the location once during app startup and pass it where needed:

```go
loc, err := time.LoadLocation("Asia/Kolkata")
if err != nil { return nil, err }
```

PostgreSQL stores timestamps in `TIMESTAMPTZ` (UTC on the wire). pgx converts to/from `time.Time` with the connection's timezone. For "today" comparisons in business queries, convert to IST explicitly:

```go
today := time.Now().In(loc)
```

Never use `time.Now()` without `.In(loc)` for date comparisons — the host timezone may differ from IST.

### Go Type Mapping

| Domain concept | Go type | DB column type |
|---|---|---|
| Date-only (membership dates, attendance) | `time.Time` (date part only) or `pgtype.Date` | `DATE` |
| Timestamp (createdAt, updatedAt, audit) | `time.Time` | `TIMESTAMPTZ` |
| Time-only (attendance window) | `string` ("HH:MM") | `VARCHAR(5)` |

pgx's `pgtype.Date` handles nullable DATE columns. For non-null date fields, sqlc generates `time.Time` with hours/minutes/seconds zeroed.

### "Today" in Queries

```go
today := time.Now().In(loc).Format("2006-01-02")
```

or compute via `pgtype.Date` and pass it as a parameter. In SQL queries, use `CURRENT_DATE AT TIME ZONE 'Asia/Kolkata'` when the comparison should be purely server-side.

---

## Money

### Currency

All monetary values are in **Indian Rupees (INR)**.

### Storage and representation

Monetary columns are `NUMERIC(10, 2)` in Postgres. pgx surfaces this as `pgtype.Numeric` in sqlc-generated structs. At the API boundary, convert to and from a string using `shopspring/decimal`:

```go
// Repository / service layer
amount := decimal.NewFromString(req.Amount) // request DTO Amount is a string like "1500.00"
// convert to pgtype.Numeric for the INSERT:
params.Amount = pgtype.Numeric{Int: amount.Coefficient(), Exp: amount.Exponent(), Valid: true}
```

**Rules:**
- Request DTOs carry `amount` as a `string` with `validate:"numeric,gt=0"`. Never a `float64`.
- Response DTOs render `amount` as a `string` with two decimal places (`"1500.00"`).
- Comparisons use `decimal.Decimal.Cmp(...)`, never `==`.
- Floating-point types (`float32`, `float64`) are never used for money.

Column definition:

```sql
amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0)
```

---

## Transactions

Rules for `pgx.BeginTxFunc` placement:

1. **Service layer only.** Not in handlers, not in repositories.
2. **Scope.** Open the transaction just before the first mutation and commit after the last — including the audit log write.
3. **Rollback.** `BeginTxFunc` rolls back automatically if the function returns a non-nil error, including an `*AppError` from business validation.
4. **No `REQUIRES_NEW`-style nesting.** If a service genuinely needs a side-effect that must commit even when the main transaction rolls back (e.g., audit record for a failed login), it writes outside the transaction via `AuditLogWithPool`.
5. **Context.** The transaction inherits the request context. If the client cancels, pgx cancels the transaction.

A read-only service method that issues one query does not need a transaction. A read method that issues multiple queries which must see a consistent snapshot uses `pgx.BeginTxFunc(ctx, pool, pgx.TxOptions{IsoLevel: pgx.RepeatableRead}, ...)`.

---

## Idempotency

| Operation | Risk | Mitigation |
|---|---|---|
| Mark attendance | Duplicate for same member+date | DB `UNIQUE(member_id, attendance_date)` → `409` |
| Create membership | Two active memberships | DB partial unique index + service check inside tx → `409` |
| Record payment | Double payment | **OPEN DECISION:** Accept optional `idempotencyKey`; not implemented in v1 |

---

## Concurrency

### Duplicate attendance

Two simultaneous attendance requests for the same member and date → the second INSERT fails on the `UNIQUE(member_id, attendance_date)` constraint. pgx returns `*pgconn.PgError{Code: "23505"}`; the error mapping produces `409 ATTENDANCE_ALREADY_MARKED`.

### Double membership creation

Two simultaneous membership creation requests → the partial unique index `UNIQUE(member_id) WHERE status='ACTIVE'` rejects the second INSERT. Maps to `409 MEMBERSHIP_ALREADY_ACTIVE`.

### Inventory stock race condition

Two concurrent STOCK_OUT requests could both pass the stock-sufficiency check before either updates. Prevention: use `SELECT ... FOR UPDATE` inside the transaction to serialise access to the row:

```sql
-- internal/db/queries/inventory.sql

-- name: GetItemForUpdate :one
SELECT id, current_stock, minimum_stock, status
FROM inventory_items
WHERE id = $1
FOR UPDATE;
```

Service flow:

```go
err := pgx.BeginTxFunc(ctx, s.pool, pgx.TxOptions{}, func(tx pgx.Tx) error {
    q := sqlc.New(tx)
    item, err := q.GetItemForUpdate(ctx, itemID)      // row-level lock held until commit
    if err != nil { return err }

    newStock := item.CurrentStock
    if req.Type == "STOCK_OUT" {
        newStock -= req.Quantity
        if newStock < 0 {
            return common.NewBusinessRuleError("INVENTORY_INSUFFICIENT_STOCK",
                "Insufficient stock for this transaction.")
        }
    } else {
        newStock += req.Quantity
    }
    // ... update item, insert transaction, audit, commit
    return nil
})
```

The row-level lock serialises concurrent updates on the same inventory item. A concurrent transaction waits on `FOR UPDATE` until the first commits, then reads the fresh `current_stock`.

---

## Testing Strategy

(Full testing strategy is detailed in `06-backend-lld.md`. Summary here for cross-cutting reference.)

| Test type | Tooling | Purpose |
|---|---|---|
| Unit | `testing` + `testify/require` | Service business rules, mappers, validators |
| Handler | `net/http/httptest` + stub service | Request validation, auth/authz, response shape |
| Integration | `testcontainers-go/modules/postgres` + real `goose up` schema | Full stack: handler → service → repository → PostgreSQL |

**Principle:** Every business rule in a service must have at least one unit test covering the happy path and the error path. Every DB constraint must have at least one integration test verifying it fires.

**Test isolation:** Integration tests use a fresh container per test package, or wrap each test in a transaction that is rolled back on completion. No test should depend on data left by a previous test.

---

## API Documentation

**OPEN DECISION:** Whether to adopt `swaggo/swag` for v1. The library parses Go comment annotations and generates OpenAPI JSON plus a Swagger UI. If adopted, annotations look like:

```go
// @Summary Create member
// @Tags members
// @Accept  json
// @Produce json
// @Param   request body CreateMemberRequest true "Member payload"
// @Success 201 {object} MemberDetailResponse
// @Failure 400 {object} apiError
// @Router  /members [post]
```

Recommendation: **skip for v1**. The frontend already consumes a hand-maintained contract in `05-api-design.md`. Adding `swag` adds a code-generation step without immediate value for a LAN system with one known client. Revisit after v1 ships.
