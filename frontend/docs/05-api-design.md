# 05 — API Design

## Conventions

- Base path: `/api/v1`
- All responses: `Content-Type: application/json`
- All authenticated endpoints require a valid session (cookie or `Authorization: Bearer <token>`).
- Unauthorized → `401`; Forbidden → `403`; Not found → `404`; Validation error → `400`; Business rule violation → `409` or `422`.

### Standard list response

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

### Standard error response

```json
{
  "status": 422,
  "code": "MEMBER_PHONE_DUPLICATE",
  "message": "A member with this phone number already exists.",
  "details": { "field": "phone" }
}
```

---

## Authentication

### `POST /api/v1/auth/login`

Permission: none (public)

Request:
```json
{ "email": "arjun.mehta@fitzone.example", "password": "..." }
```

Response `200`:
```json
{
  "user": {
    "id": "u001",
    "userCode": "USR-001",
    "firstName": "Arjun",
    "lastName": "Mehta",
    "email": "arjun.mehta@fitzone.example",
    "role": "OWNER",
    "status": "ACTIVE"
  }
}
```

Errors: `401 AUTH_INVALID_CREDENTIALS`, `403 AUTH_ACCOUNT_INACTIVE`

---

### `POST /api/v1/auth/logout`

Permission: authenticated

Response `200`: `{ "ok": true }`

---

### `GET /api/v1/auth/me`

Permission: authenticated

Response `200`:
```json
{
  "id": "u001",
  "userCode": "USR-001",
  "firstName": "Arjun",
  "lastName": "Mehta",
  "email": "arjun.mehta@fitzone.example",
  "phone": "9876543210",
  "role": "OWNER",
  "status": "ACTIVE",
  "lastLoginAt": "2026-09-30T09:00:00Z",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

### `PATCH /api/v1/auth/profile`

Permission: `profile:update`

Request:
```json
{ "firstName": "Arjun", "lastName": "Mehta", "phone": "9876543210" }
```

Response `200`: Updated user object (same shape as `GET /auth/me`)

---

## Users

### `GET /api/v1/users`

Permission: `users:view`

Query params: `page`, `pageSize`, `search`, `role`, `status`

Response `200`: Paginated list of users (no `passwordHash`)

---

### `GET /api/v1/users/:id`

Permission: `users:view`

Response `200`: Single user object

---

### `POST /api/v1/users`

Permission: `users:create`

Request:
```json
{
  "firstName": "Sneha",
  "lastName": "Desai",
  "email": "sneha@fitzone.example",
  "phone": "9876500001",
  "role": "ADMIN",
  "status": "ACTIVE",
  "password": "initialPassword123"
}
```

Response `201`: Created user object

Errors: `409 CONFLICT` (email already exists)

---

### `PATCH /api/v1/users/:id`

Permission: `users:edit`

Request: Partial — any of `firstName`, `lastName`, `phone`, `role`, `status`

Response `200`: Updated user object

---

### `DELETE /api/v1/users/:id`

Permission: `users:delete` (OWNER only)

Response `204`

Errors: `409 CONFLICT` if deleting would violate FK constraints (audit logs exist)

---

## Members

### `GET /api/v1/members`

Permission: `members:view`

Query params: `page`, `pageSize`, `search` (name, memberCode, phone), `status`

Response `200`:
```json
{
  "data": [
    {
      "id": "m001",
      "memberCode": "MEM-001",
      "firstName": "Rahul",
      "lastName": "Verma",
      "phone": "9876543211",
      "email": "rahul@example.com",
      "status": "ACTIVE",
      "joiningDate": "2025-01-15",
      "membershipPlan": "Monthly",
      "membershipEndDate": "2026-10-15",
      "trainerName": "Amit Sharma"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 150, "totalPages": 8 }
}
```

---

### `GET /api/v1/members/:id`

Permission: `members:view`

Response `200`: Full member details including:
```json
{
  "id": "m001",
  "memberCode": "MEM-001",
  "firstName": "Rahul",
  "lastName": "Verma",
  "phone": "9876543211",
  "email": "rahul@example.com",
  "status": "ACTIVE",
  "joiningDate": "2025-01-15",
  "dateOfBirth": "1990-05-20",
  "gender": "Male",
  "address": "123 Main St, Ranchi",
  "emergencyContactName": "Priya Verma",
  "emergencyContactPhone": "9876599999",
  "emergencyContactRelationship": "Spouse",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2026-09-01T09:00:00Z"
}
```

---

### `GET /api/v1/members/:id/details`

Permission: `members:view`

Returns supplemental data (matches `MemberSupplementalData` frontend type):
```json
{
  "membershipHistory": [
    { "id": "ms001", "planName": "Monthly", "startDate": "2026-09-01", "endDate": "2026-10-01", "amount": 1500, "status": "ACTIVE" }
  ],
  "attendanceSummary": {
    "visitsThisMonth": 12,
    "lastVisitDate": "2026-09-29",
    "averageVisitsPerWeek": 3.2
  },
  "paymentHistory": [
    { "receiptId": "pay001", "planName": "Monthly", "amount": 1500, "method": "UPI", "date": "2026-09-01" }
  ]
}
```

---

### `POST /api/v1/members`

Permission: `members:create`

Request:
```json
{
  "firstName": "Rahul",
  "lastName": "Verma",
  "phone": "9876543211",
  "email": "rahul@example.com",
  "joiningDate": "2026-09-30",
  "dateOfBirth": "1990-05-20",
  "gender": "Male",
  "address": "123 Main St",
  "emergencyContactName": "Priya Verma",
  "emergencyContactPhone": "9876599999",
  "emergencyContactRelationship": "Spouse"
}
```

Response `201`: Created member object

Errors: `409 MEMBER_PHONE_DUPLICATE`

---

### `PATCH /api/v1/members/:id`

Permission: `members:edit`

Request: Partial update

Response `200`: Updated member object

---

### `DELETE /api/v1/members/:id`

Permission: `members:delete`

Response `204`

Errors: `409 CONFLICT` if the member has memberships, payments, or attendance records

---

## Membership Plans

### `GET /api/v1/membership-plans`

Permission: `membership-plans:view`

Query params: `status`

Response `200`: Array of plans (not paginated — bounded list)

---

### `GET /api/v1/membership-plans/:id`

Permission: `membership-plans:view`

Response `200`: Single plan object

---

### `POST /api/v1/membership-plans`

Permission: `membership-plans:create`

Request:
```json
{
  "name": "Monthly",
  "description": "30-day gym access",
  "durationInDays": 30,
  "price": 1500
}
```

Response `201`: Created plan (status defaults to `ACTIVE`)

---

### `PATCH /api/v1/membership-plans/:id`

Permission: `membership-plans:edit`

Request: Partial — `name`, `description`, `durationInDays`, `price`, `status`

Response `200`: Updated plan

---

### `DELETE /api/v1/membership-plans/:id`

Permission: `membership-plans:delete`

Response `204`

Errors: `409 CONFLICT` if active memberships reference this plan

---

## Memberships

### `GET /api/v1/memberships`

Permission: `memberships:view`

Query params: `page`, `pageSize`, `search`, `status`, `memberId`

Response `200`: Paginated list

---

### `GET /api/v1/memberships/:id`

Permission: `memberships:view`

Response `200`: Single membership

---

### `POST /api/v1/memberships`

Permission: `memberships:create`

Request:
```json
{
  "memberId": "m001",
  "planId": "p001",
  "startDate": "2026-09-30"
}
```

Response `201`:
```json
{
  "id": "ms010",
  "memberId": "m001",
  "planId": "p001",
  "planName": "Monthly",
  "startDate": "2026-09-30",
  "endDate": "2026-10-30",
  "amount": 1500,
  "status": "ACTIVE",
  "createdAt": "2026-09-30T10:00:00Z"
}
```

Errors: `409 MEMBERSHIP_ALREADY_ACTIVE` (if the member has an existing ACTIVE membership)

---

## Payments

### `GET /api/v1/payments`

Permission: `payments:view`

Query params: `page`, `pageSize`, `memberId`, `status`, `paymentMethod`, `fromDate`, `toDate`

Response `200`: Paginated list

---

### `GET /api/v1/payments/:id`

Permission: `payments:view`

Response `200`: Single payment with member name

---

### `POST /api/v1/payments`

Permission: `payments:record`

Request:
```json
{
  "memberId": "m001",
  "membershipId": "ms010",
  "amount": 1500,
  "paymentMethod": "UPI",
  "paymentDate": "2026-09-30",
  "reference": "UPI-123456",
  "notes": "September membership"
}
```

Response `201`: Created payment

---

## Attendance

### `GET /api/v1/attendance`

Permission: `attendance:view`

Query params: `page`, `pageSize`, `memberId`, `fromDate`, `toDate`

Response `200`: Paginated list

---

### `POST /api/v1/attendance`

Permission: `attendance:mark`

Request:
```json
{
  "memberId": "m001",
  "membershipId": "ms010",
  "attendanceDate": "2026-09-30",
  "checkInTime": "07:30"
}
```

Response `201`: Created attendance record

Errors: `409 ATTENDANCE_ALREADY_MARKED` (duplicate date for same member), `422 ATTENDANCE_NOT_ALLOWED` (expired membership + setting disallows it)

---

## Trainers

### `GET /api/v1/trainers`

Permission: `trainers:view`

Query params: `page`, `pageSize`, `search`, `status`

---

### `GET /api/v1/trainers/:id`

Permission: `trainers:view`

---

### `POST /api/v1/trainers`

Permission: `trainers:create`

Request: `firstName`, `lastName`, `phone`, `email?`, `specialization?`, `joiningDate`, `status`

Response `201`

---

### `PATCH /api/v1/trainers/:id`

Permission: `trainers:edit`

---

### `DELETE /api/v1/trainers/:id`

Permission: `trainers:delete`

Errors: `409 CONFLICT` if active assignments exist

---

## Member–Trainer Assignments

### `GET /api/v1/members/:memberId/trainer`

Permission: `members:view`

Response `200`:
```json
{
  "currentAssignment": {
    "id": "mta001",
    "memberId": "m001",
    "trainerId": "t001",
    "trainerName": "Amit Sharma",
    "startDate": "2026-08-01",
    "status": "ACTIVE"
  },
  "history": [...]
}
```

---

### `POST /api/v1/members/:memberId/trainer`

Permission: `members:edit`

Request:
```json
{ "trainerId": "t002", "startDate": "2026-09-30" }
```

Response `201`: New assignment (previous ACTIVE assignment is automatically ENDED)

---

### `DELETE /api/v1/members/:memberId/trainer`

Permission: `members:edit`

Ends the current ACTIVE assignment (sets `endDate` to today, `status = ENDED`).

Response `200`: Ended assignment

---

## Leads

### `GET /api/v1/leads`

Permission: `leads:view`

Query params: `page`, `pageSize`, `search`, `status`, `source`, `fromDate`, `toDate`

---

### `GET /api/v1/leads/:id`

Permission: `leads:view`

---

### `POST /api/v1/leads`

Permission: `leads:create`

Request: `name`, `phone`, `email?`, `source?`, `interestedPlanId?`, `notes?`, `nextFollowUpDate?`

Response `201`

---

### `PATCH /api/v1/leads/:id`

Permission: `leads:edit`

---

### `DELETE /api/v1/leads/:id`

Permission: `leads:delete`

---

### `POST /api/v1/leads/:id/convert`

Permission: `leads:edit`

Converts the lead to a member. Atomically creates the member and updates the lead.

Request:
```json
{
  "firstName": "Priya",
  "lastName": "Singh",
  "phone": "9876543222",
  "joiningDate": "2026-09-30"
}
```

Response `201`:
```json
{
  "lead": { "id": "l001", "status": "CONVERTED", "convertedMemberId": "m100" },
  "member": { "id": "m100", "memberCode": "MEM-100", ... }
}
```

---

## Expenses

### `GET /api/v1/expenses`

Permission: `expenses:view`

Query params: `page`, `pageSize`, `categoryId`, `paymentMethod`, `fromDate`, `toDate`

---

### `GET /api/v1/expenses/:id`

Permission: `expenses:view`

---

### `POST /api/v1/expenses`

Permission: `expenses:create`

Request: `categoryId`, `description`, `amount`, `expenseDate`, `paymentMethod`, `vendor?`, `notes?`

Response `201`

---

### `PATCH /api/v1/expenses/:id`

Permission: `expenses:edit`

---

### `DELETE /api/v1/expenses/:id`

Permission: `expenses:delete`

---

### `GET /api/v1/expense-categories`

Permission: `expenses:view`

Response `200`: Array of categories

---

### `POST /api/v1/expense-categories`

Permission: `expenses:create`

---

## Inventory

### `GET /api/v1/inventory`

Permission: `inventory:view`

Query params: `page`, `pageSize`, `search`, `status`, `categoryId`

---

### `GET /api/v1/inventory/:id`

Permission: `inventory:view`

---

### `POST /api/v1/inventory`

Permission: `inventory:create`

Request: `name`, `categoryId`, `unit`, `minimumStock`, `description?`

Response `201`: Item with `currentStock = 0`

---

### `PATCH /api/v1/inventory/:id`

Permission: `inventory:edit`

---

### `DELETE /api/v1/inventory/:id`

Permission: `inventory:delete`

---

### `GET /api/v1/inventory/:id/transactions`

Permission: `inventory:view`

Response `200`: Array of transactions for this item

---

### `POST /api/v1/inventory/:id/transactions`

Permission: `inventory:edit`

Request:
```json
{
  "type": "STOCK_IN",
  "quantity": 50,
  "transactionDate": "2026-09-30",
  "reference": "PO-2026-001",
  "notes": "Restock from vendor"
}
```

Response `201`: Created transaction + updated item (with new `currentStock` and `status`)

Errors: `422 INVENTORY_INSUFFICIENT_STOCK` (STOCK_OUT would result in negative stock)

---

### `GET /api/v1/inventory-categories`

Permission: `inventory:view`

---

### `POST /api/v1/inventory-categories`

Permission: `inventory:create`

---

## Equipment

### `GET /api/v1/equipment`

Permission: `equipment:view`

Query params: `page`, `pageSize`, `search`, `status`, `categoryId`

---

### `GET /api/v1/equipment/:id`

Permission: `equipment:view`

---

### `POST /api/v1/equipment`

Permission: `equipment:create`

Request: `name`, `categoryId`, `brand?`, `model?`, `serialNumber?`, `purchaseDate?`, `purchaseCost?`, `location?`, `status?`, `notes?`

---

### `PATCH /api/v1/equipment/:id`

Permission: `equipment:edit`

---

### `DELETE /api/v1/equipment/:id`

Permission: `equipment:delete`

Errors: `409 CONFLICT` if maintenance records exist

---

### `GET /api/v1/equipment/:id/maintenance`

Permission: `equipment:view`

Response `200`: Array of maintenance records

---

### `POST /api/v1/equipment/:id/maintenance`

Permission: `equipment:maintenance`

Request: `maintenanceDate`, `maintenanceType`, `description`, `cost?`, `performedBy?`, `nextMaintenanceDate?`, `notes?`

Response `201`: Created maintenance record

---

### `GET /api/v1/equipment-categories`

Permission: `equipment:view`

---

### `POST /api/v1/equipment-categories`

Permission: `equipment:create`

---

## Notifications

### `GET /api/v1/notifications`

Permission: `notifications:view`

Query params: `memberId`, `type`, `status`, `page`, `pageSize`

---

### `GET /api/v1/notifications/expiring`

Permission: `notifications:view`

Query params: `window` (7, 14, or 30 — days from today)

Response `200`: Array of `{ membershipId, memberId, memberName, planName, endDate, daysUntilExpiry }`

---

### `GET /api/v1/notifications/expired`

Permission: `notifications:view`

Response `200`: Array of recently expired memberships

---

### `POST /api/v1/notifications`

Permission: `notifications:create`

Request:
```json
{
  "memberId": "m001",
  "membershipId": "ms010",
  "channel": "SMS",
  "message": "Your membership expires in 7 days. Please renew."
}
```

Response `201`: Created notification record (type: `CUSTOM`, status: `PENDING`)

---

## Reports

### `GET /api/v1/reports/overview`

Permission: `reports:view`

Query params: `fromDate`, `toDate`

Response `200`:
```json
{
  "revenue": 45000,
  "expenses": 12000,
  "netCashFlow": 33000,
  "activeMembers": 87,
  "newMembers": 5,
  "attendanceCount": 312,
  "newLeads": 8,
  "revenueVsExpenses": [
    { "month": "Aug '26", "revenue": 42000, "expenses": 11000 }
  ]
}
```

---

### `GET /api/v1/reports/revenue`

Permission: `reports:view`

Query params: `fromDate`, `toDate`

---

### `GET /api/v1/reports/members`

Permission: `reports:view`

Query params: `fromDate`, `toDate`

---

### `GET /api/v1/reports/memberships`

Permission: `reports:view`

Query params: `fromDate`, `toDate`

---

### `GET /api/v1/reports/attendance`

Permission: `reports:view`

Query params: `fromDate`, `toDate`

---

### `GET /api/v1/reports/expenses`

Permission: `reports:view`

Query params: `fromDate`, `toDate`

---

### `GET /api/v1/reports/leads`

Permission: `reports:view`

Query params: `fromDate`, `toDate`

---

## Settings

### `GET /api/v1/settings`

Permission: `settings:view`

Response `200`: GymSettings object

---

### `PATCH /api/v1/settings`

Permission: `settings:edit` (OWNER only)

Request: Partial — any settings fields

Response `200`: Updated settings

---

## Audit Logs

### `GET /api/v1/audit-logs`

Permission: `audit-logs:view`

Query params: `page`, `pageSize`, `action`, `entityType`, `userId`, `status`, `fromDate`, `toDate`

Response `200`: Paginated list

---

### `GET /api/v1/audit-logs/:id`

Permission: `audit-logs:view`

Response `200`: Full audit log entry including `metadata`

---

## Global Search

### `GET /api/v1/search`

Permission: authenticated (results filtered by caller's permissions)

Query params: `q` (required, min 2 chars)

Response `200`:
```json
{
  "groups": {
    "members": {
      "label": "Members",
      "results": [
        { "id": "m001", "title": "Rahul Verma", "subtitle": "MEM-001 · Monthly", "to": "/members/m001", "type": "members" }
      ]
    },
    "payments": { ... }
  }
}
```

---

## Backup and Restore

### `POST /api/v1/backup/create`

Permission: OWNER only (`settings:edit` or a dedicated `backup` permission — **OPEN DECISION**)

Response `200`: Backup file download (application/sql) or `{ "filename": "...", "size": ... }`

---

### `GET /api/v1/backup/list`

Permission: OWNER only

Response `200`: Array of `{ filename, createdAt, sizeBytes }`

---

### `POST /api/v1/backup/restore`

Permission: OWNER only

Request: Multipart form with `.sql` backup file upload

Response `200`: `{ "ok": true, "restoredAt": "..." }`

**OPEN DECISION:** Backup/restore frontend UI is not yet implemented. These endpoints are designed but await frontend integration.

---

## Health

### `GET /health`

Permission: none (public)

Response `200`: `{ "status": "ok", "timestamp": "..." }`
