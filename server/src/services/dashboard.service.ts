import { Prisma } from '@prisma/client';
import { prisma } from '../db/client.js';
import { monthBounds } from '../lib/dates.js';
import { moneyString, quantityString, roundHalfUp } from '../lib/money.js';
import type { Currency, EmployeeType } from '../../../shared/constants.js';

export async function getPayrollDashboard(query: {
  period?: string;
  departmentId?: string;
  employeeType?: string;
}) {
  const defaultPeriod = '2026-09';
  const period = query.period ?? defaultPeriod;
  const parts = period.split('-');
  const year = parseInt(parts[0] ?? '2026', 10);
  const month = parseInt(parts[1] ?? '09', 10);

  const { start: periodStartStr, end: periodEndStr } = monthBounds(year, month);
  const periodStart = new Date(`${periodStartStr}T00:00:00.000Z`);
  const periodEnd = new Date(`${periodEndStr}T00:00:00.000Z`);

  // Employee filter
  const employeeWhere: Prisma.EmployeeWhereInput = {
    status: 'active',
  };
  if (query.departmentId) {
    employeeWhere.departmentId = query.departmentId;
  }
  if (query.employeeType) {
    employeeWhere.employeeType = query.employeeType;
  }

  // Base payslip filter: period, active employees, non-archived
  const payslipWhere: Prisma.PayslipWhereInput = {
    archivedAt: null,
    periodStart: { gte: periodStart },
    periodEnd: { lte: periodEnd },
    employee: employeeWhere,
  };

  // 1. Load payslips for selected period
  const payslips = await prisma.payslip.findMany({
    where: payslipWhere,
    include: {
      employee: {
        include: { department: true },
      },
    },
  });

  // Previous month for netChangePercent
  const prevDate = new Date(Date.UTC(year, month - 2, 1));
  const prevYear = prevDate.getUTCFullYear();
  const prevMonth = prevDate.getUTCMonth() + 1;
  const { start: prevStartStr, end: prevEndStr } = monthBounds(prevYear, prevMonth);
  const prevPayslips = await prisma.payslip.findMany({
    where: {
      archivedAt: null,
      periodStart: { gte: new Date(`${prevStartStr}T00:00:00.000Z`) },
      periodEnd: { lte: new Date(`${prevEndStr}T00:00:00.000Z`) },
      employee: employeeWhere,
    },
  });

  let totalNetPaidDec = new Prisma.Decimal(0);
  let totalNetAllDec = new Prisma.Decimal(0);
  let paidCount = 0;
  let doneCount = 0;
  let computedCount = 0;
  let draftCount = 0;

  for (const p of payslips) {
    totalNetAllDec = totalNetAllDec.add(p.net);
    if (p.status === 'paid') {
      paidCount++;
      totalNetPaidDec = totalNetPaidDec.add(p.net);
    } else if (p.status === 'done') {
      doneCount++;
    } else if (p.status === 'computed') {
      computedCount++;
    } else {
      draftCount++;
    }
  }

  let prevTotalNetDec = new Prisma.Decimal(0);
  for (const p of prevPayslips) {
    if (p.status === 'paid') {
      prevTotalNetDec = prevTotalNetDec.add(p.net);
    }
  }
  if (prevTotalNetDec.isZero() && prevPayslips.length > 0) {
    for (const p of prevPayslips) {
      prevTotalNetDec = prevTotalNetDec.add(p.net);
    }
  }

  let netChangePercent = '0.00';
  if (!prevTotalNetDec.isZero()) {
    const currentComp = totalNetPaidDec.isZero() ? totalNetAllDec : totalNetPaidDec;
    const diff = currentComp.sub(prevTotalNetDec);
    const pct = diff.div(prevTotalNetDec).mul(100);
    const rounded = roundHalfUp(pct, 2).toFixed(2);
    netChangePercent = pct.gte(0) ? `+${rounded}` : rounded;
  }

  const payslipsGenerated = payslips.length;
  const averageSalaryDec =
    payslipsGenerated > 0
      ? totalNetAllDec.div(payslipsGenerated)
      : new Prisma.Decimal(0);

  // 2. Attendance in period
  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: {
      date: {
        gte: periodStart,
        lte: periodEnd,
      },
      employee: employeeWhere,
    },
  });

  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let missingCheckOuts = 0;
  let manualEdits = 0;
  let overtimeHoursTotal = 0;

  for (const a of attendanceRecords) {
    if (a.status === 'present') presentCount++;
    else if (a.status === 'late') lateCount++;
    else if (a.status === 'absent') absentCount++;

    if (a.checkIn && !a.checkOut) missingCheckOuts++;
    if (a.isManualEdit) manualEdits++;
    overtimeHoursTotal += Number(a.overtimeHours);
  }

  const totalAttendanceDays = presentCount + lateCount + absentCount;
  const coveragePercent =
    totalAttendanceDays > 0
      ? roundHalfUp(((presentCount + lateCount) / totalAttendanceDays) * 100, 2).toFixed(2)
      : '100.00';
  const attendanceHealthPercent =
    totalAttendanceDays > 0
      ? roundHalfUp((presentCount / totalAttendanceDays) * 100, 2).toFixed(2)
      : '100.00';

  // 3. Time off in period
  const approvedRequests = await prisma.timeOffRequest.findMany({
    where: {
      status: 'approved',
      startDate: { lte: periodEnd },
      endDate: { gte: periodStart },
      employee: employeeWhere,
    },
  });

  let approvedTimeOffDaysTotal = 0;
  for (const r of approvedRequests) {
    approvedTimeOffDaysTotal += Number(r.durationDays);
  }

  // 4. Department Salary Point
  const departments = await prisma.department.findMany({
    where: query.departmentId ? { id: query.departmentId } : {},
    include: {
      employees: {
        where: {
          status: 'active',
          ...(query.employeeType ? { employeeType: query.employeeType } : {}),
        },
      },
    },
  });

  const salaryByDepartment = departments.map((dept) => {
    const deptPayslips = payslips.filter((p) => p.employee.departmentId === dept.id);
    let deptNet = new Prisma.Decimal(0);
    for (const p of deptPayslips) {
      deptNet = deptNet.add(p.net);
    }
    return {
      departmentId: dept.id,
      departmentName: dept.name,
      headcount: dept.employees.length,
      totalNet: moneyString(deptNet),
    };
  });

  // 5. Monthly Trend (last 6 months up to current period)
  const monthlyTrend: { period: string; totalNet: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    const tYear = d.getUTCFullYear();
    const tMonth = d.getUTCMonth() + 1;
    const tPeriod = `${tYear}-${String(tMonth).padStart(2, '0')}`;
    const { start: tStartStr, end: tEndStr } = monthBounds(tYear, tMonth);

    const mSlips = await prisma.payslip.findMany({
      where: {
        archivedAt: null,
        periodStart: { gte: new Date(`${tStartStr}T00:00:00.000Z`) },
        periodEnd: { lte: new Date(`${prevEndStr ? tEndStr : tEndStr}T00:00:00.000Z`) },
        employee: employeeWhere,
      },
    });

    let mNet = new Prisma.Decimal(0);
    for (const s of mSlips) {
      mNet = mNet.add(s.net);
    }
    monthlyTrend.push({
      period: tPeriod,
      totalNet: moneyString(mNet),
    });
  }

  // 6. Alerts from payslip warnings in this period
  const alertCountMap = new Map<string, { code: string; message: string; count: number }>();
  for (const s of payslips) {
    const warnings = Array.isArray(s.warnings) ? (s.warnings as { code: string; message: string }[]) : [];
    for (const w of warnings) {
      const entry = alertCountMap.get(w.code);
      if (entry) {
        entry.count++;
      } else {
        alertCountMap.set(w.code, {
          code: w.code,
          message: w.message,
          count: 1,
        });
      }
    }
  }

  const alertLinkPaths: Record<string, string> = {
    MISSING_BANK_ACCOUNT: '/employees',
    NO_ACTIVE_CONTRACT: '/contracts',
    DUPLICATE_PAYSLIP: '/payroll/payruns',
    CONTRACT_EXPIRING: '/contracts',
    ZERO_WORKED_DAYS: '/attendance',
    UNRECORDED_ATTENDANCE: '/attendance',
  };

  const alerts = Array.from(alertCountMap.values()).map((a) => ({
    code: a.code,
    message: a.message,
    count: a.count,
    linkPath: alertLinkPaths[a.code] ?? '/payroll/payruns',
  }));

  // 7. Time Off Overview by Type
  const timeOffTypes = await prisma.timeOffType.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });

  const [allPendingInPeriod, allAllocationsInPeriod] = await Promise.all([
    prisma.timeOffRequest.findMany({
      where: {
        status: 'to_approve',
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
        employee: employeeWhere,
      },
    }),
    prisma.timeOffAllocation.findMany({
      where: {
        status: 'approved',
        validFrom: { lte: periodEnd },
        validTo: { gte: periodStart },
        employee: employeeWhere,
      },
      include: {
        requests: {
          where: { status: 'approved' },
        },
      },
    }),
  ]);

  const timeOffOverview = timeOffTypes.map((t) => {
    const typeApproved = approvedRequests.filter((r) => r.timeOffTypeId === t.id);
    const typePending = allPendingInPeriod.filter((r) => r.timeOffTypeId === t.id);
    const typeAllocations = allAllocationsInPeriod.filter((a) => a.timeOffTypeId === t.id);

    const isDays = t.unit === 'days';
    let appDays = 0;
    for (const r of typeApproved) {
      appDays += Number(r.durationDays);
    }

    let remBalance = 0;
    for (const a of typeAllocations) {
      let tTaken = 0;
      for (const r of a.requests) {
        tTaken += Number(isDays ? r.durationDays : r.durationHours);
      }
      remBalance += Math.max(0, Number(a.allocated) - tTaken);
    }

    return {
      timeOffType: {
        id: t.id,
        name: t.name,
        code: t.code,
        unit: t.unit as 'days' | 'hours',
        color: t.color,
      },
      approvedDays: quantityString(roundHalfUp(appDays, 2)),
      pending: typePending.length,
      remainingBalance: quantityString(roundHalfUp(remBalance, 2)),
    };
  });

  return {
    period,
    kpis: {
      totalNetPaid: moneyString(totalNetPaidDec.isZero() ? totalNetAllDec : totalNetPaidDec),
      currency: 'INR' as Currency,
      netChangePercent,
      payslipsGenerated,
      payslipsPaid: paidCount,
      payslipsPending: doneCount + computedCount + draftCount,
      averageSalary: moneyString(averageSalaryDec),
      approvedTimeOffDays: quantityString(roundHalfUp(approvedTimeOffDaysTotal, 2)),
      attendanceHealthPercent,
    },
    salaryByDepartment,
    monthlyTrend,
    statusSplit: {
      paid: paidCount,
      done: doneCount,
      computed: computedCount,
      draft: draftCount,
    },
    alerts,
    attendanceOverview: {
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      overtimeHours: quantityString(roundHalfUp(overtimeHoursTotal, 2)),
      missingCheckOuts,
      manualEdits,
      coveragePercent,
    },
    timeOffOverview,
  };
}
