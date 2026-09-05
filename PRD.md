# PRD — PeoplePay360

---

## 1. Problem Statement

Verbatim from the brief:

> Many basic HR tools store employee details, attendance, leave, and salary data as separate
> records. Real HR and payroll teams need these records to work together. An employee may have
> multiple contracts over time, but payroll must use the contract that applies to the payroll
> period. Working hours come from an assigned schedule, attendance contains exceptions that may
> need review, leave balances depend on allocations and approved requests, and payroll must
> transform all of that into understandable payslips before payment.

**Our interpretation.** The Employee record is the hub; everything else is a spoke that payroll
reads at compute time. We are not building CRUD screens that happen to sit next to each other —
we are building one dependency chain (Employee → Contract → Working Schedule → Attendance +
Time Off → Payslip → Dashboard) and proving it end to end by making a single leave request
visibly change a number on a payslip PDF.

Second interpretation, stated because teams diverge here silently: **worked days come from
attendance, not from the calendar.** A scheduled working day with no attendance record and no
approved leave is an absent day and reduces pay. Approved *paid* leave counts as worked. This
makes attendance data load-bearing rather than decorative, which is the point of the problem.

## 2. Solution Summary

PeoplePay360 is an integrated HR and payroll platform for a single company. HR staff maintain
employees, departments, contracts, working schedules and public holidays; employees check
themselves in and out and request time off; HR approves leave against allocated balances; payroll
staff configure salary structures and ordered salary rules, then run a two-step pay run that
computes a payslip per employee from that employee's period-applicable contract, their attendance,
and their approved leave. Payslips show a line-by-line breakdown, surface warnings before
finalisation, print to PDF and email to employees. A live dashboard aggregates all of it.

## 3. Target Users

| User type | What they need | Primary action in the product |
|---|---|---|
| Employee | To record their hours and take leave without chasing anyone | Check in / out, request time off, download own payslip |
| HR Manager | To keep master data correct and clear the leave queue | Maintain employees and contracts, approve or refuse requests |
| HR Payroll User | To run the month's payroll and fix what it flags | Create a pay run, compute, review warnings |
| HR Payroll Manager | To control how salary is calculated | Configure salary structures and rules, validate and mark paid |
| Admin | To onboard people and control access | Create users, assign roles, set public holidays |

## 4. Core Features

P0 = the demo fails without it. P1 = build if time allows. P2 = only if everything else is done.

| ID | Feature | Description | Priority |
|---|---|---|---|
| F1 | Authentication and roles | Admin-issued accounts, invite email, password set, five roles gating every module | P0 |
| F2 | Employee master | Kanban and list views, form with work details and smart buttons to related records | P0 |
| F3 | Contract management | Historical contracts per employee, one Running contract per period, wage and currency | P0 |
| F4 | Working schedules | Weekly pattern with derived weekly hours, assigned to employees and contracts | P0 |
| F5 | Attendance | Check-in/check-out widget, global and per-employee lists, manual correction | P0 |
| F6 | Time off types and allocations | Leave policies, allocated balances with validity, approval before availability | P0 |
| F7 | Time off requests | Full-day, half-day and hour requests, approval flow, balance consumption | P0 |
| F8 | Salary structures and rules | Ordered rules with fixed, percentage and formula computation | P0 |
| F9 | Pay run wizard and processing | Two-step creation, Compute → Validate → Mark Paid, warnings before finalisation | P0 |
| F10 | Payslip computation | Period contract + attendance + leave → prorated line-by-line payslip | P0 |
| F11 | Payslip PDF and email | Print a payslip, bulk-send from a paid pay run | P0 |
| F12 | Payroll dashboard | Live KPIs, charts, alerts and overviews with period and department filters | P0 |
| F13 | Time off dashboard | Year calendar and per-type entitlement rings for one employee | P0 |
| F14 | Public holidays | Admin-maintained dates excluded from scheduled working days | P0 |
| F15 | Reports | Five filterable reports with CSV export | P1 |
| F16 | In-app notifications | Bell with unread count for leave and payslip events | P1 |
| F17 | Multi-currency payout | Contract currency plus a frozen pay-run exchange rate and payout currency | P1 |

## 5. User Flows

**F1 — Account creation and first sign-in**
1. Admin opens `/users` and clicks "New user"
2. Admin enters work email, links an employee record, picks one role, saves
3. The user receives an invite email containing a link to `/set-password`
4. The user sets a password and is redirected to `/login`
5. The user signs in and lands on the home screen for their role

**F2 — Open an employee and reach related records**
1. User opens `/employees`, which renders the Kanban view by default
2. User toggles to List, searches, and clicks a row
3. `/employees/:id` shows work information and smart buttons with live counts
4. Clicking "Contracts 2" opens `/contracts` pre-filtered to that employee

**F5 — Record attendance**
1. Employee clicks the attendance icon in the navigation
2. The popover shows "Check In" because no session is open
3. Employee clicks Check In; the indicator turns green and elapsed time starts counting
4. Later the employee reopens the popover and clicks Check Out
5. The record appears on `/attendance` with worked hours and a status

**F7 — Request and approve half-day leave**
1. Employee opens `/time-off/requests` and clicks "New request"
2. Employee picks Paid Time Off, one date, duration type Half day, and saves
3. Request status is To approve; HR Manager receives a notification
4. HR Manager opens `/time-off/requests/:id` and clicks Approve
5. 0.5 is deducted from the linked allocation; the request shows which allocation it consumed
6. The employee's remaining balance on `/time-off` drops by 0.5

**F9 — Create and process a pay run**
1. Payroll user opens `/payroll/payruns` and clicks "New pay run"
2. Step 1 modal collects salary structure, period, employee type, payout currency and exchange rate
3. Continue moves to Step 2 and lists eligible employees; nothing has been saved yet
4. Payroll user ticks employees and clicks "Create pay run"
5. `/payroll/payruns/:id` opens in Draft containing only the selected employees
6. Compute generates a payslip per employee and raises warnings
7. Validate, then Mark paid, then Send payslips

**F10 — Inspect a computed payslip**
1. From the pay run, payroll user clicks an employee row
2. `/payroll/payslips/:id` shows worked days, scheduled days and proration
3. The computation table lists every rule in sequence with its category and amount
4. Deductions display negative; Net is the final line
5. "Print payslip" streams the PDF

## 6. Functional Requirements

**F1**
- FR-1.1 Accounts are created only by an Admin; there is no self-registration
- FR-1.2 A user has exactly one role from: `employee`, `hr_manager`, `hr_payroll_user`, `hr_payroll_manager`, `admin`
- FR-1.3 A user account may be linked to at most one employee record, and an employee record to at most one user
- FR-1.4 A newly created user has status `invited` and no password hash
- FR-1.5 An invite token and a password-reset token are both single-use and expire 72 hours after issue
- FR-1.6 Setting a password moves the user to status `active`
- FR-1.7 A user can never change their own role or another user's role unless they are an Admin
- FR-1.8 `employee` role sees only records belonging to its own employee record on every list and detail endpoint
- FR-1.9 `hr_manager` has no access to any route under `/payroll` except its own payslips
- FR-1.10 `hr_payroll_user` may create, read and update pay runs and payslips, and may only read salary structures and rules
- FR-1.11 An `employee` may download their own payslip PDF and no other

**F2**
- FR-2.1 An employee requires first name, last name, work email, department, job position, employee type, joining date and working schedule
- FR-2.2 Work email is unique across employees
- FR-2.3 Employee type is one of `full_time`, `part_time`, `contract`, `intern`
- FR-2.4 The employee form shows smart buttons with counts for Contracts, Attendance, Time off and Allocations
- FR-2.5 Bank fields are optional; their absence raises a payroll warning rather than blocking the employee record
- FR-2.6 Deactivating an employee sets status `inactive` and excludes them from pay-run eligibility

**F3**
- FR-3.1 A contract requires employee, start date, wage, currency, department, job position, working schedule and salary structure
- FR-3.2 End date is optional; an open-ended contract has no end date
- FR-3.3 Currency is `INR` or `USD`
- FR-3.4 An employee may not have two contracts with status `running` whose date ranges overlap
- FR-3.5 Saving a contract that would create such an overlap fails with a conflict error naming the other contract
- FR-3.6 A contract reference is generated as `CON/YYYY/NNNN` and is unique
- FR-3.7 The contract applicable to a period is the `running` contract that overlaps the period; if more than one overlaps, computation fails for that employee with a warning

**F4**
- FR-4.1 A working schedule has a name and one row per working day with start time, end time and break hours
- FR-4.2 A day's hours are derived as end minus start minus break; they are never typed by the user
- FR-4.3 Weekly hours and days per week are derived by summing the day rows
- FR-4.4 A schedule allows at most one row per weekday; split shifts are not supported
- FR-4.5 A schedule assigned to any employee or contract cannot be deleted

**F5**
- FR-5.1 An employee has at most one attendance record per calendar date
- FR-5.2 Check-in creates a record for today with a check-in timestamp and no check-out
- FR-5.3 Check-out is permitted only when an open record exists for today
- FR-5.4 Worked hours are derived as check-out minus check-in, to two decimal places
- FR-5.5 Attendance status is one of `present`, `late`, `absent`, `half_day`, `on_leave` and is always editable by HR
- FR-5.6 On creation, status is pre-filled by comparing check-in against the assigned schedule's start time for that weekday; a check-in later than the scheduled start is `late`
- FR-5.7 Overtime hours are a manual numeric field and never create a leave balance
- FR-5.8 Any edit by a user other than the record's employee sets `isManualEdit` to true
- FR-5.9 Only `hr_manager` and above may edit an attendance record

**F6**
- FR-6.1 A time off type defines unit (`days` or `hours`), whether it requires allocation, whether it is paid, its approval role, its colour and whether it is active
- FR-6.2 An allocation requires employee, type, allocated quantity, valid-from and valid-to dates
- FR-6.3 An allocation only contributes to an available balance once its status is `approved`
- FR-6.4 Taken quantity on an allocation is derived from approved requests linked to it and is never stored as user input
- FR-6.5 Remaining equals allocated minus taken and may not go below zero

**F7**
- FR-7.1 A request requires employee, type, start date and end date, and a duration type of `full_day`, `half_day` or `hours`
- FR-7.2 `half_day` on a day-unit type consumes 0.5 day by default, or the hours the requester enters, capped at the contracted daily hours
- FR-7.3 `hours` is permitted only on an hour-unit type
- FR-7.4 Duration counts only scheduled working days that are not public holidays
- FR-7.5 A request against a type that requires allocation must resolve to exactly one approved allocation covering the whole request period, or it fails validation
- FR-7.6 A request that exceeds the remaining balance of its allocation fails validation on approval
- FR-7.7 Approving a request sets status `approved` and increases the allocation's taken quantity
- FR-7.8 Moving an approved request to `refused` restores the balance
- FR-7.9 Only the role named on the time off type, or any role above it, may approve or refuse
- FR-7.10 An employee may create and cancel their own requests but never approve one

**F8**
- FR-8.1 A salary rule has a name, a code unique within its structure, a category, a sequence and a computation method
- FR-8.2 Categories are `basic`, `allowance`, `gross`, `deduction`, `net`
- FR-8.3 Computation is `fixed` (an amount), `percentage` (a percentage of `contract_wage`, `basic` or `gross`) or `formula`
- FR-8.4 Rules execute in ascending sequence; ties are broken by code, ascending
- FR-8.5 A formula may reference `{CODE}` of any rule with a strictly lower sequence, and the variables listed in the TRD
- FR-8.6 A formula referencing a rule at or above its own sequence is rejected when the rule is saved
- FR-8.7 Deduction amounts are stored positive and subtracted when computing net
- FR-8.8 A structure in use by any contract or pay run cannot be deleted

**F9**
- FR-9.1 Step 1 of the wizard persists nothing; only "Create pay run" writes a record
- FR-9.2 Step 1 collects salary structure, period start, period end, employee type filter, payout currency and exchange rate
- FR-9.3 The period must be a single calendar month
- FR-9.4 Eligible employees are active employees with a `running` contract overlapping the period, matching the employee type filter
- FR-9.5 A pay run contains payslips for exactly the employees ticked in step 2
- FR-9.6 Pay run status moves only `draft` → `computed` → `validated` → `paid`; no transition may be skipped or reversed
- FR-9.7 Compute is permitted in `draft` and `computed` and replaces all non-archived payslips in the run
- FR-9.8 Validate is refused while any payslip in the run carries a blocking warning
- FR-9.9 Send payslips is permitted only when the pay run is `paid`

**F10**
- FR-10.1 Scheduled days are the dates in the period that fall on a schedule working day, are not public holidays, and fall inside the contract's active window
- FR-10.2 Worked days equal present days plus half-day fractions plus approved paid-leave days
- FR-10.3 Absent days, unpaid leave, and scheduled days with neither an attendance record nor approved leave do not count as worked
- FR-10.4 Proration equals worked days divided by scheduled days, and is zero when scheduled days is zero
- FR-10.5 Proration is applied only by rules whose formula references `PRORATION`
- FR-10.6 A payslip stores its currency, payout currency and exchange rate at compute time and never recalculates them
- FR-10.7 Money is stored to two decimal places and each rule result is rounded half-up before the next rule reads it
- FR-10.8 An employee may hold only one non-archived payslip per period; computing over an existing one is refused until it is archived
- FR-10.9 Archived payslips remain visible in history and are excluded from every dashboard and report aggregate

**F11**
- FR-11.1 The PDF shows company, employee, period, contract wage, worked and scheduled days, every computation line, and the net total
- FR-11.2 Sending records a `sentAt` timestamp per payslip
- FR-11.3 A failed send marks that payslip unsent and does not abort the remaining sends

**F12**
- FR-12.1 Every dashboard figure derives from stored records; no value is hardcoded
- FR-12.2 Filters are period, department and employee type, and apply to every card, chart and table on the page
- FR-12.3 Archived payslips and inactive employees are excluded from all aggregates

**F13**
- FR-13.1 The year calendar shows all twelve months as rows and days as columns, colour-coded by time off type
- FR-13.2 Non-working days per the employee's schedule, and public holidays, are shaded distinctly from leave
- FR-13.3 Each type with an allocation shows allocated, taken and remaining
- FR-13.4 An `employee` sees only their own calendar; higher roles may switch employee

**F14**
- FR-14.1 A public holiday has a name and a date, unique per date
- FR-14.2 Only `admin` and `hr_payroll_manager` may create or delete public holidays
- FR-14.3 Public holidays are excluded from scheduled days everywhere they are counted

**F15**
- FR-15.1 Reports are Salary Register, Attendance Register, Leave Balance, Contract Expiry and Department Cost
- FR-15.2 Every report accepts `format=csv` and streams a CSV with the same rows as the on-screen table

**F16**
- FR-16.1 A notification is created for the approver on request submission, and for the employee on approval, refusal and payslip send
- FR-16.2 The bell shows an unread count and marking read is idempotent

## 7. Non-Functional Requirements

| Requirement | Target |
|---|---|
| List response time | Under 500 ms for any list with the seeded data volume |
| Pay run compute | Under 10 seconds for 42 employees |
| Browser support | Current Chrome and Safari only |
| Viewport | Desktop-first, 1280 px design width; usable but not optimised below 1024 px |
| Accessibility floor | Keyboard-reachable controls, visible focus ring, WCAG AA contrast on all text |
| Money correctness | No floating-point arithmetic on currency anywhere in the stack |

## 8. Data the Product Handles

One company. People belong to departments and hold contracts over time. Days are recorded either
as attendance or as approved leave drawn from an allocated balance. Money is described by rules
grouped into structures, and materialised per employee per month as a payslip inside a pay run.

- **Company** — one row holding name, base currency and timezone
- **Department** — a grouping of employees, optionally headed by one of them
- **Employee** — a person; the hub every other record points at
- **User** — a login, linked to at most one employee, carrying exactly one role
- **Contract** — an employment period with a wage, currency, schedule and salary structure
- **Working schedule** — a weekly pattern of working days and hours
- **Public holiday** — a date excluded from scheduled working days
- **Attendance record** — one day of presence for one employee
- **Time off type** — a leave policy
- **Time off allocation** — a granted balance of one type for one employee over a validity window
- **Time off request** — a consumption of that balance
- **Salary structure** — an ordered collection of salary rules
- **Salary rule** — one line of the calculation
- **Pay run** — payroll processing for one month over a chosen set of employees
- **Payslip** — one employee's computed result inside a pay run, made of payslip lines
- **Notification** — an in-app message for one user

## 9. Success Criteria

- An admin can invite a user who sets a password and signs in with correctly gated navigation
- A leave request approved in one screen visibly changes worked days and net pay on a payslip in another
- A pay run moves draft → computed → validated → paid, surfacing at least two real warnings on the way
- A payslip PDF opens with correct figures and reaches an inbox from the pay run
- Every dashboard number changes when the period filter changes
- Both demo scenarios below run start to finish without a console error

## 10. Out of Scope

- Employee self-service beyond check-in/out, time off requests, own payslip download and own time off dashboard
- Multi-company and multi-tenant support; the company table holds exactly one row
- SSO, two-factor authentication, and account lockout
- Role assignment by anyone other than an Admin, and multi-role users
- TOIL or comp-off accrual from recorded overtime; overtime hours are recorded but never converted to leave
- Working schedule calendar view; schedules have list and form views only
- Split shifts, night-shift date rollover, and per-employee schedule overrides
- Leave carry-forward, expiry sweeps, encashment and accrual policies
- Approval chains beyond a single approving role, and delegation
- Statutory correctness of PF, ESIC, PT or any tax regime; these are ordinary configurable rules seeded with plausible values
- Live exchange rate lookup; the rate is typed by hand on the pay run
- File uploads of any kind, including employee photos and payslip storage
- Payslip PDF archival; PDFs are generated on demand and never persisted
- Audit log, record-level history and soft delete
- Bulk import, bulk edit and undo
- Mobile-specific layouts and native apps
- Localisation, timezone conversion and any locale other than the company timezone

## 11. Demo Script

Target: under five minutes. Both scenarios use seeded data; nothing is created off-camera.

**Scenario A — employee to payslip**

| # | Action | Screen | Data that must exist beforehand |
|---|---|---|---|
| 1 | Sign in as the payroll manager | `/login` | `payroll.manager@peoplepay360.test` active |
| 2 | Show the Kanban of 42 employees, toggle to List, open Aarav Mehta | `/employees` | 42 employees across 5 departments |
| 3 | Point at the smart buttons: 2 contracts, 21 attendance, 3 time off | `/employees/:id` | Aarav has 2 contracts, one expired |
| 4 | Open Contracts, show the expired 2025 contract beside the running one | `/contracts` | One `expired`, one `running` for Aarav |
| 5 | Open the running contract, show wage ₹85,000 and its working schedule | `/contracts/:id` | Contract linked to "40 Hours / Week" |
| 6 | Open the schedule, show weekly hours derived as 40h from five day rows | `/schedules/:id` | Five day rows, 9:00–18:00, 1h break |
| 7 | Show September attendance, including one absent day and one late | `/attendance` | September records for all employees |
| 8 | Open Payroll → Pay runs; July is paid, August validated, September draft | `/payroll/payruns` | Three pay runs in those states |
| 9 | Click New pay run; step 1 collects Regular Salary and September 2026 | `/payroll/payruns` | "Regular Salary" structure with 12 rules |
| 10 | Continue to step 2, tick five employees, click Create pay run | `/payroll/payruns` | Five eligible employees with running contracts |
| 11 | Click Compute; five payslips appear with two warnings | `/payroll/payruns/:id` | One employee with no bank account seeded |
| 12 | Open Aarav's payslip; walk the 12 lines from Basic to Net | `/payroll/payslips/:id` | Computed payslip with all categories present |
| 13 | Click Print payslip; the PDF opens | `/payroll/payslips/:id` | — |
| 14 | Return, click Validate, then Mark paid, then Send payslips | `/payroll/payruns/:id` | Resend key configured |

**Scenario B — allocation to request to pay**

| # | Action | Screen | Data that must exist beforehand |
|---|---|---|---|
| 15 | Open Time off → Types, show Paid Time Off requires allocation and is paid | `/time-off/types` | Four types seeded |
| 16 | Open Allocations, show Aarav's 20-day approved balance with 8 taken | `/time-off/allocations` | Approved 2026 allocation for Aarav |
| 17 | Sign in as Aarav in a second window, open his time off dashboard | `/time-off` | Aarav's user account active |
| 18 | Create a half-day Paid Time Off request for a September working day | `/time-off/requests/new` | A date inside the September draft pay run |
| 19 | Back as payroll manager, open the request and Approve it | `/time-off/requests/:id` | Notification visible in the bell |
| 20 | Show the allocation remaining drop by 0.5 | `/time-off/allocations/:id` | — |
| 21 | Recompute the September pay run after archiving Aarav's payslip | `/payroll/payruns/:id` | Payslip from step 11 archived |
| 22 | Open the payslip; worked days include the half day, proration changed | `/payroll/payslips/:id` | — |
| 23 | Open the payroll dashboard, change period to September, show it move | `/payroll` | July and August payslips for the trend chart |
| 24 | Open Reports → Salary Register, export CSV | `/reports` | September payslips computed |

## 12. Open Questions

None. All decisions are recorded in this document and in `TRD.md`.