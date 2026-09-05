import { prisma } from '../db/client.js';
import { toCsv } from '../lib/csv.js';

type ReportColumn = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'money' | 'quantity' | 'date';
};

type ReportRow = Record<string, string | null>;

type ReportPayload = {
  key: 'salary_register' | 'attendance_register' | 'leave_balance' | 'contract_expiry' | 'department_cost';
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
};

function formatReportResult(report: ReportPayload, format: 'json' | 'csv') {
  if (format === 'csv') {
    const headerLabels = report.columns.map((c) => c.label);
    const keys = report.columns.map((c) => c.key);
    const csvRows = report.rows.map((row) => keys.map((k) => row[k] ?? ''));
    return { csv: toCsv(headerLabels, csvRows) };
  }
  return report;
}

export async function getSalaryRegister(query: {
  periodStart: string;
  periodEnd: string;
  departmentId?: string;
  employeeType?: string;
  format: 'json' | 'csv';
}) {
  const payslips = await prisma.payslip.findMany({
    where: {
      periodStart: new Date(query.periodStart),
      periodEnd: new Date(query.periodEnd),
      archivedAt: null,
      employee: {
        ...(query.departmentId ? { departmentId: query.departmentId } : {}),
        ...(query.employeeType ? { employeeType: query.employeeType } : {}),
      },
    },
    include: {
      employee: {
        include: { department: true },
      },
    },
    orderBy: { employee: { firstName: 'asc' } },
  });

  const columns: ReportColumn[] = [
    { key: 'employeeName', label: 'Employee', type: 'text' },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'basic', label: 'Basic', type: 'money' },
    { key: 'gross', label: 'Gross', type: 'money' },
    { key: 'totalDeductions', label: 'Deductions', type: 'money' },
    { key: 'net', label: 'Net', type: 'money' },
  ];

  const rows: ReportRow[] = payslips.map((p) => ({
    employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
    department: p.employee.department.name,
    basic: p.basic.toString(),
    gross: p.gross.toString(),
    totalDeductions: p.totalDeductions.toString(),
    net: p.net.toString(),
  }));

  const report: ReportPayload = {
    key: 'salary_register',
    title: 'Salary Register',
    columns,
    rows,
  };

  return formatReportResult(report, query.format);
}

export async function getAttendanceRegister(query: {
  period: string;
  departmentId?: string;
  employeeId?: string;
  format: 'json' | 'csv';
}) {
  const [yearStr = '2026', monthStr = '09'] = query.period.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const records = await prisma.attendanceRecord.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      employee: {
        ...(query.departmentId ? { departmentId: query.departmentId } : {}),
        ...(query.employeeId ? { id: query.employeeId } : {}),
      },
    },
    include: {
      employee: {
        include: { department: true },
      },
    },
    orderBy: [{ date: 'asc' }, { employee: { firstName: 'asc' } }],
  });

  const columns: ReportColumn[] = [
    { key: 'employeeName', label: 'Employee', type: 'text' },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'text' },
    { key: 'workedHours', label: 'Worked Hours', type: 'quantity' },
    { key: 'overtimeHours', label: 'Overtime Hours', type: 'quantity' },
  ];

  const rows: ReportRow[] = records.map((r) => ({
    employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
    department: r.employee.department.name,
    date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10),
    status: r.status,
    workedHours: r.workedHours.toString(),
    overtimeHours: r.overtimeHours.toString(),
  }));

  const report: ReportPayload = {
    key: 'attendance_register',
    title: 'Attendance Register',
    columns,
    rows,
  };

  return formatReportResult(report, query.format);
}

export async function getLeaveBalanceReport(query: {
  asOf?: string;
  timeOffTypeId?: string;
  departmentId?: string;
  format: 'json' | 'csv';
}) {
  const allocations = await prisma.timeOffAllocation.findMany({
    where: {
      status: 'approved',
      ...(query.timeOffTypeId ? { timeOffTypeId: query.timeOffTypeId } : {}),
      employee: {
        ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      },
    },
    include: {
      employee: { include: { department: true } },
      timeOffType: true,
      requests: {
        where: { status: 'approved' },
      },
    },
    orderBy: { employee: { firstName: 'asc' } },
  });

  const columns: ReportColumn[] = [
    { key: 'employeeName', label: 'Employee', type: 'text' },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'timeOffType', label: 'Type', type: 'text' },
    { key: 'allocated', label: 'Allocated', type: 'quantity' },
    { key: 'taken', label: 'Taken', type: 'quantity' },
    { key: 'remaining', label: 'Remaining', type: 'quantity' },
  ];

  const rows: ReportRow[] = allocations.map((a) => {
    const isDays = a.timeOffType.unit === 'days';
    const taken = a.requests.reduce((sum, req) => {
      const val = isDays ? Number(req.durationDays) : Number(req.durationHours);
      return sum + val;
    }, 0);
    const allocated = Number(a.allocated);
    const remaining = Math.max(0, allocated - taken);

    return {
      employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
      department: a.employee.department.name,
      timeOffType: a.timeOffType.name,
      allocated: allocated.toFixed(2),
      taken: taken.toFixed(2),
      remaining: remaining.toFixed(2),
    };
  });

  const report: ReportPayload = {
    key: 'leave_balance',
    title: 'Leave Balance',
    columns,
    rows,
  };

  return formatReportResult(report, query.format);
}

export async function getContractExpiryReport(query: {
  withinDays: number;
  departmentId?: string;
  format: 'json' | 'csv';
}) {
  const now = new Date();
  const maxDate = new Date();
  maxDate.setDate(now.getDate() + query.withinDays);

  const contracts = await prisma.contract.findMany({
    where: {
      endDate: {
        gte: now,
        lte: maxDate,
      },
      status: 'running',
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    },
    include: {
      employee: { include: { department: true } },
    },
    orderBy: { endDate: 'asc' },
  });

  const columns: ReportColumn[] = [
    { key: 'employeeName', label: 'Employee', type: 'text' },
    { key: 'reference', label: 'Reference', type: 'text' },
    { key: 'endDate', label: 'End Date', type: 'date' },
    { key: 'wage', label: 'Wage', type: 'money' },
    { key: 'currency', label: 'Currency', type: 'text' },
  ];

  const rows: ReportRow[] = contracts.map((c) => ({
    employeeName: `${c.employee.firstName} ${c.employee.lastName}`,
    reference: c.reference,
    endDate: c.endDate ? (c.endDate instanceof Date ? c.endDate.toISOString().slice(0, 10) : String(c.endDate).slice(0, 10)) : null,
    wage: c.wage.toString(),
    currency: c.currency,
  }));

  const report: ReportPayload = {
    key: 'contract_expiry',
    title: 'Contract Expiry',
    columns,
    rows,
  };

  return formatReportResult(report, query.format);
}

export async function getDepartmentCostReport(query: {
  periodStart: string;
  periodEnd: string;
  format: 'json' | 'csv';
}) {
  const departments = await prisma.department.findMany({
    include: {
      employees: {
        include: {
          payslips: {
            where: {
              periodStart: new Date(query.periodStart),
              periodEnd: new Date(query.periodEnd),
              archivedAt: null,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const columns: ReportColumn[] = [
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'headcount', label: 'Headcount', type: 'number' },
    { key: 'totalNet', label: 'Total Net Cost', type: 'money' },
  ];

  const rows: ReportRow[] = departments.map((d) => {
    const headcount = d.employees.length;
    const totalNet = d.employees.reduce((sum, emp) => {
      const empNet = emp.payslips.reduce((pSum, p) => pSum + Number(p.net), 0);
      return sum + empNet;
    }, 0);

    return {
      department: d.name,
      headcount: headcount.toString(),
      totalNet: totalNet.toFixed(2),
    };
  });

  const report: ReportPayload = {
    key: 'department_cost',
    title: 'Department Cost',
    columns,
    rows,
  };

  return formatReportResult(report, query.format);
}
