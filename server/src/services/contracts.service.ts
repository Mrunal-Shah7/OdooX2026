import { paginationMeta } from '../lib/pagination.js';

const stubEmployeeRef = {
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'Priya',
  lastName: 'Sharma',
  workEmail: 'priya.sharma@peoplepay360.com',
  jobPosition: 'Software Engineer',
  departmentName: 'Engineering',
};

const stubContract = {
  id: '55555555-5555-4555-8555-555555555555',
  reference: 'CTR-2026-001',
  employee: stubEmployeeRef,
  department: { id: '33333333-3333-4333-8333-333333333333', name: 'Engineering', code: 'ENG' },
  jobPosition: 'Software Engineer',
  workingSchedule: {
    id: '66666666-6666-4666-8666-666666666666',
    name: 'Standard 40h',
    hoursPerWeek: '40.00',
  },
  salaryStructure: { id: '77777777-7777-4777-8777-777777777777', name: 'India Monthly', code: 'IN-MON' },
  startDate: '2025-01-01',
  endDate: null,
  wage: '85000.00',
  currency: 'INR' as const,
  status: 'running' as const,
  notes: null,
};

export async function listContracts(query: { page: number; pageSize: number }) {
  // TODO: STUB
  return {
    data: [stubContract],
    meta: paginationMeta(query.page, query.pageSize, 1),
  };
}

export async function createContract(body: {
  employeeId: string;
  departmentId: string;
  jobPosition: string;
  workingScheduleId: string;
  salaryStructureId: string;
  startDate: string;
  endDate?: string | null;
  wage: string;
  currency: 'INR' | 'USD';
  status?: 'draft' | 'running' | 'expired' | 'cancelled';
  notes?: string | null;
}) {
  // TODO: STUB
  return {
    ...stubContract,
    id: '66666666-6666-4666-8666-666666666666',
    reference: 'CTR-2026-002',
    jobPosition: body.jobPosition,
    startDate: body.startDate,
    endDate: body.endDate ?? null,
    wage: body.wage,
    currency: body.currency,
    status: body.status ?? 'draft',
    notes: body.notes ?? null,
  };
}

export async function getContract(id: string) {
  // TODO: STUB
  return { ...stubContract, id };
}

export async function updateContract(
  id: string,
  body: Partial<{
    departmentId: string;
    jobPosition: string;
    workingScheduleId: string;
    salaryStructureId: string;
    startDate: string;
    endDate: string | null;
    wage: string;
    currency: 'INR' | 'USD';
    status: 'draft' | 'running' | 'expired' | 'cancelled';
    notes: string | null;
  }>,
) {
  // TODO: STUB
  return {
    ...stubContract,
    id,
    ...(body.jobPosition !== undefined ? { jobPosition: body.jobPosition } : {}),
    ...(body.startDate !== undefined ? { startDate: body.startDate } : {}),
    ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
    ...(body.wage !== undefined ? { wage: body.wage } : {}),
    ...(body.currency !== undefined ? { currency: body.currency } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {}),
  };
}
