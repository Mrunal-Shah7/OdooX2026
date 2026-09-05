import { paginationMeta } from '../../lib/pagination.js';

const stubEmployeeRef = {
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'Priya',
  lastName: 'Sharma',
  workEmail: 'priya.sharma@peoplepay360.com',
  jobPosition: 'Software Engineer',
  departmentName: 'Engineering',
};

const stubPayrun = {
  id: '88888888-8888-4888-8888-888888888888',
  name: 'January 2026',
  salaryStructure: { id: '77777777-7777-4777-8777-777777777777', name: 'India Monthly', code: 'IN-MON' },
  employeeType: 'full_time' as const,
  periodStart: '2026-01-01',
  periodEnd: '2026-01-31',
  status: 'computed' as const,
  payoutCurrency: 'INR' as const,
  exchangeRate: '1.000000',
  payslipCount: 1,
  warningCount: 0,
  totalNet: '76500.00',
  paidAt: null,
};

const stubPayslipSummary = {
  id: '99999999-9999-4999-8999-999999999999',
  employee: stubEmployeeRef,
  workedDays: '22.00',
  basic: '85000.00',
  gross: '85000.00',
  net: '76500.00',
  currency: 'INR' as const,
  status: 'computed' as const,
  archived: false,
  sentAt: null,
  warnings: [] as { code: string; message: string; blocking: boolean }[],
};

export async function listEligibleEmployees(_query: {
  periodStart: string;
  periodEnd: string;
  structureId: string;
}) {
  // TODO: STUB
  return {
    data: [
      {
        employee: stubEmployeeRef,
        contractId: '55555555-5555-4555-8555-555555555555',
        workingHours: '176.00',
        contractStartDate: '2025-01-01',
        wage: '85000.00',
        currency: 'INR' as const,
        alreadyPaid: false,
      },
    ],
    meta: paginationMeta(1, 20, 1),
  };
}

export async function listPayruns(query: { page: number; pageSize: number }) {
  // TODO: STUB
  return {
    data: [stubPayrun],
    meta: paginationMeta(query.page, query.pageSize, 1),
  };
}

export async function createPayrun(body: {
  name: string;
  salaryStructureId: string;
  periodStart: string;
  periodEnd: string;
  payoutCurrency: 'INR' | 'USD';
  exchangeRate?: string;
  employeeIds: string[];
}) {
  // TODO: STUB
  return {
    payrun: {
      ...stubPayrun,
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: body.name,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      payoutCurrency: body.payoutCurrency,
      exchangeRate: body.exchangeRate ?? '1.000000',
      status: 'draft' as const,
      payslipCount: body.employeeIds.length,
    },
    payslips: body.employeeIds.map((_, i) => ({
      ...stubPayslipSummary,
      id: `99999999-9999-4999-8999-${String(i).padStart(12, '0')}`,
    })),
  };
}

export async function getPayrun(id: string) {
  // TODO: STUB
  return {
    payrun: { ...stubPayrun, id },
    payslips: [stubPayslipSummary],
  };
}

export async function computePayrun(id: string) {
  // TODO: STUB
  return {
    payrun: { ...stubPayrun, id, status: 'computed' as const },
    payslips: [stubPayslipSummary],
  };
}

export async function validatePayrun(id: string) {
  // TODO: STUB
  return {
    payrun: { ...stubPayrun, id, status: 'validated' as const },
    payslips: [{ ...stubPayslipSummary, status: 'done' as const }],
  };
}

export async function markPayrunPaid(id: string) {
  // TODO: STUB
  return {
    payrun: {
      ...stubPayrun,
      id,
      status: 'paid' as const,
      paidAt: '2026-02-01T10:00:00.000Z',
    },
    payslips: [{ ...stubPayslipSummary, status: 'paid' as const }],
  };
}

export async function sendPayslips(id: string) {
  // TODO: STUB
  return [
    {
      payslipId: stubPayslipSummary.id,
      sent: true,
      error: null,
    },
  ];
}
