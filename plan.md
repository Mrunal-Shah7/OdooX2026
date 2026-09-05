# WORKPLAN — PeoplePay360

Four developers. ~18 hours of build time after the shared foundation lands.
Split is by vertical slice: each owner takes their modules from Prisma query
through service, route, and page.

**Boundary calls made where the artifacts were silent**

| Question | Decision |
|---|---|
| Who owns `dayAccounting.service.ts`, used by three modules? | Dev 2. Payslip correctness depends on it most; it is a pure function with a frozen signature. |
| TRD lists no `schemas/notifications.schema.ts` | `MarkNotificationsReadRequest` is validated in `schemas/users.schema.ts`. Dev 1 owns both. |
| `AttendanceWidget.tsx` and `NotificationBell.tsx` sit in `components/layout/` | Owned per-file by their module owners, not by the layout directory owner. |

---

## A. Shared foundation

**Owner: Dev 1.** Nothing else starts against real data until these land. Total ~2.5 hours,
delivered in three checkpoints so the other three are never idle.

| # | Deliverable | Files | Est. | Unblocks |
|---|---|---|---|---|
| F1 | Prisma schema: every table, enum, index, and the raw-SQL partial unique index on `payslips` | `server/prisma/schema.prisma`, `server/prisma/migrations/`, `server/src/db/client.ts` | 45 min | All server work |
| F2 | Error envelope, auth + role + scoping middleware, zod validate wrapper, pagination helper | `server/src/middleware/*`, `server/src/lib/apiError.ts`, `pagination.ts`, `env.ts`, `app.ts`, `index.ts` | 45 min | All routes |
| F3 | **Stub route registry** — every endpoint in `openapi.yaml` registered in `routes/index.ts`, each returning a hardcoded fixture in the correct envelope | `server/src/routes/index.ts` and one empty `*.routes.ts` per module | 20 min | Every developer's UI, hour one |
| F4 | Generated types + shared constants | `shared/api-types.ts`, `shared/constants.ts` | 15 min | All typed work |
| F5 | Tokens, Tailwind theme mapping, UI primitives built from `design.html` | `web/src/tokens.css`, `index.css`, `components/ui/*` | 60 min | All pages |
| F6 | API client, query keys, session context, permission helper, formatters | `web/src/lib/*` | 30 min | All pages |
| F7 | **Stub route tree** — every route path from TRD §9 registered with a placeholder component; app shell and top nav complete | `web/src/routes.tsx`, `main.tsx`, `App.tsx`, `components/layout/AppShell.tsx`, `TopNav.tsx`, `NavMenu.tsx`, `PageHeader.tsx` | 40 min | Every page, hour one |

**Delivered in the same window, by their owners, because others depend on them:**

| Deliverable | Owner | Files | Est. |
|---|---|---|---|
| Decimal arithmetic, half-up rounding, money-to-string serialisation | Dev 2 | `server/src/lib/money.ts` | 25 min |
| Calendar date helpers: month bounds, weekday, date-range expansion, `YYYY-MM-DD` handling | Dev 2 | `server/src/lib/dates.ts` | 25 min |

**Landing after F1–F7, still Dev 1, but not blocking:** `server/src/db/seed.ts` from TRD §13,
~2 hours. See risk R3.

F3 and F7 are the reason nobody waits. Once they exist, all four developers have a running
app with every route reachable and every endpoint answering in the right shape.

---

## B. Per-developer assignment

### Dev 1 — Foundation, auth, users, notifications

Owns the shared surface, so takes the modules with the fewest cross-module reads.

| | |
|---|---|
| **Modules** | `auth`, `users`, `notifications` (+ shared foundation) |
| **Effort** | ~16 h (2.5 h foundation, 2 h seed, 11.5 h modules) |

**Files owned**

PRD.md TRD.md AGENTS.md DESIGN.md design.html openapi.yaml
package.json .env.example
shared/api-types.ts shared/constants.ts
server/package.json server/tsconfig.json
server/prisma/schema.prisma server/prisma/migrations/
server/src/index.ts app.ts env.ts
server/src/middleware/requireAuth.ts requireRole.ts scopeToEmployee.ts
validate.ts errorHandler.ts
server/src/lib/apiError.ts password.ts tokens.ts mailer.ts pagination.ts
server/src/routes/index.ts auth.routes.ts users.routes.ts notifications.routes.ts
server/src/schemas/auth.schema.ts users.schema.ts
server/src/services/auth.service.ts users.service.ts notifications.service.ts
server/src/db/client.ts seed.ts
web/package.json web/index.html web/vite.config.ts web/tsconfig.json
web/src/main.tsx App.tsx routes.tsx tokens.css index.css
web/src/lib/apiClient.ts queryKeys.ts session.tsx permissions.ts format.ts cn.ts
web/src/components/ui/ (all 17 files)
web/src/components/layout/AppShell.tsx TopNav.tsx NavMenu.tsx PageHeader.tsx
NotificationBell.tsx
web/src/pages/auth/LoginPage.tsx ForgotPasswordPage.tsx SetPasswordPage.tsx
web/src/pages/users/UsersPage.tsx
web/src/pages/notifications/NotificationsPage.tsx
web/src/pages/NotFoundPage.tsx


**Endpoints owned**

| Method | Path |
|---|---|
| POST | `/api/auth/login` |
| POST | `/api/auth/logout` |
| POST | `/api/auth/refresh` |
| GET | `/api/auth/me` |
| POST | `/api/auth/forgot-password` |
| POST | `/api/auth/set-password` |
| GET | `/api/users` |
| POST | `/api/users` |
| GET | `/api/users/{id}` |
| PATCH | `/api/users/{id}` |
| POST | `/api/users/{id}/resend-invite` |
| GET | `/api/notifications` |
| POST | `/api/notifications/read` |

**Pages owned:** `/login`, `/forgot-password`, `/set-password`, `/`, `/users`,
`/notifications`, `*`

**Day-one fallback:** none needed — Dev 1 starts at the bottom of the stack. Resend can be
stubbed behind `lib/mailer.ts` writing the invite link to stdout until the API key is in hand;
the demo needs a real send only from the pay run.

---

### Dev 2 — Payroll (the hard part)

Owns the formula engine, day accounting, payslip computation, PDF and delivery. Carries **no
other module** so there is slack when compute misbehaves.

| | |
|---|---|
| **Modules** | `payroll` |
| **Effort** | ~17 h |

**Files owned**

server/src/lib/money.ts dates.ts
server/src/routes/payroll.routes.ts
server/src/schemas/payroll.schema.ts
server/src/services/dayAccounting.service.ts
server/src/services/payroll/payruns.service.ts payslips.service.ts
structures.service.ts rules.service.ts
compute.ts formula.ts payslipPdf.tsx
web/src/pages/payroll/PayrunsPage.tsx PayrunWizard.tsx PayrunDetailPage.tsx
PayslipsPage.tsx PayslipDetailPage.tsx
StructuresPage.tsx StructureFormPage.tsx
RulesPage.tsx RuleFormPage.tsx


**Endpoints owned**

| Method | Path |
|---|---|
| GET / POST | `/api/payroll/structures` |
| GET / PATCH | `/api/payroll/structures/{id}` |
| GET / POST | `/api/payroll/rules` |
| GET / PATCH / DELETE | `/api/payroll/rules/{id}` |
| GET | `/api/payroll/payruns/eligible-employees` |
| GET / POST | `/api/payroll/payruns` |
| GET | `/api/payroll/payruns/{id}` |
| POST | `/api/payroll/payruns/{id}/compute` |
| POST | `/api/payroll/payruns/{id}/validate` |
| POST | `/api/payroll/payruns/{id}/mark-paid` |
| POST | `/api/payroll/payruns/{id}/send-payslips` |
| GET | `/api/payroll/payslips` |
| GET | `/api/payroll/payslips/{id}` |
| POST | `/api/payroll/payslips/{id}/archive` |
| GET | `/api/payroll/payslips/{id}/pdf` |

**Pages owned:** `/payroll/payruns`, `/payroll/payruns/:id`, `/payroll/payslips`,
`/payroll/payslips/:id`, `/payroll/structures`, `/payroll/structures/:id`,
`/payroll/rules`, `/payroll/rules/:id`

**Day-one fallback:** `formula.ts` and `compute.ts` are pure functions with zero database
access — write and exercise both against the twelve seeded Regular Salary formulas in TRD §13
before the schema exists. `dayAccounting.service.ts` takes its inputs as plain arrays, so it
can be built and checked against hand-written fixtures while attendance and time off are still
empty tables.

---

### Dev 3 — Employees, contracts, schedules, reports

These four cluster tightly: a contract references an employee, a department, a schedule and a
structure, and every report reads across them.

| | |
|---|---|
| **Modules** | `employees`, `contracts`, `schedules`, `reports` |
| **Effort** | ~17 h |

**Files owned**

server/src/lib/csv.ts
server/src/routes/employees.routes.ts contracts.routes.ts
schedules.routes.ts reports.routes.ts
server/src/schemas/employees.schema.ts contracts.schema.ts
schedules.schema.ts reports.schema.ts
server/src/services/employees.service.ts contracts.service.ts
schedules.service.ts reports.service.ts
web/src/pages/employees/EmployeeDirectoryPage.tsx EmployeeFormPage.tsx
DepartmentsPage.tsx
web/src/pages/contracts/ContractsPage.tsx ContractFormPage.tsx
web/src/pages/schedules/SchedulesPage.tsx ScheduleFormPage.tsx HolidaysPage.tsx
web/src/pages/reports/ReportsPage.tsx


**Endpoints owned**

| Method | Path |
|---|---|
| GET / POST | `/api/employees` |
| GET / PATCH | `/api/employees/{id}` |
| GET / POST | `/api/departments` |
| PATCH / DELETE | `/api/departments/{id}` |
| GET / POST | `/api/contracts` |
| GET / PATCH | `/api/contracts/{id}` |
| GET / POST | `/api/working-schedules` |
| GET / PATCH | `/api/working-schedules/{id}` |
| GET / POST | `/api/public-holidays` |
| DELETE | `/api/public-holidays/{id}` |
| GET | `/api/reports/salary-register` |
| GET | `/api/reports/attendance-register` |
| GET | `/api/reports/leave-balance` |
| GET | `/api/reports/contract-expiry` |
| GET | `/api/reports/department-cost` |

**Pages owned:** `/employees`, `/employees/:id`, `/departments`, `/contracts`,
`/contracts/:id`, `/schedules`, `/schedules/:id`, `/holidays`, `/reports`

**Day-one fallback:** employees, departments and schedules depend on nothing outside Dev 3's
own tables — start there. Build the Salary Register and Attendance Register report tables
against the F3 stub payloads; both read tables Dev 2 and Dev 4 own, so leave them until those
tables have seeded rows. Contract-expiry and department-cost reports read only Dev 3's own
data and can be finished any time.

---

### Dev 4 — Attendance, time off, dashboard

Attendance and time off are the two sources day accounting consumes, and the dashboard is a
read-only aggregate over everything.

| | |
|---|---|
| **Modules** | `attendance`, `timeoff`, `dashboard` |
| **Effort** | ~17 h |

**Files owned**

server/src/routes/attendance.routes.ts timeoff.routes.ts dashboard.routes.ts
server/src/schemas/attendance.schema.ts timeoff.schema.ts dashboard.schema.ts
server/src/services/attendance.service.ts timeoff.service.ts dashboard.service.ts
web/src/components/layout/AttendanceWidget.tsx
web/src/components/charts/BarChartCard.tsx LineChartCard.tsx DonutRing.tsx
web/src/pages/attendance/AttendancePage.tsx AttendanceFormPage.tsx
web/src/pages/timeoff/TimeOffDashboardPage.tsx RequestsPage.tsx RequestFormPage.tsx
TypesPage.tsx TypeFormPage.tsx AllocationsPage.tsx
AllocationFormPage.tsx YearCalendar.tsx
web/src/pages/dashboard/PayrollDashboardPage.tsx


**Endpoints owned**

| Method | Path |
|---|---|
| GET / POST | `/api/attendance` |
| GET | `/api/attendance/active` |
| POST | `/api/attendance/check-in` |
| POST | `/api/attendance/check-out` |
| GET / PATCH | `/api/attendance/{id}` |
| GET / POST | `/api/time-off/types` |
| GET / PATCH | `/api/time-off/types/{id}` |
| GET / POST | `/api/time-off/allocations` |
| GET / PATCH | `/api/time-off/allocations/{id}` |
| POST | `/api/time-off/allocations/{id}/approve` |
| POST | `/api/time-off/allocations/{id}/refuse` |
| GET / POST | `/api/time-off/requests` |
| GET / PATCH | `/api/time-off/requests/{id}` |
| POST | `/api/time-off/requests/{id}/approve` |
| POST | `/api/time-off/requests/{id}/refuse` |
| GET | `/api/time-off/dashboard` |
| GET | `/api/dashboard/payroll` |

**Pages owned:** `/attendance`, `/attendance/:id`, `/time-off`, `/time-off/requests`,
`/time-off/requests/:id`, `/time-off/types`, `/time-off/types/:id`,
`/time-off/allocations`, `/time-off/allocations/:id`, `/payroll`

**Day-one fallback:** time off types and allocations depend on nothing outside Dev 4's tables —
start there, since Dev 2's day accounting needs approved allocations and requests to exist
before it can be exercised against real data. `YearCalendar.tsx` is a pure presentational
component over the `TimeOffCalendarDay[]` shape in `openapi.yaml`; build it against a
hand-written array before `getTimeOffDashboard` returns anything. The three chart components
take plain arrays and can be built from the `design.html` dashboard screen immediately.

---

## C. Shared-file registry

Every file more than one person will want changed. **Single owner. Everyone else requests the
change rather than editing.**

| File | Owner | Why others need it | How they get changes |
|---|---|---|---|
| `server/prisma/schema.prisma` | Dev 1 | Every module's tables | Request; Dev 1 amends and reruns the migration |
| `server/src/routes/index.ts` | Dev 1 | Every module registers here | Pre-registered in F3; nobody should need to touch it |
| `server/src/middleware/*` | Dev 1 | Auth, roles, employee scoping on every route | Request |
| `server/src/lib/apiError.ts` | Dev 1 | Every error path | Codes are frozen in TRD §7; no change should be needed |
| `server/src/lib/mailer.ts` | Dev 1 | Dev 2 sends payslips | Dev 1 exposes `sendMail({to, subject, html, attachments})`; Dev 2 calls it |
| `server/src/db/seed.ts` | Dev 1 | Everyone needs their screens populated | Request; send the data block, Dev 1 merges |
| `shared/constants.ts` | Dev 1 | Enum values, role ordering | Frozen from TRD §3; request only if an enum is missing |
| `shared/api-types.ts` | Dev 1 | Everyone imports it | Never hand-edited; regenerated from `openapi.yaml` |
| `web/src/routes.tsx` | Dev 1 | Every page registers here | Pre-registered in F7; nobody should need to touch it |
| `web/src/tokens.css` | Dev 1 | Every styled element | Request a new token; never hardcode |
| `web/src/components/ui/*` | Dev 1 | Every page | Request a variant; never fork a primitive into a page |
| `web/src/lib/apiClient.ts` | Dev 1 | Every query | Request |
| `web/src/lib/queryKeys.ts` | Dev 1 | Every query and invalidation | Pre-populated with one namespace per module in F6 |
| `web/src/components/layout/TopNav.tsx`, `NavMenu.tsx` | Dev 1 | Nav entries for every module | Full nav from TRD §9 built in F7; no later change expected |
| `server/src/lib/money.ts` | Dev 2 | Dev 3 reports, Dev 4 dashboard serialise money | Request |
| `server/src/lib/dates.ts` | Dev 2 | Dev 3 schedules, Dev 4 attendance and time off | Request |
| `server/src/services/dayAccounting.service.ts` | Dev 2 | Dev 4 time off dashboard, Dev 3 attendance register | Request; signature frozen at seam S1 |
| `server/src/lib/csv.ts` | Dev 3 | Only reports use it today | Request |

---

## D. Interface points

| # | Seam | Between | Contract |
|---|---|---|---|
| S1 | `dayAccounting.service.ts` | Dev 2 → Dev 3, Dev 4 | `getDayBreakdown({ employeeId, scheduleId, contractId?, from, to })` returns `{ scheduledDates, presentDays, paidLeaveDays, unpaidLeaveDays, absentDays, overtimeHours, workedDays, proration, perDate }`. All quantities are `Decimal`. `perDate` carries `{ date, kind, timeOffTypeId, fraction }` and is what feeds the year calendar. Signature is frozen once Dev 2 publishes it; TRD §3 "Day accounting" is the specification. |
| S2 | Attendance status pre-fill | Dev 4 reads Dev 3's `working_schedule_days` | Dev 4 queries the schedule's day row for the check-in weekday and compares `startTime`. Read-only; no shared file. If the row is missing, status defaults to `present`, never an error. |
| S3 | Payslip tables → dashboard | Dev 2 → Dev 4 | Dev 4 reads `payslips` and `payslip_lines` directly. Rules: exclude `archivedAt IS NOT NULL` from every aggregate; `totalDeductions` is stored positive; `net` is authoritative and never recomputed from lines. |
| S4 | Payslip tables → salary register | Dev 2 → Dev 3 | Same three rules as S3. The report's Allowances column is the sum of `payslip_lines` in category `allowance`, not a payslip column. |
| S5 | Eligible-employee list | Dev 2 reads Dev 3's `contracts` | `running` status, date range overlaps the period, employee `active`, employee type matches. Dev 3 guarantees no overlapping `running` contracts per employee. |
| S6 | Contract form → salary structures | Dev 3 reads Dev 2's `salary_structures` | Dev 3 calls `listSalaryStructures` for the select. Read-only; needs Dev 2's endpoint live or the F3 stub. |
| S7 | Approval → notification | Dev 4 → Dev 1 | Dev 4 calls `notifications.service.ts` `create({ userId, type, title, body, linkPath })` on request submit, approve and refuse. Dev 2 calls the same on send-payslips and validate. Fire-and-forget; a notification failure never fails the parent operation. |
| S8 | Payslip PDF → email | Dev 2 → Dev 1 | Dev 2 generates a `Buffer` from `payslipPdf.tsx` and passes it to `mailer.sendMail` as an attachment. Dev 1 owns transport; Dev 2 owns content and the per-payslip `sentAt` write. |
| S9 | Session and permissions | Dev 1 → everyone | `useSession()` returns `{ user, role, employeeId }`; `can(role, capability)` reads the TRD §8 capability matrix. Every page hides actions with `can()` — server-side gating is still authoritative. |

---

## E. Integration risks

| # | Risk | Why it bites | Prevent it in advance |
|---|---|---|---|
| R1 | **Money crosses the wire as a JSON number somewhere** | Prisma returns `Decimal`; a single `Number()` or a bare `res.json(payslip)` drops precision, and the payslip total stops matching the sum of its lines in front of a judge. | Dev 2 ships `money.ts` in the foundation window with one exported serialiser, and every service passes domain objects through it before the route responds. Dev 1 adds an assertion in `errorHandler.ts`-adjacent response shaping is not enough — the rule is that no route returns a raw Prisma object. Check this at the first end-to-end compute, not at hour 16. |
| R2 | **`dayAccounting` drifts between its three callers** | Dev 2 builds it for payslips, Dev 4 needs `perDate` for the year calendar, Dev 3 needs per-day status for the attendance register. If Dev 2 ships a payslip-shaped return, the other two write their own day loops and the numbers disagree between the calendar, the register and the payslip. | Dev 2 publishes the S1 signature — including `perDate` — within the first two hours, before writing the body. Dev 3 and Dev 4 code against that signature immediately. No one writes a second date-expansion loop. |
| R3 | **Seed data doesn't produce the demo state** | The demo turns on very specific rows: Aarav's two contracts, exactly two employees with null bank fields, three contracts expiring in September, an archived August payslip, July paid and August validated. If seed is written late or loosely, steps 3, 11, 20 and 22 of the demo script fail with nothing left to fix them. | Dev 1 writes seed against TRD §13 immediately after the foundation, not at the end. Each developer runs the demo steps that touch their module as soon as their screens render, and sends missing data blocks to Dev 1 the moment a step doesn't work. |
| R4 | **Role gating applied inconsistently across four route files** | `scopeToEmployee` must force `employeeId` on every list an `employee` can reach — employees, attendance, time off, payslips. Four owners, four chances to forget, and one miss means an employee sees the whole company's salaries during the demo. | Dev 1 makes scoping opt-out rather than opt-in: the middleware runs on every authenticated route by default, and a route must explicitly declare itself unscoped. Every owner walks their own list endpoints signed in as the seeded `employee` account once their pages render. |