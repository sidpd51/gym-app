# 07 — Authentication & Security

## Fastify Security Overview

Authentication and authorization are implemented using Fastify's plugin ecosystem:

- `@fastify/jwt` — signs and verifies JWTs.
- `@fastify/cookie` — parses/sets cookies, including signed ones.
- `@fastify/csrf-protection` — CSRF tokens, required because the JWT is delivered via cookie.
- Custom `requireAuth` and `requirePermission` decorators (defined in `plugins/auth.ts`) are attached to routes via Fastify's `preHandler` hook.

There is no filter chain in the Spring sense. Fastify's lifecycle is a linear series of hooks (`onRequest` → `preParsing` → `preValidation` → `preHandler` → handler → `onSend`); authentication and authorization are both `preHandler` hooks that run after schema validation.

---

## Authentication Transport

**Decision: signed JWT delivered via httpOnly, SameSite=Strict cookie.**

This combines the operational feel of a session (no token in client code; the browser carries it automatically) with the stateless validation properties of a JWT (no server-side session store to maintain).

| Property | Value |
|---|---|
| Token type | JWT, signed with HS256 and `JWT_SECRET` (≥64 random chars) |
| Transport | `Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=<ttl>` |
| Payload | `{ sub: userId, role: UserRole, iat, exp }` — minimal; no PII |
| Verification | `req.jwtVerify({ onlyCookie: true })` on every protected route via `requireAuth` preHandler |
| Logout | `Set-Cookie: token=; Max-Age=0` (clears the cookie); audit log written |
| CSRF | `@fastify/csrf-protection` — required because the auth cookie is sent automatically on same-origin requests |

**Why not `Authorization: Bearer`?** The frontend would need to store the token in `localStorage` (XSS-exposed) or in-memory (lost on refresh). A `HttpOnly` cookie is strictly safer for a browser-only client.

**Why not server-side session?** Would require a session store (Redis or a `sessions` table) with no real benefit at this scale. A short-lived JWT is simpler.

Session TTL is still **[OPEN DECISION]** — 8 hours (one shift) vs 24 hours (one day). Default is 8 hours; see `10-backend-development-plan.md`.

---

### Login Flow

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant R as /auth/login route handler
    participant S as authService
    participant UR as userRepository
    participant BC as @node-rs/bcrypt
    participant JWT as @fastify/jwt
    participant DB as Database
    participant A as auditLog

    FE->>R: POST /api/v1/auth/login {email, password}
    R->>S: login(email, password)
    S->>UR: findByEmail(email)
    UR->>DB: SELECT ... FROM users WHERE email = $1
    DB-->>UR: user row (or null)
    alt user not found
        S->>A: auditLog(sql, { LOGIN, FAILED })
        S-->>R: throw AuthInvalidCredentialsError
        R-->>FE: 401 AUTH_INVALID_CREDENTIALS
    else user found
        S->>BC: verify(rawPassword, hash)
        alt password mismatch
            S->>A: auditLog(sql, { LOGIN, FAILED })
            S-->>R: throw AuthInvalidCredentialsError
            R-->>FE: 401 AUTH_INVALID_CREDENTIALS
        else user INACTIVE
            S->>A: auditLog(sql, { LOGIN, FAILED })
            S-->>R: throw AuthAccountInactiveError
            R-->>FE: 403 AUTH_ACCOUNT_INACTIVE
        else valid
            S->>UR: updateLastLoginAt(userId)
            S->>A: auditLog(sql, { LOGIN, SUCCESS })
            S->>JWT: app.jwt.sign({ sub, role }, { expiresIn: '8h' })
            S-->>R: { user, token }
            R-->>FE: 200 {user} + Set-Cookie: token=<jwt>; HttpOnly; SameSite=Strict
        end
    end
```

### Logout

- `POST /api/v1/auth/logout`
- Clears the auth cookie (`reply.clearCookie('token', { path: '/' })`).
- Audit log written (`LOGOUT`, `SUCCESS`).
- No server-side token revocation list — the JWT is already short-lived.

### Current User

- `GET /api/v1/auth/me`
- `requireAuth` preHandler populates `req.user = { id, role }` from the verified JWT.
- Handler reads the user row from the DB and returns the profile (never `passwordHash`).

---

## Auth Plugin Configuration

### Plugin Registration

```ts
// plugins/auth.ts
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { hasPermission, type Permission } from '../common/permissions.js';

export const authPlugin: FastifyPluginAsync = fp(async (app) => {
  await app.register(fastifyCookie, { secret: app.config.COOKIE_SECRET });
  await app.register(fastifyJwt, {
    secret: app.config.JWT_SECRET,
    cookie: { cookieName: 'token', signed: false },
    sign: { expiresIn: `${app.config.SESSION_TTL_HOURS}h` },
  });

  app.decorate('requireAuth', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify({ onlyCookie: true });
    } catch {
      reply.code(401).send({
        status: 401,
        code: 'UNAUTHENTICATED',
        message: 'Authentication required.',
      });
    }
  });

  app.decorate('requirePermission', (perm: Permission) =>
    async (req: FastifyRequest, reply: FastifyReply) => {
      const role = req.user.role;
      if (!hasPermission(role, perm)) {
        reply.code(403).send({
          status: 403,
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action.',
        });
      }
    }
  );
});
```

`req.user` is typed via a `fastify.d.ts` module augmentation:

```ts
// common/types.ts
import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: UserRole };
    user: { id: string; role: UserRole };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requirePermission: (perm: Permission) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
```

### User Lookup

A `userRepository.findByEmail(email)` function fetches the user row (including `password_hash`) for the login flow. The hash never leaves the service layer — it is compared with `@node-rs/bcrypt`'s `verify` and discarded.

```ts
// modules/user/repository.ts
export async function findByEmail(sql: Sql, email: string): Promise<UserRow | undefined> {
  const [row] = await sql`
    SELECT id, email, password_hash, role, status, user_code,
           first_name, last_name, last_login_at
    FROM users
    WHERE email = ${email}
  `;
  return row;
}
```

---

## Authorization

### Role-Based Permission Model

The frontend defines four roles (`OWNER`, `ADMIN`, `RECEPTIONIST`, `TRAINER`) and 40+ specific permissions (e.g., `members:create`, `payments:record`). The backend mirrors this model.

**Implementation:**

A static role → permissions map lives in `common/permissions.ts`. The `requirePermission(perm)` decorator looks up the current user's role (`req.user.role`) and checks whether the requested permission is in that role's set:

```ts
// common/permissions.ts
export type Permission =
  | 'members:view' | 'members:create' | 'members:edit' | 'members:delete'
  // ... (full list below)
  ;

const PERMS: Record<UserRole, ReadonlySet<Permission>> = {
  OWNER:        new Set([/* all permissions */]),
  ADMIN:        new Set([/* ... */]),
  RECEPTIONIST: new Set([/* ... */]),
  TRAINER:      new Set([/* ... */]),
};

export function hasPermission(role: UserRole, perm: Permission): boolean {
  return PERMS[role].has(perm);
}
```

The exact mapping mirrors `frontend/src/features/auth/permissions/permissions.ts` and must be kept in sync.

### Route-Level Authorization

```ts
// modules/member/routes.ts (illustrative — see 06 for a full example)

app.post('/', {
  schema: { body: CreateMemberRequest, response: { 201: MemberResponse } },
  preHandler: [app.requireAuth, app.requirePermission('members:create')],
}, async (req, reply) => { ... });

app.delete('/:id', {
  schema: { params: Type.Object({ id: Type.String({ format: 'uuid' }) }) },
  preHandler: [app.requireAuth, app.requirePermission('members:delete')],
}, async (req, reply) => { ... });

app.patch('/settings', {
  schema: { body: UpdateSettingsRequest, response: { 200: GymSettingsResponse } },
  preHandler: [app.requireAuth, app.requirePermission('settings:edit')],
}, async (req, reply) => { ... });
```

Both preHandlers run in order: `requireAuth` first (401 if no valid cookie), then `requirePermission` (403 if role lacks the permission). Only if both pass does the handler execute.

### Permission Loading

Because permissions are statically derived from the role, there is nothing to "load at login" — the JWT payload carries the role, and `hasPermission(role, perm)` resolves against the static map in O(1). This also means a user's effective permissions change immediately if the role → permissions map is updated and the service is restarted.

### Authorization Principle

```
Frontend permission check → UX (hides buttons, blocks navigation)
Backend preHandler check  → actual security boundary
```

The backend does not trust that the frontend has correctly enforced permissions. Every protected endpoint verifies authorization server-side before any database operation.

---

## Full Permission Matrix

```
Permission                   OWNER   ADMIN   RECEPTIONIST   TRAINER
─────────────────────────────────────────────────────────────────────
dashboard:view                 ✓       ✓           ✓           ✓
members:view                   ✓       ✓           ✓           ✓
members:create                 ✓       ✓           ✓
members:edit                   ✓       ✓           ✓
members:delete                 ✓       ✓
memberships:view               ✓       ✓           ✓           ✓
memberships:create             ✓       ✓           ✓
membership-plans:view          ✓       ✓           ✓
membership-plans:create        ✓       ✓
membership-plans:edit          ✓       ✓
membership-plans:delete        ✓       ✓
attendance:view                ✓       ✓           ✓           ✓
attendance:mark                ✓       ✓           ✓           ✓
payments:view                  ✓       ✓           ✓
payments:record                ✓       ✓           ✓
trainers:view                  ✓       ✓           ✓           ✓
trainers:create                ✓       ✓
trainers:edit                  ✓       ✓
trainers:delete                ✓       ✓
leads:view                     ✓       ✓           ✓
leads:create                   ✓       ✓           ✓
leads:edit                     ✓       ✓           ✓
leads:delete                   ✓       ✓
expenses:view                  ✓       ✓
expenses:create                ✓       ✓
expenses:edit                  ✓       ✓
expenses:delete                ✓       ✓
inventory:view                 ✓       ✓           ✓
inventory:create               ✓       ✓
inventory:edit                 ✓       ✓
inventory:delete               ✓       ✓
equipment:view                 ✓       ✓
equipment:create               ✓       ✓
equipment:edit                 ✓       ✓
equipment:delete               ✓       ✓
equipment:maintenance          ✓       ✓
reports:view                   ✓       ✓
users:view                     ✓       ✓
users:create                   ✓       ✓
users:edit                     ✓       ✓
users:delete                   ✓
settings:view                  ✓       ✓
settings:edit                  ✓
notifications:view             ✓       ✓           ✓           ✓
notifications:create           ✓       ✓           ✓
audit-logs:view                ✓       ✓
profile:view                   ✓       ✓           ✓           ✓
profile:update                 ✓       ✓           ✓           ✓
```

---

## Security Controls

### Password Hashing

```ts
import bcrypt from '@node-rs/bcrypt';

const COST_FACTOR = 12;

export async function hashPassword(raw: string): Promise<string> {
  return bcrypt.hash(raw, COST_FACTOR);
}

export async function verifyPassword(raw: string, hash: string): Promise<boolean> {
  return bcrypt.verify(raw, hash);
}
```

- All passwords are stored as bcrypt hashes.
- The raw password never appears in logs, responses, or audit records.
- Mock plain-text passwords in `auth.mock.ts` must never reach production.
- `@node-rs/bcrypt` is a native Rust implementation — significantly faster than pure-JS alternatives, which matters because bcrypt is intentionally slow.

### Input Validation

Request bodies, query strings, and path params are validated against TypeBox schemas registered on the route (`body`, `querystring`, `params`). Fastify runs validation during the `preValidation` phase. Invalid requests return `400 Bad Request` before reaching the handler — the service is never called. See `06-backend-lld.md` and `08-cross-cutting-concerns.md` for full validation details.

### SQL Injection Protection

The `postgres` driver uses parameterized queries by default — tagged template literals bind values as parameters, never concatenating into SQL text. Any attempt to interpolate a raw string into SQL would be a type error (the driver's `.unsafe()` escape hatch exists but should be lint-forbidden).

### Rate Limiting

Apply rate limiting on `POST /api/v1/auth/login` using `@fastify/rate-limit`:

```ts
// plugins/rate-limit.ts
await app.register(fastifyRateLimit, {
  max: 5,                 // 5 attempts
  timeWindow: '1 minute', // per IP per minute
  allowList: [],
  skipOnError: false,
});

// On the login route specifically:
app.post('/login', {
  config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  schema: { body: LoginRequest, response: { 200: AuthUserResponse } },
}, loginHandler);
```

The limit is low because this is a LAN system — 5 attempts per minute per IP is more than enough for legitimate use and well below brute-force rates.

### CORS

`@fastify/cors` is configured to allow only the frontend origin, and `credentials: true` so cookies are accepted on cross-origin requests (relevant only if the frontend is served from a different origin than the API — typically not the case in LAN deployment where Fastify serves the SPA on the same port):

```ts
// plugins/cors.ts
await app.register(fastifyCors, {
  origin: app.config.FRONTEND_ORIGIN,  // single string, exact match
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
});
```

### CSRF

Because the auth JWT is delivered via cookie, the backend is vulnerable to CSRF without additional protection. `@fastify/csrf-protection` is registered globally:

- `GET /api/v1/auth/csrf-token` returns a CSRF token (and sets a double-submit cookie).
- All state-changing requests (`POST`, `PATCH`, `PUT`, `DELETE`) must include the token in a header (`X-CSRF-Token`).
- The frontend `apiClient` reads the token from the cookie set by the server and attaches it to the header on each request.

### Secrets Management

All secrets (`JWT_SECRET`, `COOKIE_SECRET`, `DB_PASSWORD`) are provided via environment variables and loaded through `env-schema`, which validates types and required-ness at startup. No secrets in source code or committed config files. Missing or malformed secrets cause the app to fail-fast at boot rather than at the first request.

### Sensitive Data in Responses

- The `password_hash` column must **never** appear in any API response. The response TypeBox schemas don't include it; Fastify's response validation strips any accidental extra fields.
- `MemberListItemResponse` must not expose sensitive fields (emergency contact details, address) in list endpoints — only in the detail endpoint.

### HTTPS

**OPEN DECISION:** Whether to configure HTTPS on LAN (self-signed certificate or local CA). Even on LAN, HTTPS prevents credential interception from any device on the network (coffee-shop WiFi scenario does not apply, but a compromised laptop on the same LAN does). Fastify accepts an `https` option on the listener with `key` and `cert`:

```ts
const app = Fastify({
  https: {
    key: fs.readFileSync('/etc/gym-app/certs/key.pem'),
    cert: fs.readFileSync('/etc/gym-app/certs/cert.pem'),
  },
});
```

Recommended: self-signed cert installed on each staff machine's trust store.

### Audit Log Write Protection

The application's database role should not have `DELETE` privilege on the `audit_logs` table. This is an additional defense layer (application-level logic already forbids deletes, but DB-level enforcement is stronger):

```sql
REVOKE DELETE ON audit_logs FROM gymapp;
```

---

## Authentication Integration Contract (for Frontend)

The `AuthTransport` interface in `src/lib/api/auth.ts` must be implemented to call the real backend. The interface methods map to:

| Method | Backend endpoint |
|---|---|
| `login(email, password)` | `POST /api/v1/auth/login` → sets httpOnly cookie |
| `logout()` | `POST /api/v1/auth/logout` → clears cookie |
| `getCurrentUserId()` | `GET /api/v1/auth/me` |
| `refreshSession()` | Not implemented in v1; staff re-login after cookie expiry |

The `apiClient` in `src/lib/api/client.ts` must be updated to:
- Send cookies automatically on same-origin requests (`credentials: 'include'` in `fetch`, if cross-origin).
- Send `X-CSRF-Token` header on all state-changing requests, read from the CSRF cookie.
- Intercept `401` responses to trigger logout/redirect to login page.
