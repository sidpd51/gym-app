# Frontend Integration Guide

This document describes the frontend data architecture and the steps required to connect the application to a real backend.

---

## Data Flow Architecture

### Current (Mock Mode)

```
UI Component
     ↓
Feature Hook  (e.g. useMembers, usePayments)
     ↓
Repository    (e.g. memberRepository: MemberRepository)
     ↓
Mock Implementation  (reads in-memory mock data)
     ↓
data/*.mock.ts  (static fixture data)
```

### Future (API Mode)

```
UI Component
     ↓
Feature Hook  (unchanged)
     ↓
Repository    (same interface, different implementation)
     ↓
API Client    (src/lib/api/client.ts)
     ↓
Backend REST API
```

The UI and feature hooks do not change between mock and API mode. Only the repository implementation is swapped.

---

## Key Files

### Infrastructure

| File | Purpose |
|---|---|
| `src/lib/config/env.ts` | Centralized environment config — read all `import.meta.env` here |
| `src/lib/api/client.ts` | Fetch wrapper: `apiClient.get/post/put/patch/delete` |
| `src/lib/api/errors.ts` | `ApiError` class + `normalizeError(err)` |
| `src/lib/api/types.ts` | `PaginatedResponse<T>`, `PaginationMeta`, `ListQueryParams` |
| `src/lib/api/auth.ts` | `AuthTransport` interface — not yet implemented |

### Per-Domain Pattern

Each of the 16 feature domains follows this structure:

```
src/features/{domain}/
├── api/
│   └── {domain}.repository.ts   ← interface + mock implementation
├── hooks/
│   └── use{Domain}.ts            ← hook that calls the repository
├── types/
│   └── {domain}.types.ts         ← domain model (unchanged)
├── schemas/
│   └── {domain}.schema.ts        ← Zod validation (unchanged)
└── data/
    └── {domain}.mock.ts           ← fixture data (stays in place)
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes (production) | Base URL for the REST API, e.g. `http://localhost:3000` |

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

The env module (`src/lib/config/env.ts`) emits a console warning if `VITE_API_BASE_URL` is unset in production. In development it defaults to an empty string, which means API calls are relative-path only (not used in mock mode).

---

## API Client

Located at `src/lib/api/client.ts`. Wraps the native `fetch` API.

```ts
import { apiClient } from '@/lib/api'

// Usage (once repositories are connected)
const members = await apiClient.get<Member[]>('/members', { status: 'ACTIVE' })
const member  = await apiClient.get<Member>(`/members/${id}`)
const created = await apiClient.post<Member>('/members', payload)
const updated = await apiClient.put<Member>(`/members/${id}`, payload)
await apiClient.delete(`/members/${id}`)
```

All methods throw `ApiError` on HTTP errors or network failure.

---

## Error Handling

All API errors are normalized to `ApiError` (from `src/lib/api/errors.ts`):

```ts
interface ApiErrorData {
  status: number   // HTTP status, or 0 for network errors
  code?: string    // backend error code (e.g. "MEMBER_NOT_FOUND")
  message: string
  details?: unknown
}
```

Convenience getters: `isNotFound`, `isUnauthorized`, `isForbidden`, `isValidationError`, `isConflict`, `isServerError`.

Use `normalizeError(err)` to safely convert any caught value to `ApiError`.

---

## Authentication

### Current State

Authentication is entirely in-memory (mock). The `AuthContext` (`src/features/auth/context/AuthContext.tsx`) simulates login/logout using hardcoded credentials in `src/features/auth/data/auth.mock.ts`. No HTTP calls are made.

### Future Integration

An `AuthTransport` interface is defined at `src/lib/api/auth.ts`:

```ts
interface AuthTransport {
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
  getCurrentUserId(): Promise<string | null>
  refreshSession(): Promise<void>
}
```

**NOTE:** The backend authentication mechanism is not yet decided. Do not assume token storage strategy until confirmed:
- If the backend uses **HTTP-only cookies**, no token storage code is needed on the frontend.
- If the backend uses **JWT in response body**, token storage logic must be added.

When the backend is ready, implement `AuthTransport`, wire it into `AuthContext`, and replace the mock credential check with a real HTTP call.

---

## Pagination Convention

The following types are defined at `src/lib/api/types.ts` and represent the **proposed** frontend expectation. Confirm with the backend before finalizing.

```ts
interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}
```

List query parameters:

```ts
interface ListQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  fromDate?: string
  toDate?: string
  [key: string]: string | number | boolean | undefined
}
```

Currently, all filtering and pagination is done client-side inside page components. When list endpoints are integrated, server-side filtering replaces the client-side `useMemo` filter logic, and the repository `list()` method accepts `ListQueryParams`.

---

## Date and Currency Conventions

Located at `src/lib/format.ts`.

| Value type | Format | Example |
|---|---|---|
| Date-only | `YYYY-MM-DD` (stored) / `DD MMM YYYY` (displayed) | `2026-09-27` → `27 Sep 2026` |
| Date-time | ISO 8601 (`YYYY-MM-DDTHH:MM`) | `2026-09-27T14:30` |
| Currency | INR, formatted with `₹` prefix | `₹1,500` |

All date-only values are stored as `string` in `YYYY-MM-DD` format. Use `formatDate(str)` and `formatDateTime(str)` for display. Use `formatCurrency(amount)` for INR amounts.

When sending dates to the API, send them as `YYYY-MM-DD` strings. Confirm with the backend if ISO 8601 date-times should include timezone offset.

---

## Replacing a Mock Repository with an API Repository

When the backend exposes an endpoint (e.g. `GET /members`):

1. Create `src/features/members/api/members.api-repository.ts`:

```ts
import { apiClient } from '@/lib/api'
import type { Member } from '../types/member.types'
import type { MemberRepository } from './members.repository'

export const apiMemberRepository: MemberRepository = {
  list: () => apiClient.get<Member[]>('/members'),
  getById: (id) => apiClient.get<Member | undefined>(`/members/${id}`),
  getSupplementalData: (memberId) =>
    apiClient.get(`/members/${memberId}/details`),
}
```

2. In `src/features/members/api/members.repository.ts`, swap the export:

```ts
// Change this line:
export const memberRepository: MemberRepository = mockMemberRepository
// To:
export const memberRepository: MemberRepository = apiMemberRepository
```

3. Update hooks to handle async (`Promise<T>`) and integrate with TanStack Query:

```ts
import { useQuery } from '@tanstack/react-query'
import { memberRepository } from '../api/members.repository'

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: () => memberRepository.list(),
  })
}
```

4. Update page components to handle `isLoading` and `isError` states.

The UI already has `EmptyState` and `ConfirmDialog` shared components. Add skeleton loaders and error boundaries as needed.

---

## Mutation Conventions (Future)

For create/update/delete operations, use TanStack Query mutations:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateMemberInput) => memberRepository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  })
}
```

Currently, form submissions log to console and show a success state. They do not persist data. Connect mutations when repositories are API-backed.

---

## Integration Checklist

Use this checklist when the backend is ready.

### Foundation
- [ ] Confirm `VITE_API_BASE_URL` with the backend team
- [ ] Confirm authentication transport (HTTP-only cookies vs. JWT in body)
- [ ] Confirm API error response shape (`{ status, code, message, details }`)
- [ ] Confirm pagination response shape (`{ data, meta }`)
- [ ] Confirm date serialization format (date-only vs. ISO 8601)
- [ ] Confirm currency: amounts as integers (paise) or floats (rupees)?

### Authentication
- [ ] Implement `AuthTransport` interface
- [ ] Wire real login into `AuthContext`
- [ ] Wire real logout into `AuthContext`
- [ ] Handle session expiry / 401 responses in `apiClient`
- [ ] Handle token refresh if applicable

### Domain Repositories (replace mock → API)
- [ ] Members
- [ ] Membership Plans
- [ ] Memberships
- [ ] Payments
- [ ] Attendance
- [ ] Trainers
- [ ] Leads
- [ ] Expenses (+ Expense Categories)
- [ ] Inventory (+ Inventory Categories + Transactions)
- [ ] Equipment (+ Equipment Categories + Maintenance)
- [ ] Notifications
- [ ] Users
- [ ] Dashboard
- [ ] Settings
- [ ] Audit Logs
- [ ] Member–Trainer Assignments

### Hooks & Query Integration
- [ ] Convert synchronous hooks to TanStack Query `useQuery`
- [ ] Add `isLoading` / `isError` handling in page components
- [ ] Add TanStack Query mutations for all create/update/delete flows
- [ ] Set up query key factories for cache invalidation

### Forms
- [ ] Connect CreateMemberPage form submission
- [ ] Connect EditMembership / CreateMembership form submission
- [ ] Connect CreateMembershipPlan / EditMembershipPlan
- [ ] Connect RecordPayment
- [ ] Connect MarkAttendance
- [ ] Connect CreateTrainer / EditTrainer
- [ ] Connect CreateLead / EditLead
- [ ] Connect CreateExpense / EditExpense
- [ ] Connect CreateInventoryItem / EditInventoryItem
- [ ] Connect CreateEquipment / EditEquipment / AddMaintenance
- [ ] Connect CreateUser / EditUser
- [ ] Connect Settings save

### Final
- [ ] Remove all `data/*.mock.ts` files (or keep as test fixtures)
- [ ] Audit `console.log` stubs left in form submission handlers
- [ ] Add real-time or polling for dashboard/notifications if required
