# 01 — Requirements

## Product Scope

This is a **local/LAN Gym Management System** used exclusively by **gym staff** (owner, administrators, reception, trainers). It is **not** a consumer-facing or member-facing application. Members do not interact with the software directly.

The system is deployed on a local network inside a single gym. It is accessed via browser on a LAN. Internet connectivity may be limited or unreliable, so the system must function completely on LAN. Remote access is out of scope for the initial version.

---

## Actors

| Actor | Description |
|---|---|
| **Owner** | Full access. Manages all data including users and settings. |
| **Admin** | Near-full access. Cannot delete users or modify settings. |
| **Receptionist** | Day-to-day operations: members, memberships, payments, attendance, leads. Limited to no access for financial configuration or system settings. |
| **Trainer** | Read-only access to members and memberships. Can mark attendance. Views own profile. |

---

## Functional Requirements

### Authentication

**Purpose:** Authenticate staff before granting access.

**Capabilities:**
- Staff login with email and password.
- Role-based access control enforced after login.
- Staff can view and update their own profile.
- Logout.

**Business rules:**
- Inactive users cannot log in.
- Credentials validated server-side.
- Each user has exactly one role at a time.

---

### User Management

**Purpose:** Manage staff accounts in the gym.

**Actors:** Owner, Admin (cannot delete)

**Capabilities:**
- List users with filtering by role and status.
- View user details.
- Create user (set name, email, phone, role, status).
- Edit user (name, phone, role, status).
- Delete user (Owner only).

**Business rules:**
- User email must be unique.
- An auto-generated `userCode` is assigned to each user.
- Only the Owner can delete users.
- Users cannot delete their own account.

---

### Members

**Purpose:** Track gym members and their personal details.

**Actors:** Owner, Admin, Receptionist (create/edit, no delete), Trainer (view only)

**Capabilities:**
- List members with search (name, member code, phone) and filter by status.
- View member details including personal info, active membership, membership history, payment history, attendance summary.
- Create member (name, phone, email, date of birth, gender, address, emergency contact, joining date).
- Edit member.
- Delete member (Owner, Admin only).
- Paginated member list.

**Business rules:**
- `memberCode` is auto-generated.
- `phone` must be a valid 10-digit Indian mobile number.
- `phone` must be unique across all members.
- `dateOfBirth` cannot be in the future.
- `joiningDate` is required.
- `email` is optional but must be valid if provided.
- Member `status` values: `ACTIVE | EXPIRED | SUSPENDED | CANCELLED`.
- Member status reflects their current membership state.

---

### Membership Plans

**Purpose:** Define reusable templates for gym memberships.

**Actors:** Owner, Admin (full CRUD), Receptionist (view only)

**Capabilities:**
- List plans with filter by status.
- Create plan (name, description, durationInDays, price, status).
- Edit plan.
- Delete plan (Owner, Admin only).

**Business rules:**
- Plan `name` must be between 2 and 100 characters.
- `durationInDays` must be a positive integer (≥ 1).
- `price` must be greater than 0.
- Plan `status`: `ACTIVE | INACTIVE`. Inactive plans cannot be used to create new memberships.
- `createdAt` is recorded automatically.

---

### Memberships

**Purpose:** Assign a membership plan to a member, recording the actual subscription.

**Actors:** Owner, Admin, Receptionist (create); all with view permission (view)

**Capabilities:**
- List all memberships with filter by status and search.
- Create membership for a member (select plan, set start date).
- View membership (plan name, dates, amount, status).
- Paginated membership list.

**Business rules:**
- `endDate` is automatically computed as `startDate + plan.durationInDays`.
- `amount` is copied from the plan's price at the time of creation (not dynamically updated).
- Membership `status` values: `ACTIVE | EXPIRED | CANCELLED`.
- A member should have at most one ACTIVE membership at a time. **OPEN DECISION:** Whether the system should enforce this as a hard constraint or warn.
- Once created, the start/end dates and amount are not editable (immutable record).

---

### Payments

**Purpose:** Record payments made by members (typically for memberships).

**Actors:** Owner, Admin, Receptionist (record); all with view permission (view)

**Capabilities:**
- List payments with filter by status, date range, payment method.
- Record payment (member, membership?, amount, payment method, date, reference, notes).
- View payment details.
- Paginated payment list.

**Business rules:**
- `amount` must be greater than 0.
- `paymentDate` is required.
- `paymentMethod` values: `CASH | UPI | CARD | BANK_TRANSFER`.
- Payment `status` values: `COMPLETED | PENDING | REFUNDED`.
- **Revenue calculation** uses only `COMPLETED` payments.
- Payments are not required to be linked to a membership (standalone payments are possible).

---

### Attendance

**Purpose:** Track daily member check-ins.

**Actors:** Owner, Admin, Receptionist, Trainer (mark); all (view)

**Capabilities:**
- List attendance records with filter by date range and member.
- Mark attendance for a member (member, date, check-in time).

**Business rules:**
- Only status value is `PRESENT` (attendance records are only created for present members, not absent).
- `attendanceDate` and `checkInTime` are required.
- Duplicate attendance prevention: A member should not have multiple attendance records for the same date. **OPEN DECISION:** Whether to enforce at DB level or application level.
- The `allowAttendanceForExpiredMembership` setting controls whether expired members can mark attendance.
- Attendance time window is configurable: `attendanceStartTime` and `attendanceEndTime` in settings.
- `membershipId` is optional on attendance records (allows attendance without active membership if the setting permits).

---

### Trainers

**Purpose:** Manage gym trainer staff profiles.

**Actors:** Owner, Admin (full CRUD), Receptionist (view), Trainer (view own)

**Capabilities:**
- List trainers with search and filter by status.
- View trainer details.
- Create trainer (name, phone, email, specialization, joining date, status).
- Edit trainer.
- Delete trainer (Owner, Admin only).

**Business rules:**
- `trainerCode` is auto-generated.
- `phone` is required.
- `email` is optional.
- Trainer `status`: `ACTIVE | INACTIVE`.

---

### Member–Trainer Assignments

**Purpose:** Assign trainers to members and track the assignment history.

**Actors:** Owner, Admin, Receptionist (manage, via `members:edit` permission)

**Capabilities:**
- View current trainer for a member.
- Assign a trainer to a member (trainer, start date).
- View assignment history for a member.
- End an assignment (set end date, mark ENDED).

**Business rules:**
- Assignment `status`: `ACTIVE | ENDED`.
- A member can have at most one ACTIVE trainer assignment at a time. **OPEN DECISION:** Enforced at DB or application level?
- `endDate` is optional on creation; it is set when the assignment is ended.
- A new assignment automatically ends the previous active assignment.

---

### Leads

**Purpose:** Track prospective members and manage follow-up pipeline.

**Actors:** Owner, Admin (full CRUD), Receptionist (view, create, edit — no delete)

**Capabilities:**
- List leads with filter by status and date range.
- View lead details.
- Create lead (name, phone, email, source, interested plan, notes, next follow-up date).
- Edit lead (update status, notes, follow-up dates).
- Delete lead (Owner, Admin only).
- Convert lead to member.

**Lead status lifecycle:**
```
NEW → CONTACTED → INTERESTED → FOLLOW_UP → CONVERTED | LOST
```

**Business rules:**
- `leadCode` is auto-generated.
- `phone` is required (7–15 chars, international format allowed).
- `email` is optional but must be valid if provided.
- Lead `source` values: `WALK_IN | PHONE | WEBSITE | REFERRAL | SOCIAL_MEDIA | OTHER`.
- On conversion: `status` is set to `CONVERTED` and `convertedMemberId` is recorded.
- A converted lead links back to the created member.

---

### Expenses

**Purpose:** Track gym operational expenses.

**Actors:** Owner, Admin (full CRUD), Receptionist (view only — no expense management)

**Capabilities:**
- List expenses with filter by category, date range, payment method.
- View expense details.
- Create expense (category, description, amount, date, payment method, vendor, notes).
- Edit expense.
- Delete expense (Owner, Admin only).

**Business rules:**
- `expenseCode` is auto-generated.
- `categoryId` is required (linked to ExpenseCategory).
- `amount` must be greater than 0. **OPEN DECISION:** Whether to enforce > 0 or ≥ 0.
- `expenseDate` is required.
- Expenses are separate from inventory purchases. Buying inventory stock is handled through inventory transactions.
- `paymentMethod` values: `CASH | UPI | CARD | BANK_TRANSFER`.

**Expense Categories:**
- List categories.
- Create category (name, description, status).
- **OPEN DECISION:** Whether categories are editable/deletable after creation.

---

### Inventory

**Purpose:** Track consumable/stocked goods (protein supplements, merchandise, etc.).

**Actors:** Owner, Admin (full CRUD), Receptionist (view only)

**Capabilities:**
- List inventory items with filter by status and category.
- View item details including transaction history.
- Create item (name, category, unit, minimum stock, description).
- Edit item.
- Delete item (Owner, Admin only).
- Record stock transaction (STOCK_IN, STOCK_OUT, ADJUSTMENT) with quantity and date.

**Business rules:**
- `itemCode` is auto-generated.
- `currentStock` is **derived** from the sum of inventory transactions; it is not stored independently.
  - `STOCK_IN` increases stock.
  - `STOCK_OUT` decreases stock.
  - `ADJUSTMENT` sets or corrects stock.
- `status` is **derived** from `currentStock` vs `minimumStock`:
  - `currentStock == 0` → `OUT_OF_STOCK`
  - `currentStock <= minimumStock` → `LOW_STOCK`
  - `currentStock > minimumStock` → `IN_STOCK`
- `minimumStock` is the low-stock threshold configured per item.
- Stock cannot go negative. **OPEN DECISION:** Hard constraint or warning?

**Inventory Categories:**
- List categories.
- Linked to inventory items.

---

### Equipment

**Purpose:** Track physical gym equipment and its maintenance history.

**Actors:** Owner, Admin (full CRUD + maintenance), Receptionist (view only), Trainer (view only)

**Capabilities:**
- List equipment with filter by status and category.
- View equipment details including maintenance history.
- Create equipment (name, category, brand, model, serial number, purchase date, purchase cost, location, status, notes).
- Edit equipment.
- Delete equipment (Owner, Admin only).
- Add maintenance record (date, type, description, cost, performed by, next maintenance date, notes).

**Equipment status lifecycle:**
```
ACTIVE → UNDER_MAINTENANCE → ACTIVE | OUT_OF_SERVICE → RETIRED
```

**Maintenance type values:** `ROUTINE | REPAIR | INSPECTION | REPLACEMENT`

**Business rules:**
- `equipmentCode` is auto-generated.
- Maintenance records are append-only (no edit/delete).
- `nextMaintenanceDate` on a maintenance record serves as a reminder for future maintenance.

**Equipment Categories:**
- List categories.
- Linked to equipment.

---

### Reports

**Purpose:** Provide financial and operational insights for gym management.

**Actors:** Owner, Admin (view)

**Report tabs and their data:**

| Tab | Contents |
|---|---|
| **Overview** | Revenue, expenses, net cash flow, active members, new members, attendance count, new leads. Revenue vs expenses chart by month. |
| **Members** | Total, active, new members in period. Member status distribution. New member trend by month. |
| **Memberships** | Active/expired/cancelled counts, new memberships in period, memberships by plan. |
| **Revenue** | Total revenue (completed payments only), avg per payment, pending amount. Revenue by month chart. Revenue by payment method chart. Payments table. |
| **Attendance** | Total check-ins in period, unique members, attendance trend by day/month. |
| **Expenses** | Total expenses in period, by category breakdown, trend by month. |
| **Leads** | Total leads, by status, conversion rate, by source. |

**Date presets:** Today, This Week, This Month, Last Month, Last 3 Months, This Year, Custom Range.

**Key calculations:**
- Revenue = sum of `amount` for payments with `status = COMPLETED` in the date range.
- Expenses = sum of `amount` for expenses in the date range.
- Net Cash Flow = Revenue − Expenses.
- Conversion Rate = CONVERTED leads / total leads × 100.

---

### Notifications

**Purpose:** Track membership expiry and send reminders to members.

**Actors:** Owner, Admin, Receptionist (view + create); Trainer (view only)

**Capabilities:**
- View memberships expiring within a configurable window (7, 14, or 30 days).
- View already-expired memberships.
- View notification/reminder history.
- Create a custom reminder for a member's membership via a channel.

**Notification types:** `EXPIRY_REMINDER | EXPIRED_NOTICE | CUSTOM`

**Channels:** `SMS | WHATSAPP | EMAIL | IN_APP`

**Notification status:** `PENDING | SENT | FAILED`

**Business rules:**
- A notification is linked to both a member and a membership.
- `IN_APP` is the only channel that does not require external integration.
- SMS, WhatsApp, and Email require third-party provider integration. **OPEN DECISION:** Which provider?
- `sentAt` is set when the notification is actually dispatched.
- The system currently simulates delivery; real delivery is not yet implemented.

---

### Settings

**Purpose:** Configure gym-level operational parameters.

**Actors:** Owner (full settings edit); Admin (view only — cannot edit)

**Settings sections:**

| Section | Fields |
|---|---|
| **Gym Profile** | gymName (required), phone, email, address |
| **Membership** | membershipGracePeriodDays (≥ 0, integer) |
| **Attendance** | attendanceStartTime, attendanceEndTime (endTime > startTime), allowAttendanceForExpiredMembership (boolean) |
| **Preferences** | dateFormat (`DD/MM/YYYY \| MM/DD/YYYY \| YYYY-MM-DD`) |

**Fixed (non-configurable) settings:**
- Currency: `INR`
- Timezone: `Asia/Kolkata`

---

### Audit Logs

**Purpose:** Record a tamper-evident trail of all significant system actions.

**Actors:** Owner, Admin (view only — no delete, no create)

**Capabilities:**
- List audit logs with filter by action, entity type, date range, status.
- View audit log details.

**Recorded actions:** `CREATE | UPDATE | DELETE | LOGIN | LOGOUT | VIEW | EXPORT`

**Tracked entity types:**
```
USER | MEMBER | MEMBERSHIP_PLAN | MEMBERSHIP | PAYMENT | ATTENDANCE |
TRAINER | LEAD | EXPENSE | INVENTORY_ITEM | EQUIPMENT |
EQUIPMENT_MAINTENANCE | NOTIFICATION | SETTINGS
```

**Business rules:**
- Audit logs are immutable. They cannot be deleted or edited.
- Each log records: timestamp, userId, action, entityType, entityId?, entityName?, description, status (SUCCESS/FAILED), metadata.
- Failed actions (e.g., failed login) are also recorded.
- The backend is responsible for creating audit records as a side effect of all tracked operations.

---

### Global Search

**Purpose:** Allow staff to quickly find any record across the system.

**Capabilities:**
- Search across: Members, Membership Plans, Memberships, Payments, Trainers, Leads, Expenses, Inventory, Equipment.
- Results are grouped by entity type.
- Maximum 5 results shown per category.
- Search is permission-aware: a user only sees search results for domains they have `view` permission on.

**Search fields per entity:**
- **Members:** firstName, lastName, memberCode, phone, email.
- **Membership Plans:** name, description.
- **Memberships:** planName, member name, id.
- **Payments:** id, member name, paymentDate, paymentMethod.
- **Trainers:** firstName, lastName, trainerCode, phone, specialization.
- **Leads:** name, leadCode, phone, email.
- **Expenses:** description, expenseCode, vendor.
- **Inventory:** name, itemCode, description.
- **Equipment:** name, equipmentCode, brand, model, location.

---

### Dashboard

**Purpose:** Provide a real-time operational overview for quick situational awareness.

**Actors:** All authenticated users (view)

**Data shown:**
- Total members, active members count.
- Expiring memberships count (within a configurable window).
- Today's attendance count.
- Monthly revenue chart (last 6 months).
- Membership plan distribution.
- Attendance snapshot (checked in, peak hour, currently inside).
- Expiring memberships list (next 7 days).
- Recent payments.

---

## Non-Functional Requirements

### Reliability
- The system must be available 100% of LAN working hours. No external dependencies for core gym operations (authentication, attendance, payments).
- Data must not be silently lost. All mutations must either succeed atomically or fail clearly.

### Data Integrity
- All foreign-key relationships must be enforced at the database level.
- Computed values (e.g., membership `endDate`, inventory `currentStock`) must remain consistent with their source data.
- Business-rule constraints (e.g., `payment.amount > 0`, `member.phone UNIQUE`) must be enforced at the database level, not only in application code.

### Security
- Passwords must be hashed (bcrypt or equivalent). Plain-text passwords are not acceptable.
- Backend authorization must be enforced independently of frontend permission checks. Frontend permissions are UX; backend authorization is the security boundary.
- All endpoints must verify authentication and authorization before processing any request.
- Sensitive data (passwords, secrets) must never appear in logs.

### Maintainability
- The backend must be structured as a modular monolith with clear module boundaries.
- Each module should own its data and expose defined interfaces.
- Code must be covered by integration tests for critical business rules.

### Performance (LAN)
- List endpoints with pagination should respond in under 200ms on LAN.
- Reports that aggregate data must respond in under 2 seconds for a gym with up to 5,000 members and 3 years of history.
- No need to optimize for external internet latency.

### Backup and Recovery
- The system must support manual database backup triggered by an authorized user.
- Backups must be restorable. A gym losing 24 hours of data would be a major incident.
- **OPEN DECISION:** Backup mechanism (manual SQL dump vs scheduled export vs application-level backup).

### Auditability
- All significant data mutations must produce an audit log entry.
- The audit log must be append-only and not modifiable by any user.

### Extensibility
- The modular design must allow adding new feature modules without breaking existing ones.
- API design must be versioned (at minimum `/api/v1`) to allow future additions without breaking existing clients.

### Scalability
- Designed for a single gym with up to ~500 active members and ~10 concurrent staff users. No need for multi-tenancy or horizontal scaling in v1.

### Usability for Reception Staff
- All operations common to reception (member lookup, membership creation, payment recording, attendance marking) must complete in 3 steps or fewer.
- Error messages must be human-readable and actionable.
