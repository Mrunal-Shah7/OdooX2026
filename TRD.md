# TRD — PeoplePay360

> This document is the technical contract. Four separate AI agents implement against it without
> coordinating. Anything left ambiguous here becomes a merge conflict later.

---

## 1. Locked Stack

Pinned major versions. No entry may be changed once this document is written.

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Runtime | Node.js | 22 LTS | ESM (`"type": "module"`), `--env-file` for env loading |
| Language | TypeScript | 5.6 | `strict: true` in both packages |
| Frontend | React + Vite | React 19, Vite 6 | No meta-framework |
| Routing | @tanstack/react-router | 1 | Single code-defined route tree; no file routing, no codegen plugin |
| Server state | @tanstack/react-query | 5 | Every read goes through a query; no `useEffect` fetching |
| Tables | @tanstack/react-table | 8 | All list views |
| Styling | Tailwind CSS | 4 | Theme maps onto `tokens.css`; Tailwind defines no colour of its own |
| UI primitives | shadcn/ui, restyled | — | Copied into `web/src/components/ui/`, then rewritten against tokens |
| Charts | recharts | 2 | Dashboard only; colours from `--color-chart-*` |
| Backend | Express | 5 | No Nest, no decorators |
| ORM / migrations | Prisma | 6 | Schema-as-code, migrations checked in |
| Database | PostgreSQL | 16 | Local |
| Validation | zod | 3 | Request parsing and type inference |
| Types | openapi-typescript | 7 | Generated from `openapi.yaml` into `shared/api-types.ts` |
| Email | resend | 4 | Invites, password resets, payslip delivery |
| PDF | @react-pdf/renderer | 4 | Server-side, streamed; no browser binary, no storage |

**Permitted dependencies beyond the table.** This is the complete allowlist. Nothing else may be
installed, by anyone, for any reason.

| Package | Why |
|---|---|
| `cors` | Express 5 ships no CORS handling |
| `cookie-parser` | Express 5 ships no cookie parsing and auth is cookie-based |
| `jsonwebtoken`, `@types/jsonwebtoken` | Hand-rolling JWT sign/verify is a correctness risk not worth 20 hours |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Required by shadcn component source |
| `lucide-react` | Icon set required by shadcn component source |
| `@radix-ui/react-{dialog,dropdown-menu,select,popover,tabs,checkbox,label}` | Only these seven primitives; anything else is hand-built |
| `@fontsource-variable/inter`, `@fontsource/ibm-plex-mono` | Self-hosted fonts; no CDN at runtime |
| `tsx` | TypeScript execution for the server in development |

**Dependency rule:** if something outside this list appears unavoidable, stop and ask. Do not install.

## 2. Architecture

A React SPA talks to an Express API over JSON. All business logic lives in `services/`. Routes
parse, validate, delegate and shape the response — they contain no logic. Nothing outside `db/`
issues a Prisma query. Payroll computation is a pure function over data the service has already
loaded, so it can be reasoned about and tested without a database.

Browser
└─ React SPA (Vite)
├─ routes.tsx single TanStack Router route tree
├─ lib/apiClient.ts typed fetch wrapper, types from openapi.yaml
└─ TanStack Query cache
│ JSON over HTTP, httpOnly cookies
▼
Express API
├─ middleware/ auth, role gating, employee scoping, error envelope
├─ routes/ thin: parse with zod, delegate, respond
├─ services/ all business logic
│ └─ payroll/ formula parser + payslip computation (pure)
└─ db/ Prisma client, seed
│
▼
PostgreSQL 16


## 3. Database Schema

All ids are `uuid` defaulting to `gen_random_uuid()`. All timestamps are `timestamptz`.
All money is `Decimal(14,2)`. All field names are `camelCase` in Prisma, in the database and in JSON.
Every table has `createdAt timestamptz not null default now()`; tables that are edited after
creation also have `updatedAt timestamptz not null` maintained by Prisma's `@updatedAt`.

### `companies`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| name | text | no | — | |
| baseCurrency | text | no | 'INR' | enum: `currency` |
| timezone | text | no | 'Asia/Kolkata' | IANA name |
| createdAt | timestamptz | no | now() | |

Exactly one row exists. Services read it by `findFirst`.

### `users`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| email | text | no | — | unique, lowercased on write |
| passwordHash | text | yes | null | null until the invite is accepted |
| role | text | no | 'employee' | enum: `user_role` |
| status | text | no | 'invited' | enum: `user_status` |
| employeeId | uuid | yes | null | unique, FK → `employees.id` ON DELETE SET NULL |
| lastLoginAt | timestamptz | yes | null | |
| createdAt | timestamptz | no | now() | |
| updatedAt | timestamptz | no | — | |

**Indexes:** `users(email)` unique, `users(employeeId)` unique

### `refresh_tokens`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| userId | uuid | no | — | FK → `users.id` ON DELETE CASCADE |
| tokenHash | text | no | — | unique, SHA-256 of the raw token |
| expiresAt | timestamptz | no | — | |
| revokedAt | timestamptz | yes | null | |
| createdAt | timestamptz | no | now() | |

**Indexes:** `refresh_tokens(tokenHash)` unique, `refresh_tokens(userId)`

### `auth_tokens`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| userId | uuid | no | — | FK → `users.id` ON DELETE CASCADE |
| tokenHash | text | no | — | unique, SHA-256 of the raw token |
| purpose | text | no | — | enum: `auth_token_purpose` |
| expiresAt | timestamptz | no | — | issue + 72 hours |
| usedAt | timestamptz | yes | null | single use |
| createdAt | timestamptz | no | now() | |

**Indexes:** `auth_tokens(tokenHash)` unique, `auth_tokens(userId, purpose)`

### `departments`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| companyId | uuid | no | — | FK → `companies.id` ON DELETE RESTRICT |
| name | text | no | — | unique |
| code | text | no | — | unique, uppercase, max 8 chars |
| managerId | uuid | yes | null | FK → `employees.id` ON DELETE SET NULL |
| createdAt | timestamptz | no | now() | |

### `employees`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| companyId | uuid | no | — | FK → `companies.id` ON DELETE RESTRICT |
| firstName | text | no | — | |
| lastName | text | no | — | |
| workEmail | text | no | — | unique |
| personalEmail | text | yes | null | |
| phone | text | yes | null | |
| departmentId | uuid | no | — | FK → `departments.id` ON DELETE RESTRICT |
| jobPosition | text | no | — | free text |
| managerId | uuid | yes | null | FK → `employees.id` ON DELETE SET NULL, informational only |
| workingScheduleId | uuid | no | — | FK → `working_schedules.id` ON DELETE RESTRICT |
| employeeType | text | no | — | enum: `employee_type` |
| status | text | no | 'active' | enum: `employee_status` |
| joiningDate | date | no | — | |
| workLocation | text | yes | null | |
| bankName | text | yes | null | |
| bankAccountHolder | text | yes | null | |
| bankAccountNumber | text | yes | null | last four shown in UI |
| bankIfsc | text | yes | null | |
| createdAt | timestamptz | no | now() | |
| updatedAt | timestamptz | no | — | |

**Indexes:** `employees(workEmail)` unique, `employees(departmentId)`, `employees(status)`

### `working_schedules`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| companyId | uuid | no | — | FK → `companies.id` ON DELETE RESTRICT |
| name | text | no | — | unique |
| timezone | text | no | — | copied from company on create |
| daysPerWeek | integer | no | 0 | derived; recomputed on every day-row write |
| hoursPerWeek | decimal(5,2) | no | 0 | derived; recomputed on every day-row write |
| active | boolean | no | true | |
| createdAt | timestamptz | no | now() | |
| updatedAt | timestamptz | no | — | |

### `working_schedule_days`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| scheduleId | uuid | no | — | FK → `working_schedules.id` ON DELETE CASCADE |
| dayOfWeek | integer | no | — | ISO: 1 = Monday … 7 = Sunday |
| startTime | text | no | — | `HH:MM`, 24-hour |
| endTime | text | no | — | `HH:MM`, 24-hour, must be after startTime |
| breakHours | decimal(4,2) | no | 0 | |
| hours | decimal(4,2) | no | — | derived: end − start − break |

**Indexes:** `working_schedule_days(scheduleId, dayOfWeek)` unique

### `public_holidays`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| companyId | uuid | no | — | FK → `companies.id` ON DELETE RESTRICT |
| name | text | no | — | |
| date | date | no | — | |
| createdAt | timestamptz | no | now() | |

**Indexes:** `public_holidays(companyId, date)` unique

### `contracts`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| reference | text | no | — | unique, `CON/YYYY/NNNN` |
| employeeId | uuid | no | — | FK → `employees.id` ON DELETE RESTRICT |
| departmentId | uuid | no | — | FK → `departments.id` ON DELETE RESTRICT |
| jobPosition | text | no | — | |
| workingScheduleId | uuid | no | — | FK → `working_schedules.id` ON DELETE RESTRICT |
| salaryStructureId | uuid | no | — | FK → `salary_structures.id` ON DELETE RESTRICT |
| startDate | date | no | — | |
| endDate | date | yes | null | null means open-ended |
| wage | decimal(14,2) | no | — | monthly, in `currency` |
| currency | text | no | — | enum: `currency` |
| status | text | no | 'draft' | enum: `contract_status` |
| notes | text | yes | null | |
| createdAt | timestamptz | no | now() | |
| updatedAt | timestamptz | no | — | |

**Indexes:** `contracts(reference)` unique, `contracts(employeeId, startDate)`, `contracts(status)`

**Service-level constraint:** on create and update, reject when another contract for the same
employee has status `running` and its `[startDate, endDate ?? infinity]` range overlaps this one.
Error code `CONFLICT`, message names the other contract's reference.

### `attendance_records`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| employeeId | uuid | no | — | FK → `employees.id` ON DELETE CASCADE |
| date | date | no | — | |
| checkIn | timestamptz | yes | null | |
| checkOut | timestamptz | yes | null | |
| workedHours | decimal(6,2) | no | 0 | derived from checkIn/checkOut |
| overtimeHours | decimal(6,2) | no | 0 | manual only |
| status | text | no | — | enum: `attendance_status` |
| notes | text | yes | null | |
| isManualEdit | boolean | no | false | |
| createdAt | timestamptz | no | now() | |
| updatedAt | timestamptz | no | — | |

**Indexes:** `attendance_records(employeeId, date)` unique, `attendance_records(date)`

### `time_off_types`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| companyId | uuid | no | — | FK → `companies.id` ON DELETE RESTRICT |
| name | text | no | — | unique |
| code | text | no | — | unique, uppercase, max 8 chars |
| unit | text | no | 'days' | enum: `time_off_unit` |
| requiresAllocation | boolean | no | true | |
| isPaid | boolean | no | true | decides whether the leave counts as worked |
| approvalRole | text | no | 'hr_manager' | enum: `user_role`, minimum role that may approve |
| color | text | no | — | hex, taken from the `--color-chart-*` palette |
| active | boolean | no | true | |
| createdAt | timestamptz | no | now() | |
| updatedAt | timestamptz | no | — | |

### `time_off_allocations`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| employeeId | uuid | no | — | FK → `employees.id` ON DELETE CASCADE |
| timeOffTypeId | uuid | no | — | FK → `time_off_types.id` ON DELETE RESTRICT |
| allocated | decimal(6,2) | no | — | in the type's unit |
| validFrom | date | no | — | |
| validTo | date | no | — | must be ≥ validFrom |
| status | text | no | 'draft' | enum: `allocation_status` |
| approverId | uuid | yes | null | FK → `employees.id` ON DELETE SET NULL |
| description | text | yes | null | |
| createdAt | timestamptz | no | now() | |
| updatedAt | timestamptz | no | — | |

**Indexes:** `time_off_allocations(employeeId, timeOffTypeId)`

`taken` and `remaining` are never stored. `taken` is the sum of `durationDays` (day-unit types) or
`durationHours` (hour-unit types) across `approved` requests whose `allocationId` is this row.

### `time_off_requests`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| employeeId | uuid | no | — | FK → `employees.id` ON DELETE CASCADE |
| timeOffTypeId | uuid | no | — | FK → `time_off_types.id` ON DELETE RESTRICT |
| allocationId | uuid | yes | null | FK → `time_off_allocations.id` ON DELETE SET NULL |
| startDate | date | no | — | |
| endDate | date | no | — | must be ≥ startDate |
| durationType | text | no | 'full_day' | enum: `time_off_duration_type` |
| requestedHours | decimal(6,2) | yes | null | required when durationType is `hours` |
| durationDays | decimal(6,2) | no | — | derived |
| durationHours | decimal(6,2) | no | — | derived |
| status | text | no | 'to_approve' | enum: `request_status` |
| approverId | uuid | yes | null | FK → `employees.id` ON DELETE SET NULL |
| reason | text | yes | null | |
| refusalReason | text | yes | null | |
| createdAt | timestamptz | no | now() | |
| updatedAt | timestamptz | no | — | |

**Indexes:** `time_off_requests(employeeId, startDate)`, `time_off_requests(status)`

`half_day` is only legal when `startDate` equals `endDate`.

### `salary_structures`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| companyId | uuid | no | — | FK → `companies.id` ON DELETE RESTRICT |
| name | text | no | — | unique |
| code | text | no | — | unique, uppercase, max 12 chars |
| active | boolean | no | true | |
| createdAt | timestamptz | no | now() | |
| updatedAt | timestamptz | no | — | |

### `salary_rules`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| structureId | uuid | no | — | FK → `salary_structures.id` ON DELETE CASCADE |
| name | text | no | — | |
| code | text | no | — | uppercase, `[A-Z][A-Z0-9_]{0,15}` |
| category | text | no | — | enum: `rule_category` |
| sequence | integer | no | — | ascending execution order |
| computation | text | no | — | enum: `rule_computation` |
| amount | decimal(14,2) | yes | null | required when computation is `fixed` |
| percentage | decimal(7,3) | yes | null | required when computation is `percentage` |
| percentageBase | text | yes | null | enum: `percentage_base`, required when `percentage` |
| formula | text | yes | null | required when computation is `formula` |
| active | boolean | no | true | |
| createdAt | timestamptz | no | now() | |
| updatedAt | timestamptz | no | — | |

**Indexes:** `salary_rules(structureId, code)` unique, `salary_rules(structureId, sequence)`

### `payruns`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| companyId | uuid | no | — | FK → `companies.id` ON DELETE RESTRICT |
| name | text | no | — | e.g. "September 2026" |
| salaryStructureId | uuid | no | — | FK → `salary_structures.id` ON DELETE RESTRICT |
| employeeType | text | yes | null | enum: `employee_type`; null means all types |
| periodStart | date | no | — | first day of a calendar month |
| periodEnd | date | no | — | last day of the same month |
| payoutCurrency | text | no | — | enum: `currency` |
| exchangeRate | decimal(12,6) | no | 1 | contract currency → payout currency |
| status | text | no | 'draft' | enum: `payrun_status` |
| paidAt | timestamptz | yes | null | |
| createdById | uuid | yes | null | FK → `users.id` ON DELETE SET NULL |
| createdAt | timestamptz | no | now() | |
| updatedAt | timestamptz | no | — | |

**Indexes:** `payruns(periodStart)`

### `payslips`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| payrunId | uuid | no | — | FK → `payruns.id` ON DELETE CASCADE |
| employeeId | uuid | no | — | FK → `employees.id` ON DELETE RESTRICT |
| contractId | uuid | yes | null | FK → `contracts.id` ON DELETE RESTRICT; null when no contract resolved |
| salaryStructureId | uuid | no | — | FK → `salary_structures.id` ON DELETE RESTRICT |
| periodStart | date | no | — | copied from the pay run |
| periodEnd | date | no | — | copied from the pay run |
| currency | text | no | — | enum: `currency`, from the contract |
| payoutCurrency | text | no | — | enum: `currency`, frozen from the pay run |
| exchangeRate | decimal(12,6) | no | — | frozen from the pay run at compute |
| scheduledDays | decimal(6,2) | no | 0 | |
| workedDays | decimal(6,2) | no | 0 | |
| paidLeaveDays | decimal(6,2) | no | 0 | |
| unpaidLeaveDays | decimal(6,2) | no | 0 | |
| absentDays | decimal(6,2) | no | 0 | |
| overtimeHours | decimal(6,2) | no | 0 | |
| proration | decimal(8,6) | no | 0 | workedDays ÷ scheduledDays |
| basic | decimal(14,2) | no | 0 | |
| gross | decimal(14,2) | no | 0 | |
| totalDeductions | decimal(14,2) | no | 0 | positive |
| net | decimal(14,2) | no | 0 | |
| status | text | no | 'draft' | enum: `payslip_status` |
| warnings | jsonb | no | '[]' | array of `{ code, message, blocking }` |
| archivedAt | timestamptz | yes | null | |
| sentAt | timestamptz | yes | null | |
| createdAt | timestamptz | no | now() | |
| updatedAt | timestamptz | no | — | |

**Indexes:** `payslips(payrunId)`, `payslips(employeeId, periodStart)`

**Raw-SQL migration required** (Prisma cannot express a partial unique index):
```sql
CREATE UNIQUE INDEX payslips_active_period_unique
  ON payslips ("employeeId", "periodStart")
  WHERE "archivedAt" IS NULL;
```

### `payslip_lines`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| payslipId | uuid | no | — | FK → `payslips.id` ON DELETE CASCADE |
| ruleCode | text | no | — | snapshot; not a FK |
| ruleName | text | no | — | snapshot |
| category | text | no | — | enum: `rule_category` |
| sequence | integer | no | — | |
| amount | decimal(14,2) | no | — | positive, even for deductions |

**Indexes:** `payslip_lines(payslipId, sequence)`

### `notifications`
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| userId | uuid | no | — | FK → `users.id` ON DELETE CASCADE |
| type | text | no | — | enum: `notification_type` |
| title | text | no | — | |
| body | text | no | — | |
| linkPath | text | yes | null | in-app route |
| readAt | timestamptz | yes | null | |
| createdAt | timestamptz | no | now() | |

**Indexes:** `notifications(userId, readAt)`

### Relationships

companies 1──* departments, employees, working_schedules, public_holidays,
time_off_types, salary_structures, payruns
departments 1──* employees (departmentId)
employees 1──1 users (users.employeeId)
employees 1──* contracts (employeeId)
employees 1──* attendance_records (employeeId)
employees 1──* time_off_allocations (employeeId)
employees 1──* time_off_requests (employeeId)
employees 1──* payslips (employeeId)
working_schedules 1──* working_schedule_days, employees, contracts
salary_structures 1──* salary_rules, contracts, payruns
time_off_types 1──* time_off_allocations, time_off_requests
time_off_allocations 1──* time_off_requests (allocationId)
payruns 1──* payslips
payslips 1──* payslip_lines
users 1──* refresh_tokens, auth_tokens, notifications


### Enumerations

Every enum value used anywhere. No agent invents a variant.

| Enum | Values |
|---|---|
| `user_role` | `employee`, `hr_manager`, `hr_payroll_user`, `hr_payroll_manager`, `admin` |
| `user_status` | `invited`, `active`, `disabled` |
| `auth_token_purpose` | `invite`, `password_reset` |
| `currency` | `INR`, `USD` |
| `employee_type` | `full_time`, `part_time`, `contract`, `intern` |
| `employee_status` | `active`, `inactive` |
| `contract_status` | `draft`, `running`, `expired`, `cancelled` |
| `attendance_status` | `present`, `late`, `absent`, `half_day`, `on_leave` |
| `time_off_unit` | `days`, `hours` |
| `time_off_duration_type` | `full_day`, `half_day`, `hours` |
| `allocation_status` | `draft`, `approved`, `refused` |
| `request_status` | `to_approve`, `approved`, `refused`, `cancelled` |
| `rule_category` | `basic`, `allowance`, `gross`, `deduction`, `net` |
| `rule_computation` | `fixed`, `percentage`, `formula` |
| `percentage_base` | `contract_wage`, `basic`, `gross` |
| `payrun_status` | `draft`, `computed`, `validated`, `paid` |
| `payslip_status` | `draft`, `computed`, `done`, `paid` |
| `notification_type` | `time_off_requested`, `time_off_approved`, `time_off_refused`, `payslip_sent`, `payrun_validated` |
| `payslip_warning_code` | `MISSING_BANK_ACCOUNT`, `NO_ACTIVE_CONTRACT`, `DUPLICATE_PAYSLIP`, `CONTRACT_EXPIRING`, `ZERO_WORKED_DAYS`, `UNRECORDED_ATTENDANCE` |

### State transitions

Any transition not listed is rejected with `CONFLICT`.

user: invited ──set password──▶ active ──disable──▶ disabled ──enable──▶ active

contract: draft ──activate──▶ running ──period ends──▶ expired
└──cancel──▶ cancelled running ──cancel──▶ cancelled

allocation: draft ──approve──▶ approved
└──refuse──▶ refused approved ──refuse──▶ refused

request: to_approve ──approve──▶ approved ──refuse──▶ refused
├──refuse───▶ refused
└──cancel───▶ cancelled (employee, own request only)

payrun: draft ──compute──▶ computed ──validate──▶ validated ──mark paid──▶ paid
└──compute (again)──▶ computed

payslip: draft ──compute──▶ computed ──payrun validated──▶ done ──payrun paid──▶ paid
any state ──archive──▶ (archivedAt set, status unchanged)


`MISSING_BANK_ACCOUNT`, `NO_ACTIVE_CONTRACT` and `DUPLICATE_PAYSLIP` are blocking and prevent
`validate`. `CONTRACT_EXPIRING`, `ZERO_WORKED_DAYS` and `UNRECORDED_ATTENDANCE` are advisory.

### Day accounting (used by payslip compute, the time off dashboard and the attendance report)

For an employee, a schedule and a date range, one shared service function produces the day breakdown:

1. `scheduledDates` = every date in the range whose ISO weekday has a `working_schedule_days` row,
   excluding any date present in `public_holidays`, and, when a contract is supplied, excluding any
   date outside `[contract.startDate, contract.endDate ?? range end]`
2. `dailyHours` = `schedule.hoursPerWeek ÷ schedule.daysPerWeek`
3. For each scheduled date, in this order:
   - an `approved` request covering the date contributes `1` for `full_day`, `0.5` for `half_day`
     with no `requestedHours`, or `requestedHours ÷ dailyHours` otherwise, capped at `1`
   - that contribution lands in `paidLeaveDays` when the type's `isPaid` is true, otherwise in
     `unpaidLeaveDays`
   - the remainder of the day is settled by the attendance record: `present` and `late` contribute
     `1`, `half_day` contributes `0.5`, `absent` and `on_leave` contribute `0`
   - a date with no leave contribution and no attendance record contributes `0` and increments
     `absentDays`, and raises `UNRECORDED_ATTENDANCE` once for the payslip
   - the sum of leave and attendance contributions for a single date is capped at `1`
4. `presentDays` = the attendance contributions; `workedDays` = `presentDays + paidLeaveDays`
5. `proration` = `workedDays ÷ scheduledDates.length`, or `0` when there are no scheduled dates

### Salary formula language

Implemented by a hand-written tokenizer and recursive-descent parser in
`server/src/services/payroll/formula.ts`. No `eval`, no `Function`, no dependency.

- **Literals** — decimal numbers, and percentages written `20%` which evaluate to `0.2`
- **Operators** — `+ - * /`, unary `-`, and parentheses; standard precedence
- **Functions** — `min(a, b)`, `max(a, b)`, `round(a)`, `round(a, n)`
- **Rule references** — `{CODE}` yields the already-computed amount of that rule, or `0` if the
  rule is inactive or absent from the structure
- **Variables** — bare uppercase identifiers, exactly these:

| Variable | Meaning |
|---|---|
| `CONTRACT_WAGE` | Monthly wage on the applicable contract |
| `SCHEDULED_DAYS` | Scheduled working days in the period |
| `WORKED_DAYS` | Present days plus paid leave days |
| `PAID_LEAVE_DAYS` | Approved paid leave days |
| `UNPAID_LEAVE_DAYS` | Approved unpaid leave days |
| `ABSENT_DAYS` | Scheduled days with no presence and no approved leave |
| `OVERTIME_HOURS` | Sum of overtime hours on attendance in the period |
| `DAILY_RATE` | `CONTRACT_WAGE ÷ SCHEDULED_DAYS`, or `0` when scheduled days is `0` |
| `HOURLY_RATE` | `DAILY_RATE ÷ (hoursPerWeek ÷ daysPerWeek)` |
| `PRORATION` | `WORKED_DAYS ÷ SCHEDULED_DAYS`, or `0` |
| `BASIC` | Running total of computed lines in category `basic` |
| `ALLOWANCE` | Running total of computed lines in category `allowance` |
| `GROSS` | Running total of computed lines in category `gross` |
| `DEDUCTION` | Running total of computed lines in category `deduction` |

- Division by zero yields `0` rather than throwing
- A reference to a rule whose sequence is greater than or equal to the referencing rule's sequence
  is rejected at rule save time and again at compute time, with `VALIDATION_FAILED`
- A parse error is reported with the character offset and is rejected at rule save time

### Payslip computation

Executed inside one transaction per pay run.

1. Resolve the applicable contract: the employee's `running` contract overlapping the period.
   Zero matches → payslip with `NO_ACTIVE_CONTRACT`, all amounts `0`. Two or more → same warning.
2. Refuse if a non-archived payslip already exists for this employee and `periodStart` in another
   pay run; record `DUPLICATE_PAYSLIP`.
3. Compute the day breakdown from the contract's working schedule.
4. Load the pay run's structure's active rules ordered by `sequence`, then `code`.
5. For each rule in order, compute its amount:
   - `fixed` → `amount`
   - `percentage` → `percentage ÷ 100 × base`, where base is `CONTRACT_WAGE`, `BASIC` or `GROSS`
   - `formula` → evaluate against the variable set and the running category totals
   - Round half-up to 2 decimals, store as a `payslip_lines` row, then add to its category total
6. `basic` = category total `basic`; `gross` = category total `gross`;
   `totalDeductions` = category total `deduction`; `net` = the amount of the last `net` rule, or
   `gross − totalDeductions` when the structure has no `net` rule.
7. Raise `MISSING_BANK_ACCOUNT` when `bankAccountNumber` is null, `CONTRACT_EXPIRING` when the
   contract ends inside the period, and `ZERO_WORKED_DAYS` when `workedDays` is `0`.
8. Money in the payout currency is derived at display and PDF time as `amount × exchangeRate`;
   only the contract-currency amounts are stored.

## 4. Modules

The unit of ownership. Each module is a vertical slice with its own routes, service and pages.
These names are used identically in the file structure and in the `openapi.yaml` tags.

| Module | Owns (data) | Owns (routes) | Owns (pages) | Depends on |
|---|---|---|---|---|
| `auth` | users (auth fields), refresh_tokens, auth_tokens | `/api/auth/*` | `/login`, `/forgot-password`, `/set-password` | — |
| `users` | users (role, status, linkage) | `/api/users/*` | `/users` | auth, employees |
| `employees` | employees, departments, companies | `/api/employees/*`, `/api/departments/*` | `/employees`, `/employees/:id`, `/departments` | auth, schedules |
| `contracts` | contracts | `/api/contracts/*` | `/contracts`, `/contracts/:id` | auth, employees, payroll |
| `schedules` | working_schedules, working_schedule_days, public_holidays | `/api/working-schedules/*`, `/api/public-holidays/*` | `/schedules`, `/schedules/:id`, `/holidays` | auth |
| `attendance` | attendance_records | `/api/attendance/*` | `/attendance`, `/attendance/:id` | auth, employees, schedules |
| `timeoff` | time_off_types, time_off_allocations, time_off_requests | `/api/time-off/*` | `/time-off`, `/time-off/requests`, `/time-off/requests/:id`, `/time-off/types`, `/time-off/types/:id`, `/time-off/allocations`, `/time-off/allocations/:id` | auth, employees, schedules, notifications |
| `payroll` | salary_structures, salary_rules, payruns, payslips, payslip_lines | `/api/payroll/*` | `/payroll/payruns`, `/payroll/payruns/:id`, `/payroll/payslips`, `/payroll/payslips/:id`, `/payroll/structures`, `/payroll/structures/:id`, `/payroll/rules`, `/payroll/rules/:id` | auth, employees, contracts, attendance, timeoff, schedules |
| `dashboard` | — | `/api/dashboard/*` | `/payroll` | payroll, employees, attendance, timeoff |
| `reports` | — | `/api/reports/*` | `/reports` | payroll, employees, attendance, timeoff, contracts |
| `notifications` | notifications | `/api/notifications/*` | `/notifications` | auth |

## 5. API Endpoints

Full detail lives in `openapi.yaml`. This table is the index and matches that file exactly.
Auth column gives the minimum role. `employee` means any authenticated user, scoped to own records.

| Method | Path | Module | operationId | Auth | Purpose |
|---|---|---|---|---|---|
| POST | `/api/auth/login` | auth | `login` | none | Exchange credentials for session cookies |
| POST | `/api/auth/logout` | auth | `logout` | employee | Revoke the refresh token and clear cookies |
| POST | `/api/auth/refresh` | auth | `refreshSession` | none | Rotate the refresh token, issue a new access token |
| GET | `/api/auth/me` | auth | `getCurrentUser` | employee | Current user, role and linked employee |
| POST | `/api/auth/forgot-password` | auth | `requestPasswordReset` | none | Email a reset link; always responds 204 |
| POST | `/api/auth/set-password` | auth | `setPassword` | none | Consume an invite or reset token and set a password |
| GET | `/api/users` | users | `listUsers` | admin | Paginated user list |
| POST | `/api/users` | users | `createUser` | admin | Create a user and send the invite |
| GET | `/api/users/{id}` | users | `getUser` | admin | Single user |
| PATCH | `/api/users/{id}` | users | `updateUser` | admin | Change role, status or employee linkage |
| POST | `/api/users/{id}/resend-invite` | users | `resendInvite` | admin | Reissue the invite token and email |
| GET | `/api/employees` | employees | `listEmployees` | employee | Paginated, filterable employee list |
| POST | `/api/employees` | employees | `createEmployee` | hr_manager | Create an employee |
| GET | `/api/employees/{id}` | employees | `getEmployee` | employee | Employee with smart-button counts |
| PATCH | `/api/employees/{id}` | employees | `updateEmployee` | hr_manager | Update an employee |
| GET | `/api/departments` | employees | `listDepartments` | employee | Department list with headcount |
| POST | `/api/departments` | employees | `createDepartment` | hr_manager | Create a department |
| PATCH | `/api/departments/{id}` | employees | `updateDepartment` | hr_manager | Update a department |
| DELETE | `/api/departments/{id}` | employees | `deleteDepartment` | hr_manager | Delete an empty department |
| GET | `/api/contracts` | contracts | `listContracts` | employee | Paginated, filterable contract list |
| POST | `/api/contracts` | contracts | `createContract` | hr_manager | Create a contract |
| GET | `/api/contracts/{id}` | contracts | `getContract` | employee | Single contract |
| PATCH | `/api/contracts/{id}` | contracts | `updateContract` | hr_manager | Update a contract or change its status |
| GET | `/api/working-schedules` | schedules | `listWorkingSchedules` | employee | Schedule list with derived weekly hours |
| POST | `/api/working-schedules` | schedules | `createWorkingSchedule` | hr_manager | Create a schedule with its day rows |
| GET | `/api/working-schedules/{id}` | schedules | `getWorkingSchedule` | employee | Schedule with day rows |
| PATCH | `/api/working-schedules/{id}` | schedules | `updateWorkingSchedule` | hr_manager | Replace the day rows and recompute totals |
| GET | `/api/public-holidays` | schedules | `listPublicHolidays` | employee | Holidays in a year |
| POST | `/api/public-holidays` | schedules | `createPublicHoliday` | hr_payroll_manager | Add a holiday |
| DELETE | `/api/public-holidays/{id}` | schedules | `deletePublicHoliday` | hr_payroll_manager | Remove a holiday |
| GET | `/api/attendance` | attendance | `listAttendance` | employee | Paginated, filterable attendance list |
| POST | `/api/attendance` | attendance | `createAttendance` | hr_manager | Create a record manually |
| GET | `/api/attendance/active` | attendance | `getActiveAttendance` | employee | Today's open session for the widget |
| POST | `/api/attendance/check-in` | attendance | `checkIn` | employee | Open today's session |
| POST | `/api/attendance/check-out` | attendance | `checkOut` | employee | Close today's session |
| GET | `/api/attendance/{id}` | attendance | `getAttendance` | employee | Single record |
| PATCH | `/api/attendance/{id}` | attendance | `updateAttendance` | hr_manager | Correct a record |
| GET | `/api/time-off/types` | timeoff | `listTimeOffTypes` | employee | Time off type list |
| POST | `/api/time-off/types` | timeoff | `createTimeOffType` | hr_manager | Create a type |
| GET | `/api/time-off/types/{id}` | timeoff | `getTimeOffType` | employee | Single type |
| PATCH | `/api/time-off/types/{id}` | timeoff | `updateTimeOffType` | hr_manager | Update a type |
| GET | `/api/time-off/allocations` | timeoff | `listAllocations` | employee | Allocations with taken and remaining |
| POST | `/api/time-off/allocations` | timeoff | `createAllocation` | hr_manager | Create an allocation |
| GET | `/api/time-off/allocations/{id}` | timeoff | `getAllocation` | employee | Single allocation |
| PATCH | `/api/time-off/allocations/{id}` | timeoff | `updateAllocation` | hr_manager | Update a draft allocation |
| POST | `/api/time-off/allocations/{id}/approve` | timeoff | `approveAllocation` | hr_manager | Make the balance available |
| POST | `/api/time-off/allocations/{id}/refuse` | timeoff | `refuseAllocation` | hr_manager | Withdraw the balance |
| GET | `/api/time-off/requests` | timeoff | `listTimeOffRequests` | employee | Paginated, filterable request list |
| POST | `/api/time-off/requests` | timeoff | `createTimeOffRequest` | employee | Raise a request |
| GET | `/api/time-off/requests/{id}` | timeoff | `getTimeOffRequest` | employee | Single request with its allocation |
| PATCH | `/api/time-off/requests/{id}` | timeoff | `updateTimeOffRequest` | employee | Edit or cancel a request awaiting approval |
| POST | `/api/time-off/requests/{id}/approve` | timeoff | `approveTimeOffRequest` | hr_manager | Approve and consume balance |
| POST | `/api/time-off/requests/{id}/refuse` | timeoff | `refuseTimeOffRequest` | hr_manager | Refuse and restore balance |
| GET | `/api/time-off/dashboard` | timeoff | `getTimeOffDashboard` | employee | Year calendar and entitlements |
| GET | `/api/payroll/structures` | payroll | `listSalaryStructures` | hr_payroll_user | Structures with rule and employee counts |
| POST | `/api/payroll/structures` | payroll | `createSalaryStructure` | hr_payroll_manager | Create a structure |
| GET | `/api/payroll/structures/{id}` | payroll | `getSalaryStructure` | hr_payroll_user | Structure with ordered rules |
| PATCH | `/api/payroll/structures/{id}` | payroll | `updateSalaryStructure` | hr_payroll_manager | Update a structure |
| GET | `/api/payroll/rules` | payroll | `listSalaryRules` | hr_payroll_user | Rules across structures |
| POST | `/api/payroll/rules` | payroll | `createSalaryRule` | hr_payroll_manager | Create a rule |
| GET | `/api/payroll/rules/{id}` | payroll | `getSalaryRule` | hr_payroll_user | Single rule |
| PATCH | `/api/payroll/rules/{id}` | payroll | `updateSalaryRule` | hr_payroll_manager | Update a rule |
| DELETE | `/api/payroll/rules/{id}` | payroll | `deleteSalaryRule` | hr_payroll_manager | Delete a rule |
| GET | `/api/payroll/payruns/eligible-employees` | payroll | `listEligibleEmployees` | hr_payroll_user | Wizard step 2 candidate list |
| GET | `/api/payroll/payruns` | payroll | `listPayruns` | hr_payroll_user | Pay runs with counts and warning totals |
| POST | `/api/payroll/payruns` | payroll | `createPayrun` | hr_payroll_user | Create the run with selected employees |
| GET | `/api/payroll/payruns/{id}` | payroll | `getPayrun` | hr_payroll_user | Pay run with its payslip summaries |
| POST | `/api/payroll/payruns/{id}/compute` | payroll | `computePayrun` | hr_payroll_user | Generate or regenerate payslips |
| POST | `/api/payroll/payruns/{id}/validate` | payroll | `validatePayrun` | hr_payroll_manager | Lock the run if no blocking warnings |
| POST | `/api/payroll/payruns/{id}/mark-paid` | payroll | `markPayrunPaid` | hr_payroll_manager | Record payment |
| POST | `/api/payroll/payruns/{id}/send-payslips` | payroll | `sendPayslips` | hr_payroll_manager | Email every payslip PDF |
| GET | `/api/payroll/payslips` | payroll | `listPayslips` | employee | Paginated, filterable payslip list |
| GET | `/api/payroll/payslips/{id}` | payroll | `getPayslip` | employee | Payslip with its computation lines |
| POST | `/api/payroll/payslips/{id}/archive` | payroll | `archivePayslip` | hr_payroll_user | Archive so the period can be recomputed |
| GET | `/api/payroll/payslips/{id}/pdf` | payroll | `getPayslipPdf` | employee | Stream the payslip PDF |
| GET | `/api/dashboard/payroll` | dashboard | `getPayrollDashboard` | hr_payroll_user | Every dashboard figure in one payload |
| GET | `/api/reports/salary-register` | reports | `getSalaryRegister` | hr_payroll_user | Payslip totals per employee |
| GET | `/api/reports/attendance-register` | reports | `getAttendanceRegister` | hr_manager | Day grid per employee for a month |
| GET | `/api/reports/leave-balance` | reports | `getLeaveBalanceReport` | hr_manager | Allocated, taken, remaining per employee and type |
| GET | `/api/reports/contract-expiry` | reports | `getContractExpiryReport` | hr_manager | Contracts ending within a window |
| GET | `/api/reports/department-cost` | reports | `getDepartmentCostReport` | hr_payroll_user | Headcount and salary cost per department |
| GET | `/api/notifications` | notifications | `listNotifications` | employee | Own notifications with unread count |
| POST | `/api/notifications/read` | notifications | `markNotificationsRead` | employee | Mark ids, or all, as read |

## 6. Request / Response Conventions

Binding on every endpoint. Agents must not invent their own shape.

**Success**
```json
{ "data": { } }
```

**Success, list**
```json
{ "data": [], "meta": { "page": 1, "pageSize": 20, "total": 137 } }
```

**Error** — every non-2xx JSON response, without exception
```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Human-readable summary",
             "details": [ { "field": "endDate", "message": "must be on or after startDate" } ] } }
```

- All request and response field names are `camelCase`
- All ids are UUID v4 strings
- All timestamps are ISO 8601 UTC strings; all dates are `YYYY-MM-DD` strings with no timezone
- All money is a decimal **string**, never a JSON number, to avoid float drift
- Pagination is `?page=` and `?pageSize=`, default 20, maximum 100
- Sorting is `?sort=field&order=asc|desc`
- Free-text search is `?q=`
- The two binary responses are `GET /api/payroll/payslips/{id}/pdf` (`application/pdf`) and any
  report with `?format=csv` (`text/csv`); both still return the JSON error envelope on failure
- 204 responses have no body

## 7. Error Codes

Agents choose from this list and never invent a code.

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_FAILED` | 400 | Request body, params or query failed validation |
| `UNAUTHENTICATED` | 401 | Missing, expired or invalid access token |
| `FORBIDDEN` | 403 | Authenticated but the role or record scope does not permit this |
| `NOT_FOUND` | 404 | Resource does not exist, or is out of the caller's scope |
| `CONFLICT` | 409 | Illegal state transition, overlap, or uniqueness violation |
| `INTERNAL` | 500 | Unhandled |

## 8. Authentication

- Passwords are hashed with `node:crypto` `scrypt` (N=16384, r=8, p=1, 32-byte key, 16-byte random
  salt) and stored as `salt:hash` in hex. No hashing dependency.
- Sign-in issues two httpOnly, SameSite=Lax cookies: `pp_at`, a JWT with a 15-minute expiry, and
  `pp_rt`, an opaque 32-byte random refresh token with a 7-day expiry.
- The access token payload is `{ sub: userId, role, employeeId, exp }`, signed HS256 with `JWT_SECRET`.
- The refresh token is stored only as a SHA-256 hash in `refresh_tokens`. `refreshSession` verifies,
  revokes the presented token and issues a new pair. A presented token that is already revoked
  revokes every token for that user.
- `middleware/requireAuth.ts` verifies `pp_at` and attaches `req.auth`.
- `middleware/requireRole.ts` gates by minimum role using this ordering:
  `employee < hr_manager < hr_payroll_user < hr_payroll_manager < admin`.
- `middleware/scopeToEmployee.ts` runs after `requireAuth`: when `req.auth.role` is `employee`, it
  forces `employeeId` on every list query to the caller's own `employeeId`, and rejects any detail
  or mutation whose target record belongs to another employee with `NOT_FOUND`.
- Invite and reset tokens are 32 random bytes, delivered raw in the emailed link, stored hashed,
  single use, 72-hour expiry.
- Anonymous access is permitted only on `login`, `refreshSession`, `requestPasswordReset` and
  `setPassword`.
- `requestPasswordReset` always returns 204 whether or not the email exists.

**Role capability matrix.** Where a role is listed, every role above it inherits the capability.

| Capability | Minimum role |
|---|---|
| Read own employee, attendance, time off, payslips | `employee` |
| Check in and check out, raise and cancel own requests | `employee` |
| CRUD employees, departments, contracts, working schedules, attendance | `hr_manager` |
| CRUD time off types and allocations, approve or refuse requests | `hr_manager` |
| Read salary structures and rules | `hr_payroll_user` |
| Create, read and update pay runs and payslips, compute, archive | `hr_payroll_user` |
| Read the payroll dashboard and reports | `hr_payroll_user` |
| CRUD salary structures and rules; validate, mark paid, send payslips | `hr_payroll_manager` |
| CRUD public holidays | `hr_payroll_manager` |
| CRUD users, assign roles | `admin` |

## 9. Pages

Every route in the app. `:id` may be the literal string `new`, which renders an empty form on the
same page component. Every route except the four marked `none` requires authentication.

| Route | Page | Module | Endpoints called | Auth | Notes |
|---|---|---|---|---|---|
| `/login` | Sign in | auth | `login` | none | |
| `/forgot-password` | Forgot password | auth | `requestPasswordReset` | none | Always shows the same confirmation |
| `/set-password` | Set password | auth | `setPassword` | none | Token from `?token=` |
| `/` | Home redirect | — | `getCurrentUser` | employee | No UI; redirects to `/payroll` for `hr_payroll_user` and above, `/employees` for `hr_manager` and `admin`, `/time-off` for `employee`. Not present in `design.html`. |
| `/employees` | Employee directory | employees | `listEmployees`, `listDepartments` | employee | Kanban and List modes on one route; empty and error states required |
| `/employees/:id` | Employee form | employees | `getEmployee`, `createEmployee`, `updateEmployee`, `listDepartments`, `listWorkingSchedules` | employee | Smart buttons link to filtered lists |
| `/departments` | Departments | employees | `listDepartments`, `createDepartment`, `updateDepartment`, `deleteDepartment` | employee | Inline row editing |
| `/contracts` | Contracts | contracts | `listContracts`, `listEmployees` | employee | `?employeeId=` pre-filters |
| `/contracts/:id` | Contract form | contracts | `getContract`, `createContract`, `updateContract`, `listEmployees`, `listDepartments`, `listWorkingSchedules`, `listSalaryStructures` | employee | |
| `/schedules` | Working schedules | schedules | `listWorkingSchedules` | employee | List view only |
| `/schedules/:id` | Working schedule form | schedules | `getWorkingSchedule`, `createWorkingSchedule`, `updateWorkingSchedule` | employee | Weekly hours derived, read-only |
| `/holidays` | Public holidays | schedules | `listPublicHolidays`, `createPublicHoliday`, `deletePublicHoliday` | employee | Add and delete gated to `hr_payroll_manager` |
| `/attendance` | Attendance | attendance | `listAttendance`, `listEmployees` | employee | `?employeeId=` pre-filters; check-in popover lives in the shell |
| `/attendance/:id` | Attendance form | attendance | `getAttendance`, `createAttendance`, `updateAttendance` | employee | |
| `/time-off` | Time off dashboard | timeoff | `getTimeOffDashboard`, `listEmployees` | employee | Year calendar and entitlement rings |
| `/time-off/requests` | Time off requests | timeoff | `listTimeOffRequests` | employee | |
| `/time-off/requests/:id` | Request form | timeoff | `getTimeOffRequest`, `createTimeOffRequest`, `updateTimeOffRequest`, `approveTimeOffRequest`, `refuseTimeOffRequest`, `listTimeOffTypes` | employee | Approve and Refuse hidden below `hr_manager` |
| `/time-off/types` | Time off types | timeoff | `listTimeOffTypes` | employee | |
| `/time-off/types/:id` | Time off type form | timeoff | `getTimeOffType`, `createTimeOffType`, `updateTimeOffType` | employee | |
| `/time-off/allocations` | Allocations | timeoff | `listAllocations`, `listTimeOffTypes` | employee | |
| `/time-off/allocations/:id` | Allocation form | timeoff | `getAllocation`, `createAllocation`, `updateAllocation`, `approveAllocation`, `refuseAllocation` | employee | |
| `/payroll` | Payroll dashboard | dashboard | `getPayrollDashboard`, `listDepartments` | hr_payroll_user | Every figure responds to the filters |
| `/payroll/payruns` | Pay runs | payroll | `listPayruns`, `listEligibleEmployees`, `createPayrun`, `listSalaryStructures` | hr_payroll_user | Two-step wizard lives here as modals |
| `/payroll/payruns/:id` | Pay run processing | payroll | `getPayrun`, `computePayrun`, `validatePayrun`, `markPayrunPaid`, `sendPayslips` | hr_payroll_user | Empty and error states required |
| `/payroll/payslips` | Payslips | payroll | `listPayslips` | employee | Employees see only their own |
| `/payroll/payslips/:id` | Payslip detail | payroll | `getPayslip`, `archivePayslip`, `getPayslipPdf` | employee | Currency toggle |
| `/payroll/structures` | Salary structures | payroll | `listSalaryStructures` | hr_payroll_user | |
| `/payroll/structures/:id` | Structure form | payroll | `getSalaryStructure`, `createSalaryStructure`, `updateSalaryStructure` | hr_payroll_user | Ordered rule table |
| `/payroll/rules` | Salary rules | payroll | `listSalaryRules`, `listSalaryStructures` | hr_payroll_user | |
| `/payroll/rules/:id` | Salary rule form | payroll | `getSalaryRule`, `createSalaryRule`, `updateSalaryRule`, `deleteSalaryRule` | hr_payroll_user | Computation method switches the visible fields |
| `/reports` | Reports | reports | `getSalaryRegister`, `getAttendanceRegister`, `getLeaveBalanceReport`, `getContractExpiryReport`, `getDepartmentCostReport` | hr_manager | Tabbed; CSV export per tab |
| `/users` | User management | users | `listUsers`, `createUser`, `updateUser`, `resendInvite`, `listEmployees` | admin | |
| `/notifications` | Notifications | notifications | `listNotifications`, `markNotificationsRead` | employee | |
| `*` | Not found | — | — | none | |

## 10. File Structure

Complete. No `...`, no `etc.`

repo/
├─ PRD.md
├─ TRD.md
├─ AGENTS.md
├─ DESIGN.md
├─ design.html
├─ openapi.yaml
├─ package.json
├─ .env.example
├─ shared/
│ ├─ api-types.ts # GENERATED from openapi.yaml — never hand-edited
│ └─ constants.ts # enum values and role ordering, shared by client and server
├─ server/
│ ├─ package.json
│ ├─ tsconfig.json
│ ├─ prisma/
│ │ ├─ schema.prisma
│ │ └─ migrations/
│ └─ src/
│ ├─ index.ts
│ ├─ app.ts
│ ├─ env.ts
│ ├─ middleware/
│ │ ├─ requireAuth.ts
│ │ ├─ requireRole.ts
│ │ ├─ scopeToEmployee.ts
│ │ ├─ validate.ts
│ │ └─ errorHandler.ts
│ ├─ lib/
│ │ ├─ apiError.ts
│ │ ├─ password.ts
│ │ ├─ tokens.ts
│ │ ├─ money.ts
│ │ ├─ dates.ts
│ │ ├─ csv.ts
│ │ ├─ mailer.ts
│ │ └─ pagination.ts
│ ├─ routes/
│ │ ├─ index.ts
│ │ ├─ auth.routes.ts
│ │ ├─ users.routes.ts
│ │ ├─ employees.routes.ts
│ │ ├─ contracts.routes.ts
│ │ ├─ schedules.routes.ts
│ │ ├─ attendance.routes.ts
│ │ ├─ timeoff.routes.ts
│ │ ├─ payroll.routes.ts
│ │ ├─ dashboard.routes.ts
│ │ ├─ reports.routes.ts
│ │ └─ notifications.routes.ts
│ ├─ schemas/
│ │ ├─ auth.schema.ts
│ │ ├─ users.schema.ts
│ │ ├─ employees.schema.ts
│ │ ├─ contracts.schema.ts
│ │ ├─ schedules.schema.ts
│ │ ├─ attendance.schema.ts
│ │ ├─ timeoff.schema.ts
│ │ ├─ payroll.schema.ts
│ │ ├─ dashboard.schema.ts
│ │ └─ reports.schema.ts
│ ├─ services/
│ │ ├─ auth.service.ts
│ │ ├─ users.service.ts
│ │ ├─ employees.service.ts
│ │ ├─ contracts.service.ts
│ │ ├─ schedules.service.ts
│ │ ├─ attendance.service.ts
│ │ ├─ timeoff.service.ts
│ │ ├─ dashboard.service.ts
│ │ ├─ reports.service.ts
│ │ ├─ notifications.service.ts
│ │ ├─ dayAccounting.service.ts
│ │ └─ payroll/
│ │ ├─ payruns.service.ts
│ │ ├─ payslips.service.ts
│ │ ├─ structures.service.ts
│ │ ├─ rules.service.ts
│ │ ├─ compute.ts
│ │ ├─ formula.ts
│ │ └─ payslipPdf.tsx
│ └─ db/
│ ├─ client.ts
│ └─ seed.ts
└─ web/
├─ package.json
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
└─ src/
├─ main.tsx
├─ App.tsx
├─ routes.tsx
├─ tokens.css
├─ index.css
├─ lib/
│ ├─ apiClient.ts
│ ├─ queryKeys.ts
│ ├─ session.tsx
│ ├─ permissions.ts
│ ├─ format.ts
│ └─ cn.ts
├─ components/
│ ├─ ui/
│ │ ├─ Button.tsx
│ │ ├─ Input.tsx
│ │ ├─ Select.tsx
│ │ ├─ Checkbox.tsx
│ │ ├─ Field.tsx
│ │ ├─ Card.tsx
│ │ ├─ Badge.tsx
│ │ ├─ Modal.tsx
│ │ ├─ Dropdown.tsx
│ │ ├─ Popover.tsx
│ │ ├─ Tabs.tsx
│ │ ├─ DataTable.tsx
│ │ ├─ Pagination.tsx
│ │ ├─ EmptyState.tsx
│ │ ├─ ErrorState.tsx
│ │ ├─ Spinner.tsx
│ │ └─ Amount.tsx
│ ├─ layout/
│ │ ├─ AppShell.tsx
│ │ ├─ TopNav.tsx
│ │ ├─ NavMenu.tsx
│ │ ├─ AttendanceWidget.tsx
│ │ ├─ NotificationBell.tsx
│ │ └─ PageHeader.tsx
│ └─ charts/
│ ├─ BarChartCard.tsx
│ ├─ LineChartCard.tsx
│ └─ DonutRing.tsx
└─ pages/
├─ auth/
│ ├─ LoginPage.tsx
│ ├─ ForgotPasswordPage.tsx
│ └─ SetPasswordPage.tsx
├─ users/
│ └─ UsersPage.tsx
├─ employees/
│ ├─ EmployeeDirectoryPage.tsx
│ ├─ EmployeeFormPage.tsx
│ └─ DepartmentsPage.tsx
├─ contracts/
│ ├─ ContractsPage.tsx
│ └─ ContractFormPage.tsx
├─ schedules/
│ ├─ SchedulesPage.tsx
│ ├─ ScheduleFormPage.tsx
│ └─ HolidaysPage.tsx
├─ attendance/
│ ├─ AttendancePage.tsx
│ └─ AttendanceFormPage.tsx
├─ timeoff/
│ ├─ TimeOffDashboardPage.tsx
│ ├─ RequestsPage.tsx
│ ├─ RequestFormPage.tsx
│ ├─ TypesPage.tsx
│ ├─ TypeFormPage.tsx
│ ├─ AllocationsPage.tsx
│ ├─ AllocationFormPage.tsx
│ └─ YearCalendar.tsx
├─ payroll/
│ ├─ PayrunsPage.tsx
│ ├─ PayrunWizard.tsx
│ ├─ PayrunDetailPage.tsx
│ ├─ PayslipsPage.tsx
│ ├─ PayslipDetailPage.tsx
│ ├─ StructuresPage.tsx
│ ├─ StructureFormPage.tsx
│ ├─ RulesPage.tsx
│ └─ RuleFormPage.tsx
├─ dashboard/
│ └─ PayrollDashboardPage.tsx
├─ reports/
│ └─ ReportsPage.tsx
├─ notifications/
│ └─ NotificationsPage.tsx
└─ NotFoundPage.tsx


## 11. Shared Surface

Files many modules depend on. Frozen once written; changing one affects everyone.

| File | What it holds | May be changed by |
|---|---|---|
| `openapi.yaml` | The API contract | One owner |
| `shared/api-types.ts` | Generated types | Nobody — regenerate from `openapi.yaml` |
| `shared/constants.ts` | Enum values, role ordering | One owner |
| `server/prisma/schema.prisma` | Table definitions | One owner |
| `server/src/middleware/*` | Auth, role gating, scoping, errors | One owner |
| `server/src/lib/apiError.ts` | Error envelope construction | One owner |
| `server/src/lib/money.ts` | Decimal arithmetic and rounding | One owner |
| `server/src/services/dayAccounting.service.ts` | Day breakdown used by three modules | One owner |
| `server/src/services/payroll/formula.ts` | Formula parser | One owner |
| `web/src/components/ui/*` | UI primitives | One owner |
| `web/src/lib/apiClient.ts` | Fetch wrapper | One owner |
| `web/src/tokens.css` | Design tokens | One owner |
| `web/src/routes.tsx` | Route tree | One owner |

## 12. Conventions

- Files: `PascalCase.tsx` for React components, `camelCase.ts` for everything else
- Services return domain objects; routes do the response shaping
- No `any`; use the generated types from `shared/api-types.ts`
- No default exports except React page components
- Money never touches `number`. Prisma returns `Decimal`; serialise with `.toFixed(2)` as a string.
  On the client, money is a string and is formatted, never arithmetic'd
- Dates in the database are `date` columns and are handled as `YYYY-MM-DD` strings end to end.
  No `Date` object crosses the API boundary for a calendar date
- Environment access only through `server/src/env.ts` and `import.meta.env` on the client
- Every list endpoint is paginated from the first commit
- Every list page renders three states: loading, empty and error
- Zod schemas mirror the `openapi.yaml` request bodies exactly; when they disagree, `openapi.yaml` wins
- Tailwind classes reference tokens through the theme (`bg-surface`, `text-muted`); no arbitrary
  values like `bg-[#ffffff]` and no raw hex anywhere in `web/src`

## 13. Seed Data

What `seed.ts` must produce so every screen looks populated and the demo script works.
Seed is idempotent: it truncates in FK-safe order and rebuilds. Today's date for seeding is
2026-09-05.

- 1 company: "OXP Pvt Ltd", base currency `INR`, timezone `Asia/Kolkata`
- 5 departments: Finance, HR, Engineering, Sales, Support
- 4 working schedules: "40 Hours / Week" (Mon–Fri 09:00–18:00, 1h break), "Night Shift"
  (Mon–Fri 22:00–06:00 modelled as 22:00–23:59 plus a 6h break note — seed as Mon–Fri 14:00–23:00),
  "Flexible Hybrid" (Mon–Fri 09:30–18:00, 1h break, 37.5h), "Part-time 20h" (Mon–Thu 09:00–14:00)
- 8 public holidays across 2026, at least two inside September
- 42 employees: distributed 6 Finance, 5 HR, 14 Engineering, 10 Sales, 7 Support;
  38 `active`, 4 `inactive`; 30 `full_time`, 5 `part_time`, 4 `contract`, 3 `intern`;
  exactly 2 active employees with null bank fields, one of them included in the September pay run
- 5 users, one per role, all `active` with password `Demo@1234`:
  `admin@peoplepay360.test`, `hr.manager@peoplepay360.test`, `payroll.user@peoplepay360.test`,
  `payroll.manager@peoplepay360.test`, and `aarav.mehta@peoplepay360.test` as the `employee`
- 1 additional user in status `invited` to demonstrate the invite state on `/users`
- 50 contracts: one `running` per active employee plus 12 `expired` historical ones; Aarav Mehta
  has both an `expired` 2025 contract at ₹78,000 and a `running` 2026 contract at ₹85,000;
  3 running contracts end within September to trigger `CONTRACT_EXPIRING`; 2 contracts in `USD`
- 3 salary structures: "Regular Salary" (12 rules), "Intern Salary" (8 rules), "Contractor" (6 rules)
- Regular Salary rules, in sequence: BASIC 1 basic `formula` `CONTRACT_WAGE * 0.5 * PRORATION`;
  HRA 10 allowance `percentage` 20% of `basic`; STD 20 allowance `fixed` 10000;
  BONUS 30 allowance `formula` `round({BASIC} * 5%)`; LTA 40 allowance `fixed` 5000;
  FIX 50 allowance `formula` `max(0, CONTRACT_WAGE * PRORATION - {BASIC} - {HRA} - {STD} - {BONUS} - {LTA})`;
  GROSS 60 gross `formula` `{BASIC} + ALLOWANCE`; LWF 70 deduction `fixed` 200;
  PF 80 deduction `percentage` 12% of `basic`; ESIC 90 deduction `formula` `round({GROSS} * 0.75%)`;
  PT 100 deduction `fixed` 200; NET 110 net `formula` `{GROSS} - DEDUCTION`
- 4 time off types: Paid Time Off (days, allocation required, paid), Sick Leave (days, no allocation,
  paid), Comp Off (hours, allocation required, paid), Unpaid Leave (days, no allocation, unpaid)
- 60 allocations: one approved Paid Time Off allocation per active employee for 2026 (18–22 days),
  plus 6 Comp Off allocations in hours, plus 2 in `draft` to show the pending state
- ~2,400 attendance records covering July, August and September 1–4 for all active employees:
  roughly 90% `present`, 5% `late`, 3% `absent`, 2% `half_day`; at least one missing check-out and
  three `isManualEdit` records; Aarav has one `absent` and one `late` day in September
- 26 time off requests: 18 `approved` spread across July–September including one `half_day` and one
  hour-based Comp Off, 5 `to_approve`, 3 `refused`
- 3 pay runs on the "Regular Salary" structure: July 2026 `paid` with 38 payslips,
  August 2026 `validated` with 38 payslips, September 2026 `draft` with no payslips
- 1 archived payslip in the August run, to prove archived rows stay visible and leave aggregates
- 6 notifications for the payroll manager, 3 unread

## 14. Technical Risks

| Risk | Mitigation |
|---|---|
| Formula engine over-runs its budget | Grammar is frozen in section 3 and the parser is written first, against a fixed table of seed formulas; anything the grammar cannot express is expressed as two rules instead |
| Float drift in money | `Decimal(14,2)` in the database, Prisma `Decimal` in services, strings over the wire, no `number` arithmetic on currency anywhere |
| Date and timezone bugs | Calendar dates are `date` columns and `YYYY-MM-DD` strings end to end; only `checkIn` and `checkOut` are `timestamptz`, and no timezone conversion is performed anywhere |
| Duplicate payslips corrupting aggregates | The partial unique index makes it impossible at the database level; archive is the only way to recompute a period |
| Four agents diverging on API shape | `openapi.yaml` is generated into `shared/api-types.ts` and both sides import from it; the zod schemas mirror it and lose to it in any disagreement |
| Dashboard queries written per-card | One endpoint returns the whole dashboard payload; the page never issues a second query |