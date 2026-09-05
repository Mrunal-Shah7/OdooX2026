-- Schema is applied via `prisma db push`. This migration records the partial unique index only.

CREATE UNIQUE INDEX IF NOT EXISTS payslips_active_period_unique
  ON payslips ("employeeId", "periodStart")
  WHERE "archivedAt" IS NULL;
