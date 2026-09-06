# PeoplePay360

![PeoplePay360 Banner](/web/public/logo.png) <!-- Placeholder for a project banner -->

PeoplePay360 is an integrated HR and payroll platform built to bridge the gap between employee management and payroll processing. Traditional HR tools often silo employee records, attendance, and leave data, forcing payroll teams to manually reconcile this information every month. 

PeoplePay360 solves this by acting as a unified hub: an employee's running contract, daily attendance, and approved time-off requests flow directly into a dynamic payroll engine. When a pay run is computed, the platform automatically prorates salaries and generates line-by-line payslips based on live data, drastically reducing manual errors and saving hours of administrative work.

## Key Features

- **Unified Employee Hub:** Track full employee lifecycles, departments, and multiple historical contracts.
- **Dynamic Payroll Engine:** Configure custom salary structures and rules using a custom formula engine (e.g., referencing `BASIC`, `GROSS`, `WORKED_DAYS`).
- **Automated Pay Runs:** Generate step-by-step pay runs with automated pre-validation warnings, producing line-by-line breakdowns and on-demand PDF payslips.
- **Attendance & Time-Off:** Employees can track time via check-in/out widgets. Time-off requests automatically deduct from allocated balances and integrate directly into payroll proration.
- **Role-Based Access Control:** Five distinct roles (Admin, HR Payroll Manager, HR Payroll User, HR Manager, Employee) ensure strict data security and capability gating.
- **Live Dashboards:** Real-time HR/payroll KPIs, yearly time-off calendars, and interactive reports (Salary Register, Attendance Register, Leave Balance).

## Target Users

- **Employees:** Record working hours, request leave, and download personal payslips.
- **HR Managers:** Maintain employee master data, manage contracts, and approve/refuse leave requests.
- **Payroll Users & Managers:** Configure salary rules, run monthly payroll, review computation warnings, and finalize pay runs.
- **Admins:** Manage user onboarding and system-wide access.

## Tech Stack

PeoplePay360 is a React Single-Page Application (SPA) communicating with an Express API over JSON.

- **Frontend:** React 19, Vite 6, Tailwind CSS 4, shadcn/ui, @tanstack/react-router, @tanstack/react-query, @tanstack/react-table
- **Backend:** Node.js 22 LTS, Express 5, Prisma ORM 6, PostgreSQL 16
- **Tooling:** Zod (runtime validation), openapi-typescript (contract-driven API types), @react-pdf/renderer (server-side PDFs)

## Getting Started

To run PeoplePay360 locally, you will need **Node.js 22+** and a running **PostgreSQL 16** database.

### 1. Environment Setup
Clone the repository and set up your environment variables:
```bash
cp .env.example .env
# Open .env and set your DATABASE_URL
```

### 2. Install & Generate
Install dependencies for the root, frontend, and backend. This command also generates the API types from the OpenAPI contract and the Prisma client:
```bash
npm run setup
```

### 3. Database Migration & Seeding
Apply the database schema and populate the database with realistic demo data:
```bash
npm run db:push
npm run db:seed
```

### 4. Run Development Servers
Start both the backend API (port 4000) and the frontend Vite server (port 5173) concurrently:
```bash
npm run dev
```

## Test Accounts

The `db:seed` script provides several seeded users to explore the different role-based views. Use these to log in locally:

| Role | Email |
|---|---|
| **Admin** | `admin@peoplepay360.test` |
| **HR Payroll Manager** | `payroll.manager@peoplepay360.test` |
| **HR Manager** | `hr.manager@peoplepay360.test` |
| **Employee** | `aarav.mehta@peoplepay360.test` |

*(Note: Passwords can be set via the invite link workflow or default configured seed values depending on the seed configuration).*

## Repository Structure

- `server/`: Backend Express API, Prisma schema, auth middleware, and pure business logic.
- `web/`: Frontend React SPA, UI components, and API client hooks.
- `shared/`: Generated API types (`api-types.ts`) and shared enums.
- `openapi.yaml`: The definitive API contract binding the frontend and backend.

---
*For more detailed technical and functional specifications, please refer to the `PRD.md` and `TRD.md` documents in the repository.*
