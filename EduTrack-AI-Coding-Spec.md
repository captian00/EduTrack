# EduTrack — AI Coding Specification

> **Purpose:** This document is the source of truth for AI coding agents working on EduTrack. Read this file before creating, modifying, or reviewing code. When implementation details conflict with this document, follow this document unless the developer explicitly changes the requirement.

## 1. Project Overview

**EduTrack** is a responsive web application for a private teacher/tutor to manage students, classes, attendance, tuition fees, payments, and bank-transfer QR codes.

### Primary goals

- Manage students and classes.
- Create and manage teaching sessions.
- Take attendance quickly on desktop and mobile.
- Calculate tuition from actual billable sessions.
- Track paid/unpaid/partially-paid tuition.
- Generate VietQR-compatible bank transfer QR codes with amount and transfer content prefilled.
- Keep the first version simple, maintainable, secure, and deployable on free tiers.
- Work from Mac/iPhone through a browser from anywhere with Internet access.

### Initial scope assumptions

- Single owner/admin account in v1.
- No student/parent login in v1.
- No offline mode in v1.
- No automatic bank reconciliation in v1. The system generates a transfer QR; the admin manually confirms payment.
- Currency: VND. Monetary values are stored as integer VND, never floating point.
- Default locale/timezone: `vi-VN` / `Asia/Ho_Chi_Minh`.
- Architecture must not prevent future multi-user support.

## 2. High-Level Architecture

EduTrack is split into two repositories/applications:

```text
EduTrack-FE (Next.js)
      |
      | HTTPS / REST JSON
      v
EduTrack-BE (NestJS)
      |
      +----> Supabase PostgreSQL
      |
      +----> Supabase Auth
      |
      +----> VietQR / QR generation
```

### Deployment target

- **EduTrack-FE:** Vercel free tier.
- **EduTrack-BE:** use a free Node.js hosting provider that supports the NestJS runtime. Keep the BE Docker-ready so hosting can be changed without code changes.
- **Database/Auth:** Supabase free tier.
- **Source control:** GitHub private repositories.
- **Domain:** use free platform domains initially.

Do not couple business logic to Vercel, Supabase-specific database APIs, or a particular BE hosting vendor unnecessarily.

---

# 3. EduTrack-FE

## 3.1 Technology Stack

- Next.js with App Router
- React
- TypeScript with strict mode
- Tailwind CSS
- shadcn/ui for reusable UI primitives
- Radix UI only when required by shadcn/ui or for missing accessible primitives
- TanStack Query for server-state fetching/caching/mutations
- React Hook Form for forms
- Zod for client-side form/schema validation
- Axios for the HTTP API client
- date-fns for date manipulation/formatting
- Lucide React for icons
- Sonner for toast notifications
- `qrcode` only if QR rendering is performed client-side; prefer QR payload/data returned from BE

### Do not add without a concrete requirement

- Redux / Redux Toolkit
- Zustand
- Moment.js
- Material UI / Ant Design
- GraphQL
- jQuery
- Multiple libraries solving the same problem

Prefer React local state for UI state and TanStack Query for server state. Add global client state only when a real cross-feature requirement exists.

## 3.2 FE Responsibilities

EduTrack-FE is responsible for:

- Rendering UI.
- Responsive desktop/mobile experience.
- Form validation for UX.
- Calling EduTrack-BE APIs.
- Authentication session handling.
- Query caching and invalidation.
- Displaying tuition/payment calculations returned by BE.
- Displaying/generating QR from trusted payment data.

EduTrack-FE must **not** contain authoritative tuition/business calculations. Client calculations may be used for previews only; BE remains the source of truth.

## 3.3 Suggested FE Structure

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── students/
│   │   ├── classes/
│   │   ├── lessons/
│   │   ├── attendance/
│   │   ├── tuition/
│   │   ├── payments/
│   │   └── settings/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                 # shadcn primitives only
│   └── shared/             # truly cross-feature components
├── features/
│   ├── auth/
│   ├── students/
│   ├── classes/
│   ├── lessons/
│   ├── attendance/
│   ├── tuition/
│   ├── payments/
│   └── dashboard/
├── lib/
│   ├── api/
│   ├── query/
│   ├── utils/
│   └── constants/
├── hooks/                  # cross-feature hooks only
├── types/                  # shared FE-only types only
└── config/
```

Each feature should generally follow:

```text
features/students/
├── api/
│   ├── student.api.ts
│   └── student.keys.ts
├── components/
├── hooks/
├── schemas/
├── types/
├── utils/
└── constants.ts
```

Do not create folders merely to satisfy the structure. Create them when there is code belonging to them.

## 3.4 FE Coding Rules

- Use TypeScript. Do not use `any` unless there is an unavoidable external-library boundary and document why.
- Prefer named exports except where Next.js requires a default export.
- Components use PascalCase; hooks use `useXxx`; functions/variables use camelCase; constants use UPPER_SNAKE_CASE only for true constants.
- Keep page files thin. Feature/business UI belongs in `features/*`.
- Do not call Axios directly from presentation components. API calls belong in feature `api/` modules.
- TanStack Query keys must be centralized per feature.
- Mutation success must invalidate/update only relevant query keys.
- Never duplicate API response interfaces manually if types can be generated/shared safely. If repositories remain fully independent, define FE DTO types matching the published API contract.
- Use React Hook Form + Zod for non-trivial forms.
- Avoid `useEffect` for derived state.
- Prefer server components when they provide a clear benefit, but interactive authenticated feature screens may use client components as needed.
- Do not store auth tokens in arbitrary localStorage code if the selected authentication flow supports secure cookies/session handling.
- All destructive actions require confirmation.
- All list screens need loading, empty, error, and success states.
- Mobile usability is mandatory; target at least 375px width.
- Buttons/touch targets must be comfortably usable on iPhone.
- Use semantic HTML and accessible labels.

---

# 4. EduTrack-BE

## 4.1 Technology Stack

- Node.js LTS
- NestJS
- TypeScript strict mode
- PostgreSQL hosted by Supabase
- Prisma ORM
- Supabase Auth for authentication
- `@nestjs/config` for environment configuration
- `class-validator` + `class-transformer` for request DTO validation
- Swagger / OpenAPI via `@nestjs/swagger`
- Helmet for security headers
- NestJS built-in throttling (`@nestjs/throttler`) for sensitive/public endpoints
- Jest for unit/integration tests
- QR/VietQR integration isolated behind a payment QR service

### Why Prisma

Use Prisma as the BE database access layer so database queries, migrations, relations, and transactions have one consistent abstraction. Do not mix Prisma with TypeORM or direct Supabase database SDK queries.

Supabase remains the PostgreSQL host and authentication provider; Prisma owns application database access/migrations.

## 4.2 BE Responsibilities

EduTrack-BE is the source of truth for:

- Authentication/authorization checks.
- Student/class/session CRUD rules.
- Attendance rules.
- Tuition calculation.
- Payment state and allocation.
- QR payment payload generation.
- Database transactions.
- Input validation.
- API error handling.
- Audit-friendly timestamps and data integrity.

## 4.3 Suggested BE Structure

Use a feature/module-first architecture.

```text
src/
├── main.ts
├── app.module.ts
├── config/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   ├── constants/
│   └── utils/
├── database/
│   └── prisma/
├── modules/
│   ├── auth/
│   ├── students/
│   ├── classes/
│   ├── enrollments/
│   ├── lessons/
│   ├── attendance/
│   ├── tuition/
│   ├── payments/
│   ├── qr-payments/
│   └── dashboard/
└── health/
```

Example module:

```text
modules/students/
├── dto/
│   ├── create-student.dto.ts
│   ├── update-student.dto.ts
│   └── query-students.dto.ts
├── students.controller.ts
├── students.service.ts
├── students.repository.ts       # optional when query complexity justifies it
├── students.module.ts
├── students.service.spec.ts
└── students.types.ts            # only if needed
```

### Layer responsibilities

**Controller**
- Parse route/query/body.
- Apply guards/decorators.
- Delegate to service.
- Must not contain business logic or Prisma queries.

**Service**
- Business rules.
- Orchestration.
- Transactions.
- Authorization rules that depend on domain data.

**Repository**
- Add only where query complexity/reuse warrants it.
- Database access only.
- No HTTP concerns.

---

# 5. Database Design

## 5.1 Core Entities

### User / Owner

Authentication identity is managed by Supabase Auth. Application records reference the authenticated user's UUID as `ownerId`.

### Student

```text
id              UUID PK
ownerId         UUID
fullName        string
parentName      string nullable
parentPhone     string nullable
notes           text nullable
isActive        boolean default true
createdAt       timestamp
updatedAt       timestamp
```

### Class

```text
id                UUID PK
ownerId           UUID
name              string
defaultFee         integer >= 0     # VND/session
scheduleNote      string nullable
isActive          boolean default true
createdAt         timestamp
updatedAt         timestamp
```

### Enrollment

Links a student to a class and snapshots/overrides the fee per session.

```text
id                UUID PK
ownerId           UUID
studentId         UUID FK
classId           UUID FK
feePerSession     integer >= 0
startDate         date
endDate           date nullable
isActive          boolean default true
createdAt         timestamp
updatedAt         timestamp
```

### Lesson

A real teaching session.

```text
id                UUID PK
ownerId           UUID
classId           UUID FK
lessonDate        date
startTime         time nullable
endTime           time nullable
topic             string nullable
status            SCHEDULED | COMPLETED | CANCELLED
createdAt         timestamp
updatedAt         timestamp
```

### Attendance

One student's attendance record for one lesson.

```text
id                UUID PK
ownerId           UUID
lessonId          UUID FK
studentId         UUID FK
status            PRESENT | ABSENT_EXCUSED | ABSENT_UNEXCUSED | MAKEUP
feeAmount         integer >= 0
isBillable        boolean
note              string nullable
createdAt         timestamp
updatedAt         timestamp

UNIQUE(lessonId, studentId)
```

`feeAmount` is a **snapshot** of the fee charged for that attendance/session. Historical tuition must not change just because the class/enrollment price changes later.

### Payment

```text
id                UUID PK
ownerId           UUID
studentId         UUID FK
amount             integer > 0
paidAt             timestamp
method             CASH | BANK_TRANSFER | OTHER
reference          string nullable
note               string nullable
createdAt          timestamp
updatedAt          timestamp
```

### PaymentAllocation

Allows a payment to cover one or more billable attendance records.

```text
id                UUID PK
ownerId           UUID
paymentId         UUID FK
attendanceId      UUID FK
amount             integer > 0
createdAt          timestamp

UNIQUE(paymentId, attendanceId)
```

BE must guarantee:

- allocation belongs to the same student as the payment;
- total allocations do not exceed payment amount;
- allocation for an attendance does not exceed its outstanding amount;
- allocation writes are transactional.

### PaymentQr / QR data

Do not persist QR image binaries by default. Generate QR data on demand from:

- bank BIN/code;
- account number;
- account name if required;
- amount;
- transfer description.

Bank account configuration can initially live in an owner settings record or secure server configuration, depending on whether it needs to be editable from UI.

## 5.2 Database Rules

- UUID primary keys.
- Store VND as integer.
- Use UTC timestamps in DB; convert for display.
- Add `createdAt` and `updatedAt` to mutable core entities.
- Add indexes for foreign keys and frequent filters (`ownerId`, `studentId`, `classId`, `lessonDate`, etc.).
- Prefer soft/inactive state for students/classes that have financial history rather than deleting historical data.
- Never cascade-delete financial/attendance history accidentally.
- Use DB unique constraints for invariants that must survive concurrency.
- Use Prisma migrations. Never manually change production schema without a migration.

---

# 6. Feature Breakdown

## Feature 1 — Authentication

**FE**
- Login page.
- Auth/session bootstrap.
- Protected routes.
- Logout.

**BE**
- Verify Supabase JWT.
- Extract authenticated `userId`.
- Guard protected APIs.

**v1:** one owner account. Do not hard-code the user's UUID in source code.

## Feature 2 — Dashboard

Display useful summary data such as:

- active students;
- active classes;
- today's lessons;
- attendance summary;
- tuition due;
- received payments;
- outstanding balance.

Aggregate financial values on BE.

## Feature 3 — Student Management

- Student list.
- Search by name/parent/phone.
- Add/edit student.
- Activate/deactivate student.
- Student detail.
- Student class enrollments.
- Attendance history.
- Tuition/payment history.

## Feature 4 — Class Management

- Class list.
- Add/edit class.
- Default fee/session.
- Schedule note.
- Activate/deactivate class.
- Enroll/remove students without destroying historical records.
- Per-student fee override through Enrollment.

## Feature 5 — Lessons

- Create lesson/session.
- Select class/date/time/topic.
- List/filter lessons.
- Mark completed/cancelled.
- Optional future enhancement: recurring lesson generation.

Do not implement recurrence in v1 unless explicitly requested.

## Feature 6 — Attendance

Main mobile-first workflow:

1. Open lesson.
2. Load enrolled students valid for the lesson date.
3. Mark each student's status.
4. Determine whether each record is billable according to tuition rules.
5. Snapshot `feeAmount`.
6. Save attendance in a transaction where appropriate.

UI should make bulk marking fast, e.g. "Mark all present" followed by exceptions.

## Feature 7 — Tuition

Tuition is derived from **billable attendance records**, not merely scheduled lessons.

Core calculation:

```text
Total Charged = SUM(attendance.feeAmount where isBillable = true)
Total Paid    = SUM(valid payment allocations)
Outstanding   = Total Charged - Total Paid
```

Allow filtering by student and date/month.

Do not silently decide whether excused/unexcused absence is billable. Implement this as an explicit business rule/configuration. Until finalized, default behavior should be documented and easy to change.

## Feature 8 — Payments

- View outstanding tuition.
- Record cash/bank transfer payment.
- Allocate payment to outstanding attendance charges.
- Support partial payments.
- Show paid/partial/unpaid state.
- Prevent over-allocation.
- Keep financial history immutable/auditable where possible.

## Feature 9 — VietQR / Bank Transfer QR

v1 flow:

```text
Select student / outstanding amount
        ↓
BE creates payment transfer data
        ↓
amount + bank account + unique description
        ↓
FE displays QR
        ↓
Parent scans with banking app
        ↓
Admin verifies bank transfer manually
        ↓
Admin records/confirms payment
```

Suggested transfer description format:

```text
EDU <STUDENT_CODE> <YYYYMM>
```

Keep it short because banks impose transfer-description length/character restrictions.

QR provider-specific code must be isolated behind an interface/service so VietQR can be replaced later.

Do **not** mark an invoice/payment as paid simply because a QR was generated.

## Feature 10 — Settings

- Teacher/display name.
- Bank selection.
- Bank account number.
- Account holder name.
- Default tuition behavior.
- Optional transfer description template.

Treat bank details as private application configuration. Never log credentials/secrets.

---

# 7. API Conventions

Base prefix:

```text
/api/v1
```

Examples:

```text
GET    /api/v1/students
POST   /api/v1/students
GET    /api/v1/students/:id
PATCH  /api/v1/students/:id

GET    /api/v1/classes
POST   /api/v1/classes
GET    /api/v1/classes/:id
PATCH  /api/v1/classes/:id

GET    /api/v1/lessons
POST   /api/v1/lessons
GET    /api/v1/lessons/:id
PATCH  /api/v1/lessons/:id

GET    /api/v1/lessons/:id/attendance
PUT    /api/v1/lessons/:id/attendance

GET    /api/v1/tuition/summary
GET    /api/v1/students/:id/tuition

GET    /api/v1/payments
POST   /api/v1/payments

POST   /api/v1/qr-payments/generate
```

### API rules

- RESTful naming; nouns, not verbs where possible.
- Version API from day one.
- Validate all body/query/path input on BE.
- Never trust `ownerId` sent by FE. Derive owner from authenticated identity.
- Pagination for growing lists.
- Filtering/sorting via query parameters.
- Use appropriate HTTP status codes.
- Do not expose raw Prisma/database errors.
- Return stable machine-readable error codes where useful.

Suggested error shape:

```json
{
  "statusCode": 400,
  "code": "PAYMENT_OVER_ALLOCATION",
  "message": "Allocated amount exceeds the outstanding balance"
}
```

Do not force every successful response into unnecessary wrappers unless there is a concrete need.

---

# 8. Security Rules

These rules are mandatory.

1. Never commit `.env` or secrets.
2. Never expose Supabase service-role keys to FE.
3. FE public environment variables must contain only values safe for browsers.
4. Verify auth token on BE for protected routes.
5. Every database query must be scoped to the authenticated owner where applicable.
6. Never accept `ownerId` from client as authorization evidence.
7. Validate all external/client input on BE.
8. Use parameterized ORM queries; never concatenate SQL from user input.
9. Escape/sanitize user-generated content when rendering. Do not use `dangerouslySetInnerHTML` for notes/names.
10. Apply rate limiting to login-adjacent/sensitive/public endpoints where relevant.
11. CORS must allow only configured FE origins in deployed environments.
12. Do not log tokens, passwords, secrets, full sensitive headers, or unnecessary student information.
13. Financial mutations should use DB transactions where multiple records are affected.
14. Swagger should not expose privileged operations publicly in production unless intentionally configured.

---

# 9. Code Quality & Style Rules

## General

- Optimize for readability and maintainability, not cleverness.
- Follow SOLID where useful; do not over-engineer simple CRUD.
- DRY means extracting genuinely reusable logic, not creating abstractions prematurely.
- Prefer small, focused functions.
- Avoid files significantly larger than ~300 lines; split by responsibility when a file becomes difficult to understand.
- Remove dead code, commented-out code, unused imports, and debug logs.
- No magic numbers/strings for domain concepts; use enums/constants.
- Comments explain **why**, not obvious **what**.
- Use `async/await` consistently.
- Errors must be handled intentionally; no empty `catch` blocks.

## TypeScript

- `strict: true`.
- Avoid `any`.
- Prefer `unknown` and narrow safely for untrusted data.
- Prefer explicit domain types/enums.
- Avoid non-null assertions (`!`) unless logically guaranteed and documented.
- Do not create giant catch-all interfaces.

## Naming

```text
Files:        kebab-case.ts / kebab-case.tsx
Components:   PascalCase
Classes:      PascalCase
Functions:    camelCase
Variables:    camelCase
Booleans:     isXxx / hasXxx / canXxx / shouldXxx
Hooks:        useXxx
DTOs:         CreateStudentDto, UpdateStudentDto
Enums:        PascalCase enum/type; values UPPER_SNAKE_CASE when serialized
```

## Formatting / linting

Both projects should configure:

- ESLint
- Prettier
- consistent import ordering
- lint script
- type-check script
- test script
- build script

Code is not complete if lint/type-check/build fails.

---

# 10. Testing Strategy

Do not chase high coverage percentages for CRUD. Prioritize domain rules.

### BE must test

- tuition calculations;
- billable/non-billable attendance behavior;
- fee snapshot behavior;
- payment allocation;
- partial payment;
- overpayment/over-allocation prevention;
- owner authorization boundaries;
- QR transfer data generation.

### FE should test critical behavior

- important form validation;
- attendance interactions;
- tuition/payment states;
- critical hooks/utilities.

For end-to-end testing later, prefer Playwright for core flows.

---

# 11. Environment Variables

Never commit actual values. Provide `.env.example`.

## EduTrack-FE

```bash
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Only keep Supabase browser variables if FE directly needs Supabase Auth. Application CRUD/data access must go through EduTrack-BE.

## EduTrack-BE

```bash
PORT=3001
NODE_ENV=development
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CORS_ORIGIN=http://localhost:3000

# Optional QR integration
VIETQR_API_BASE_URL=
VIETQR_CLIENT_ID=
VIETQR_API_KEY=
```

Only introduce provider credentials actually required by the selected VietQR integration. Do not invent required secrets when a static VietQR payload/image method is sufficient.

---

# 12. Local Development

Recommended ports:

```text
EduTrack-FE: http://localhost:3000
EduTrack-BE: http://localhost:3001
```

Recommended package manager: **pnpm** for both repositories.

Typical scripts:

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

BE additionally:

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:studio
```

Exact script names may vary, but keep them obvious and documented.

---

# 13. Git Rules

Suggested branches:

```text
main
feature/student-management
feature/class-management
feature/attendance
feature/tuition
feature/payment-qr
fix/<short-description>
```

Suggested Conventional Commit style:

```text
feat(students): add student creation form
feat(attendance): support bulk attendance update
fix(payments): prevent allocation above outstanding amount
refactor(classes): extract class form schema
chore: update dependencies
```

Do not mix unrelated features in one commit when avoidable.

---

# 14. AI Agent Rules

Any AI coding agent working on EduTrack must follow these rules:

1. Read this specification before implementing a feature.
2. Identify whether the change belongs to `EduTrack-FE`, `EduTrack-BE`, or both.
3. Respect feature boundaries; do not dump unrelated code into `common`, `utils`, or shared folders.
4. Do not introduce a new dependency when the current stack can solve the problem cleanly.
5. Before adding a library, explain the need and verify it does not duplicate an existing dependency.
6. Do not change DB schema without creating/updating a Prisma migration and considering existing data.
7. Do not put authoritative tuition/payment calculations in FE.
8. Do not access DB directly from FE.
9. Do not trust client-provided ownership, prices, totals, paid state, or calculated balances.
10. Do not expose secrets or service-role credentials.
11. Preserve historical financial values. Changing a current class fee must not rewrite old attendance fees.
12. Use transactions for multi-record financial operations.
13. Implement loading/error/empty states for new FE screens.
14. Ensure new UI works on both desktop and mobile.
15. Reuse existing feature components before creating duplicates.
16. Avoid speculative abstractions and features not requested.
17. Do not silently change API contracts. Update all consumers/types/docs when a contract changes.
18. Add tests for non-trivial business logic and bug fixes.
19. Run lint, type-check, relevant tests, and build before considering work complete.
20. If a requirement is ambiguous and affects money, attendance billing, authentication, or data deletion, ask before inventing a business rule.

## AI implementation workflow

For each feature:

```text
1. Understand requirement
2. Inspect existing feature/module
3. Define/update domain model and API contract
4. Implement BE validation + business logic + persistence
5. Add/update BE tests
6. Implement FE API layer
7. Implement query/mutation hooks
8. Implement responsive UI
9. Handle loading/error/empty/success states
10. Run lint + typecheck + tests + build
11. Summarize changed files and any migration/configuration required
```

When only FE or only BE is required, skip irrelevant steps rather than creating unnecessary code.

---

# 15. Recommended Implementation Order

### Phase 0 — Foundation

- Create `EduTrack-FE` repository.
- Create `EduTrack-BE` repository.
- Create Supabase project.
- Configure Prisma.
- Configure authentication.
- Configure environment validation.
- Configure lint/format/test/build.
- Configure Swagger.

### Phase 1 — Core Education Data

1. Authentication
2. Students
3. Classes
4. Enrollments
5. Lessons

### Phase 2 — Attendance

6. Attendance screen
7. Attendance fee snapshot
8. Attendance history

### Phase 3 — Tuition & Payments

9. Tuition calculation
10. Outstanding balance
11. Payment recording
12. Payment allocation

### Phase 4 — QR Payment

13. Bank settings
14. VietQR/payment QR generation
15. Manual payment confirmation flow

### Phase 5 — Dashboard & Polish

16. Dashboard summaries
17. Search/filter/pagination
18. Mobile UX refinement
19. Error/loading/empty states
20. Production deployment

---

# 16. Out of Scope for v1

Do not implement unless explicitly requested:

- Parent/student accounts.
- Multiple teachers/organizations.
- Native iOS/Android apps.
- Offline synchronization.
- Automatic bank transaction reconciliation/webhooks.
- SMS/Zalo/email reminders.
- Accounting/tax features.
- Complex recurring schedules.
- AI features.
- Microservices.
- Redis/message queues.
- Kubernetes.

Keep v1 intentionally small.

---

# 17. Future-Proofing Notes

The design should allow later additions without implementing them now:

- multi-teacher / multi-tenant ownership;
- parent portal;
- automated payment reconciliation;
- invoices/receipts;
- recurring lesson schedules;
- tuition policies per class/student;
- notifications;
- reports/export;
- audit log;
- PWA enhancements.

Do not pay the complexity cost for these features until they are required.

---

# 18. Definition of Done

A feature is complete only when:

- Requirement is implemented end-to-end where applicable.
- Authorization is enforced.
- Input is validated.
- Relevant business rules are tested.
- UI supports desktop and mobile.
- Loading/error/empty states exist.
- No secrets are exposed.
- No TypeScript errors.
- ESLint passes.
- Tests pass.
- Production build passes.
- DB migration is included if schema changed.
- `.env.example`/API docs are updated when configuration or contract changes.

---

## Final Principle

**EduTrack should be boring, predictable, modular, and easy to maintain.** Prefer a clear feature module and explicit business rule over clever abstractions. Financial and attendance data correctness is more important than minimizing lines of code.
