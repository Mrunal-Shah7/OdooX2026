import { paginationMeta } from '../lib/pagination.js';
import type { UserRole } from '../../../shared/constants.js';

const stubEmployeeRef = {
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'Priya',
  lastName: 'Sharma',
  workEmail: 'priya.sharma@peoplepay360.com',
  jobPosition: 'Software Engineer',
  departmentName: 'Engineering',
};

const stubTimeOffTypeRef = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Annual Leave',
  code: 'AL',
  unit: 'days' as const,
  color: '#4CAF50',
};

const stubTimeOffType = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Annual Leave',
  code: 'AL',
  unit: 'days' as const,
  requiresAllocation: true,
  isPaid: true,
  approvalRole: 'hr_manager' as UserRole,
  color: '#4CAF50',
  active: true,
};

const stubAllocation = {
  id: '33333333-3333-4333-8333-333333333333',
  employee: stubEmployeeRef,
  timeOffType: stubTimeOffTypeRef,
  allocated: '18.00',
  taken: '3.00',
  remaining: '15.00',
  validFrom: '2026-01-01',
  validTo: '2026-12-31',
  status: 'approved' as const,
  description: 'Annual entitlement 2026',
  approver: null,
};

const stubRequest = {
  id: '44444444-4444-4444-8444-444444444444',
  employee: stubEmployeeRef,
  timeOffType: stubTimeOffTypeRef,
  startDate: '2026-02-10',
  endDate: '2026-02-12',
  durationType: 'full_day' as const,
  requestedHours: null,
  durationDays: '3.00',
  durationHours: '24.00',
  status: 'to_approve' as const,
  reason: 'Family vacation',
  refusalReason: null,
  allocation: stubAllocation,
  approver: null,
};

export async function listTimeOffTypes(query: { page: number; pageSize: number }) {
  // TODO: STUB
  return {
    data: [stubTimeOffType],
    meta: paginationMeta(query.page, query.pageSize, 1),
  };
}

export async function createTimeOffType(body: {
  name: string;
  code: string;
  unit: 'days' | 'hours';
  requiresAllocation?: boolean;
  isPaid?: boolean;
  approvalRole?: UserRole;
  color: string;
  active?: boolean;
}) {
  // TODO: STUB
  return {
    ...stubTimeOffType,
    id: '55555555-5555-4555-8555-555555555555',
    name: body.name,
    code: body.code,
    unit: body.unit,
    color: body.color,
  };
}

export async function getTimeOffType(id: string) {
  // TODO: STUB
  return { ...stubTimeOffType, id };
}

export async function updateTimeOffType(
  id: string,
  body: Partial<{
    name: string;
    unit: 'days' | 'hours';
    requiresAllocation: boolean;
    isPaid: boolean;
    approvalRole: UserRole;
    color: string;
    active: boolean;
  }>,
) {
  // TODO: STUB
  return { ...stubTimeOffType, id, ...body };
}

export async function listAllocations(query: { page: number; pageSize: number }) {
  // TODO: STUB
  return {
    data: [stubAllocation],
    meta: paginationMeta(query.page, query.pageSize, 1),
  };
}

export async function createAllocation(body: {
  employeeId: string;
  timeOffTypeId: string;
  allocated: string;
  validFrom: string;
  validTo: string;
  description?: string | null;
}) {
  // TODO: STUB
  return {
    ...stubAllocation,
    id: '66666666-6666-4666-8666-666666666666',
    allocated: body.allocated,
    taken: '0.00',
    remaining: body.allocated,
    validFrom: body.validFrom,
    validTo: body.validTo,
    status: 'draft' as const,
    description: body.description ?? null,
  };
}

export async function getAllocation(id: string) {
  // TODO: STUB
  return { ...stubAllocation, id };
}

export async function updateAllocation(
  id: string,
  body: Partial<{
    allocated: string;
    validFrom: string;
    validTo: string;
    description: string | null;
  }>,
) {
  // TODO: STUB
  return { ...stubAllocation, id, ...body };
}

export async function approveAllocation(id: string) {
  // TODO: STUB
  return { ...stubAllocation, id, status: 'approved' as const };
}

export async function refuseAllocation(id: string) {
  // TODO: STUB
  return { ...stubAllocation, id, status: 'refused' as const };
}

export async function listTimeOffRequests(query: { page: number; pageSize: number }) {
  // TODO: STUB
  return {
    data: [stubRequest],
    meta: paginationMeta(query.page, query.pageSize, 1),
  };
}

export async function createTimeOffRequest(body: {
  employeeId: string;
  timeOffTypeId: string;
  startDate: string;
  endDate: string;
  durationType: 'full_day' | 'half_day' | 'hours';
  requestedHours?: string;
  reason?: string | null;
}) {
  // TODO: STUB
  return {
    ...stubRequest,
    id: '77777777-7777-4777-8777-777777777777',
    startDate: body.startDate,
    endDate: body.endDate,
    durationType: body.durationType,
    reason: body.reason ?? null,
  };
}

export async function getTimeOffRequest(id: string) {
  // TODO: STUB
  return { ...stubRequest, id };
}

export async function updateTimeOffRequest(
  id: string,
  body: Partial<{
    startDate: string;
    endDate: string;
    durationType: 'full_day' | 'half_day' | 'hours';
    requestedHours: string;
    reason: string | null;
    status: 'cancelled';
  }>,
) {
  // TODO: STUB
  return { ...stubRequest, id, ...body };
}

export async function approveTimeOffRequest(id: string) {
  // TODO: STUB
  return { ...stubRequest, id, status: 'approved' as const };
}

export async function refuseTimeOffRequest(id: string, body?: { refusalReason?: string | null }) {
  // TODO: STUB
  return {
    ...stubRequest,
    id,
    status: 'refused' as const,
    refusalReason: body?.refusalReason ?? null,
  };
}

export async function getTimeOffDashboard(_query: { employeeId?: string; year?: number }) {
  // TODO: STUB
  return {
    employee: stubEmployeeRef,
    year: 2026,
    workingSchedule: {
      id: '66666666-6666-4666-8666-666666666666',
      name: 'Standard 40h',
      hoursPerWeek: '40.00',
    },
    days: [
      { date: '2026-01-01', kind: 'holiday' as const, timeOffTypeId: null, color: null, fraction: null, label: 'New Year' },
      { date: '2026-01-02', kind: 'working' as const, timeOffTypeId: null, color: null, fraction: null, label: null },
    ],
    entitlements: [
      {
        timeOffType: stubTimeOffTypeRef,
        allocated: '18.00',
        taken: '3.00',
        remaining: '15.00',
        pending: '3.00',
      },
    ],
    unplannedSummary: {
      last30Days: '0.00',
      last3Months: '1.00',
      last6Months: '2.00',
      thisYear: '3.00',
    },
  };
}
