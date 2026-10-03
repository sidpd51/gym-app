# 08 — Cross-Cutting Concerns

## Validation

### Three-Layer Validation

| Layer | What it catches | How |
|---|---|---|
| **Request validation** (API boundary) | Missing fields, wrong types, format violations (phone regex, email format, `amount > 0`) | Jakarta Bean Validation annotations on DTOs + `@Valid` in controller |
| **Business validation** (Service layer) | Rules requiring DB state (duplicate phone, active membership already exists, negative stock) | Service-layer checks before mutations |
| **Database constraints** | Last-resort guard: UNIQUE, NOT NULL, CHECK, FK | Hibernate maps `DataIntegrityViolationException`; handled by `GlobalExceptionHandler` |

All three layers must be present. Never rely on only one.

### Request Validation Annotations

Common Jakarta annotations used in request DTOs:

```java
@NotNull              // field must not be null
@NotBlank             // string must not be null, empty, or whitespace
@NotEmpty             // collection/string must not be null or empty
@Size(min=2, max=50)  // string or collection size bounds
@Email                // email format
@Pattern(regexp=...)  // custom regex (phone, codes, etc.)
@Positive             // number > 0
@PositiveOrZero       // number >= 0
@Min(1) / @Max(...)   // numeric bounds
@Past / @PastOrPresent // date in the past
@Future / @FutureOrPresent // date in future
```

Validation errors produce `400 Bad Request` via `MethodArgumentNotValidException` handled by `@RestControllerAdvice`.

### Business Validation (Service layer)

Business rules that require database state live in service methods and throw domain exceptions:

```
Member phone uniqueness       → MemberPhoneDuplicateException (409)
One active membership         → MembershipAlreadyActiveException (409)
Duplicate attendance          → AttendanceAlreadyMarkedException (409)
Stock sufficiency             → InsufficientStockException (422)
Plan must be ACTIVE to use    → BusinessRuleException (422)
Lead already converted        → LeadAlreadyConvertedException (409)
Attendance settings check     → AttendanceNotAllowedException (422)
```

Business validation runs **before** any mutation. If validation fails, the transaction is not started.

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

Implemented via `@RestControllerAdvice` — see `GlobalExceptionHandler` in `06-backend-lld.md`.

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

### Database Constraint Exceptions

When Hibernate throws `DataIntegrityViolationException` (from a DB constraint violation), the `GlobalExceptionHandler` catches it and maps it to a domain-appropriate error:

```java
@ExceptionHandler(DataIntegrityViolationException.class)
public ResponseEntity<ApiError> handleDataIntegrity(DataIntegrityViolationException ex) {
    // inspect constraint name from SQL state and map to domain error
    // e.g., "uq_member_phone" → 409 MEMBER_PHONE_DUPLICATE
}
```

---

## Logging

### Request Logging

Log every incoming request using a servlet filter or Spring Boot's `CommonsRequestLoggingFilter`:

```
2026-09-30T10:15:32Z  POST  /api/v1/attendance  201  43ms  userId=u003
```

Fields: timestamp, method, path, status, duration, userId (if authenticated).

Request bodies are **not** logged (may contain PII or passwords).

### Application Errors

Log all unhandled exceptions server-side with full stack trace. Use SLF4J + Logback (Spring Boot default):

```java
log.error("Unexpected error processing request", ex);
```

Stack traces are never returned to the client in production (`500` response contains only `INTERNAL_SERVER_ERROR` code + message).

### Business Events (INFO level)

```
INFO  MembershipService  - Membership created: memberId=m001 planId=p002 endDate=2027-03-30
INFO  PaymentService     - Payment recorded: paymentId=pay042 amount=1500 method=UPI
INFO  LeadService        - Lead converted: leadId=l012 → memberId=m089
```

### What NOT to log

- Passwords (plain-text or hashed)
- Session tokens or JWT values
- Full request bodies containing sensitive PII
- Any field named `password`, `passwordHash`, `token`, `secret`

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

- `AuditService.log(...)` is called from within the `@Transactional` service method.
- The audit log write participates in the same transaction as the primary operation.
- If the primary operation is rolled back, the audit record is also rolled back — maintaining consistency.
- For failed operations (e.g., failed login), the audit record is written in a separate non-transactional call (since there is no primary transaction to join).

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

In Spring Data JPA, `page=1` maps to `PageRequest.of(page - 1, pageSize)` (Spring's Pageable is 0-based).

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

Implemented via a generic `PageResponse<T>` wrapper class in `common/pagination/`.

```java
public record PageResponse<T>(
    List<T> data,
    PageMeta meta
) {}

public record PageMeta(
    int page,
    int pageSize,
    long total,
    int totalPages
) {}
```

Constructed from Spring's `Page<T>` object:
```java
new PageResponse<>(page.getContent(), new PageMeta(page.getNumber() + 1, page.getSize(), page.getTotalElements(), page.getTotalPages()))
```

---

## Search

### Global Search

- `GET /api/v1/search?q=<query>`
- Minimum query length: 2 characters.
- Maximum 5 results per category.
- Case-insensitive.
- Permission-aware: only searches entities the caller has `view` permission for.

**Spring Data JPA query approach:**

```java
// In MemberRepository
@Query("SELECT m FROM Member m WHERE LOWER(m.firstName) LIKE LOWER(CONCAT('%', :q, '%')) OR ...")
List<Member> search(@Param("q") String query, Pageable pageable);
```

For PostgreSQL, use `ILIKE` via native query for better readability:

```java
@Query(value = "SELECT * FROM members WHERE first_name ILIKE '%' || :q || '%' ...", nativeQuery = true)
```

---

## Date and Time

### Timezone

All business logic operates in **`Asia/Kolkata` (IST, UTC+5:30)**.

Spring configuration:
```properties
spring.jpa.properties.hibernate.jdbc.time_zone=UTC
```

Application-level: always convert "today" comparisons to IST using `ZoneId.of("Asia/Kolkata")`.

### Java Type Mapping

| Domain concept | Java type | JPA column type |
|---|---|---|
| Date-only (membership dates, attendance) | `LocalDate` | `DATE` |
| Timestamp (createdAt, updatedAt, audit) | `Instant` | `TIMESTAMPTZ` |
| Time-only (attendance window) | `String` (HH:MM) or `LocalTime` | `VARCHAR(5)` |

`LocalDate` maps naturally to SQL `DATE` with Hibernate. `Instant` maps to `TIMESTAMPTZ` (UTC).

### "Today" in Queries

```java
LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
```

Never use `LocalDate.now()` without a timezone — the JVM default timezone may differ from IST.

---

## Money

### Currency

All monetary values are in **Indian Rupees (INR)**.

**OPEN DECISION:** Storage representation.

| Option | Java type | DB type | Notes |
|---|---|---|---|
| **DECIMAL(10,2) — rupees** (recommended) | `BigDecimal` | `DECIMAL(10,2)` | Readable, no conversion, Hibernate handles it natively |
| Integer (paise) | `Long` | `BIGINT` | Avoids floating-point risk, but requires conversion everywhere |

Recommendation: `BigDecimal` with `DECIMAL(10,2)` — Hibernate maps this precisely; use `BigDecimal.compareTo` (not `equals`) for comparisons.

**Never use `double` or `float` for monetary values.** Floating-point types cannot represent all decimal values precisely.

```java
@Column(precision = 10, scale = 2)
private BigDecimal amount;
```

---

## Transactions

`@Transactional` placement rules:

1. **Service layer only.** Not on controllers, not on repositories.
2. **Read-only optimization.** Add `@Transactional(readOnly = true)` on read-only service methods — Hibernate optimizes flush/dirty checking.
3. **Default propagation.** `REQUIRED` (the default) is correct for all cases in this system. Do not use `REQUIRES_NEW` unless there is a specific isolation reason.
4. **Rollback.** Spring automatically rolls back on any `RuntimeException`. Domain exceptions extend `RuntimeException`, so they trigger rollback correctly.

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

Two simultaneous attendance requests for the same member and date → the second INSERT fails on the `UNIQUE(member_id, attendance_date)` constraint. Hibernate throws `DataIntegrityViolationException`; `GlobalExceptionHandler` maps it to `409 ATTENDANCE_ALREADY_MARKED`.

### Double membership creation

Two simultaneous membership creation requests → the partial unique index `UNIQUE(member_id) WHERE status='ACTIVE'` rejects the second INSERT. Maps to `409 MEMBERSHIP_ALREADY_ACTIVE`.

### Inventory stock race condition

Two concurrent STOCK_OUT requests could both pass the stock-sufficiency check before either updates. Prevention: use `SELECT FOR UPDATE` (pessimistic lock) in `InventoryRepository`:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT i FROM InventoryItem i WHERE i.id = :id")
Optional<InventoryItem> findByIdWithLock(@Param("id") UUID id);
```

This serializes concurrent updates on the same inventory item.

---

## Testing Strategy

(Full Spring Boot testing strategy is detailed in `06-backend-lld.md`. Summary here for cross-cutting reference.)

| Test type | Spring annotation | Purpose |
|---|---|---|
| Unit | None (pure JUnit + Mockito) | Service business rules, validators, mappers |
| Repository | `@DataJpaTest` | JPA queries, constraints, DB behavior |
| Controller | `@WebMvcTest` | Request validation, auth/authz, response shape |
| Integration | `@SpringBootTest` | Full stack: controller → service → DB |

**Principle:** Every business rule in a service must have at least one unit test covering the happy path and the error path. Every DB constraint must have at least one `@DataJpaTest` test verifying it fires.

**Test isolation:** `@DataJpaTest` and `@SpringBootTest` tests are annotated `@Transactional` so each test rolls back on completion. No test should depend on data left by a previous test.

---

## API Documentation

Propose adding **Springdoc OpenAPI** for automatic Swagger UI generation:

```xml
<!-- Maven dependency (proposed — not yet added) -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.x.x</version>
</dependency>
```

Swagger UI would be available at `/swagger-ui.html` for development and internal review. Disable in production if not needed.

Endpoints and DTOs are annotated with `@Operation`, `@Parameter`, `@Schema` during implementation. Do not add these before the implementation phase.
