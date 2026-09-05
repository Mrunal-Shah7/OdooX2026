import { paginationMeta } from '../../lib/pagination.js';
import { renderPayslipPdf } from './payslipPdf.js';

const stubEmployeeRef = {
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'Priya',
  lastName: 'Sharma',
  workEmail: 'priya.sharma@peoplepay360.com',
  jobPosition: 'Software Engineer',
  departmentName: 'Engineering',
};

const stubPayslip = {
  id: '99999999-9999-4999-8999-999999999999',
  payrunId: '88888888-8888-4888-8888-888888888888',
  payrunName: 'January 2026',
  employee: stubEmployeeRef,
  contract: null,
  salaryStructure: { id: '77777777-7777-4777-8777-777777777777', name: 'India Monthly', code: 'IN-MON' },
  periodStart: '2026-01-01',
  periodEnd: '2026-01-31',
  currency: 'INR' as const,
  payoutCurrency: 'INR' as const,
  exchangeRate: '1.000000',
  scheduledDays: '22.00',
  workedDays: '22.00',
  paidLeaveDays: '0.00',
  unpaidLeaveDays: '0.00',
  absentDays: '0.00',
  overtimeHours: '4.50',
  proration: '1.0000',
  basic: '85000.00',
  gross: '85000.00',
  totalDeductions: '8500.00',
  net: '76500.00',
  status: 'computed' as const,
  archived: false,
  sentAt: null,
  warnings: [] as { code: string; message: string; blocking: boolean }[],
};

const stubLines = [
  {
    ruleCode: 'BASIC',
    ruleName: 'Basic Salary',
    category: 'basic' as const,
    sequence: 10,
    amount: '85000.00',
  },
  {
    ruleCode: 'PF',
    ruleName: 'Provident Fund',
    category: 'deduction' as const,
    sequence: 50,
    amount: '-8500.00',
  },
];

export async function listPayslips(query: { page: number; pageSize: number }) {
  // TODO: STUB
  return {
    data: [stubPayslip],
    meta: paginationMeta(query.page, query.pageSize, 1),
  };
}

export async function getPayslip(id: string) {
  // TODO: STUB
  return {
    payslip: { ...stubPayslip, id },
    lines: stubLines,
  };
}

export async function archivePayslip(id: string) {
  // TODO: STUB
  return { ...stubPayslip, id, archived: true };
}

export async function getPayslipPdf(id: string): Promise<Buffer> {
  // TODO: STUB
  const detail = await getPayslip(id);
  return renderPayslipPdf(detail);
}
