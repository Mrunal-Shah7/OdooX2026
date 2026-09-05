import { toCsv } from '../lib/csv.js';

type ReportKey =
  | 'salary_register'
  | 'attendance_register'
  | 'leave_balance'
  | 'contract_expiry'
  | 'department_cost';

const reportFixtures: Record<
  ReportKey,
  {
    key: ReportKey;
    title: string;
    columns: { key: string; label: string; type: string }[];
    rows: Record<string, string | null>[];
  }
> = {
  salary_register: {
    key: 'salary_register',
    title: 'Salary Register',
    columns: [
      { key: 'employeeName', label: 'Employee', type: 'text' },
      { key: 'department', label: 'Department', type: 'text' },
      { key: 'basic', label: 'Basic', type: 'money' },
      { key: 'gross', label: 'Gross', type: 'money' },
      { key: 'net', label: 'Net', type: 'money' },
    ],
    rows: [
      {
        employeeName: 'Priya Sharma',
        department: 'Engineering',
        basic: '85000.00',
        gross: '85000.00',
        net: '76500.00',
      },
    ],
  },
  attendance_register: {
    key: 'attendance_register',
    title: 'Attendance Register',
    columns: [
      { key: 'employeeName', label: 'Employee', type: 'text' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'workedHours', label: 'Hours', type: 'quantity' },
    ],
    rows: [
      {
        employeeName: 'Priya Sharma',
        date: '2026-01-15',
        status: 'present',
        workedHours: '8.00',
      },
    ],
  },
  leave_balance: {
    key: 'leave_balance',
    title: 'Leave Balance',
    columns: [
      { key: 'employeeName', label: 'Employee', type: 'text' },
      { key: 'timeOffType', label: 'Type', type: 'text' },
      { key: 'allocated', label: 'Allocated', type: 'quantity' },
      { key: 'taken', label: 'Taken', type: 'quantity' },
      { key: 'remaining', label: 'Remaining', type: 'quantity' },
    ],
    rows: [
      {
        employeeName: 'Priya Sharma',
        timeOffType: 'Annual Leave',
        allocated: '18.00',
        taken: '3.00',
        remaining: '15.00',
      },
    ],
  },
  contract_expiry: {
    key: 'contract_expiry',
    title: 'Contract Expiry',
    columns: [
      { key: 'employeeName', label: 'Employee', type: 'text' },
      { key: 'reference', label: 'Reference', type: 'text' },
      { key: 'endDate', label: 'End Date', type: 'date' },
      { key: 'wage', label: 'Wage', type: 'money' },
    ],
    rows: [
      {
        employeeName: 'Amit Patel',
        reference: 'CTR-2025-014',
        endDate: '2026-03-31',
        wage: '65000.00',
      },
    ],
  },
  department_cost: {
    key: 'department_cost',
    title: 'Department Cost',
    columns: [
      { key: 'department', label: 'Department', type: 'text' },
      { key: 'headcount', label: 'Headcount', type: 'number' },
      { key: 'totalNet', label: 'Total Net', type: 'money' },
    ],
    rows: [
      {
        department: 'Engineering',
        headcount: '12',
        totalNet: '1020000.00',
      },
    ],
  },
};

function toCsvReport(report: (typeof reportFixtures)[ReportKey]): string {
  const headers = report.columns.map((c) => c.key);
  const headerLabels = report.columns.map((c) => c.label);
  const rows = report.rows.map((row) =>
    headers.map((h) => row[h] ?? ''),
  );
  return toCsv(headerLabels, rows);
}

export async function getSalaryRegister(query: { format: 'json' | 'csv' }) {
  // TODO: STUB
  const report = reportFixtures.salary_register;
  if (query.format === 'csv') return { csv: toCsvReport(report) };
  return report;
}

export async function getAttendanceRegister(query: { format: 'json' | 'csv' }) {
  // TODO: STUB
  const report = reportFixtures.attendance_register;
  if (query.format === 'csv') return { csv: toCsvReport(report) };
  return report;
}

export async function getLeaveBalanceReport(query: { format: 'json' | 'csv' }) {
  // TODO: STUB
  const report = reportFixtures.leave_balance;
  if (query.format === 'csv') return { csv: toCsvReport(report) };
  return report;
}

export async function getContractExpiryReport(query: { format: 'json' | 'csv' }) {
  // TODO: STUB
  const report = reportFixtures.contract_expiry;
  if (query.format === 'csv') return { csv: toCsvReport(report) };
  return report;
}

export async function getDepartmentCostReport(query: { format: 'json' | 'csv' }) {
  // TODO: STUB
  const report = reportFixtures.department_cost;
  if (query.format === 'csv') return { csv: toCsvReport(report) };
  return report;
}
