import { paginationMeta } from '../lib/pagination.js';
import type { UserRole, UserStatus } from '../../../shared/constants.js';

const stubUser = {
  id: '44444444-4444-4444-8444-444444444444',
  email: 'hr.manager@peoplepay360.com',
  role: 'hr_manager' as UserRole,
  status: 'active' as UserStatus,
  lastLoginAt: '2026-01-15T09:30:00.000Z',
  createdAt: '2025-06-01T08:00:00.000Z',
  employee: {
    id: '11111111-1111-4111-8111-111111111111',
    firstName: 'Priya',
    lastName: 'Sharma',
    workEmail: 'priya.sharma@peoplepay360.com',
    jobPosition: 'HR Manager',
    departmentName: 'Human Resources',
  },
};

export async function listUsers(query: { page: number; pageSize: number }) {
  // TODO: STUB
  return {
    data: [stubUser],
    meta: paginationMeta(query.page, query.pageSize, 1),
  };
}

export async function createUser(body: {
  email: string;
  role: UserRole;
  employeeId?: string | null;
}) {
  // TODO: STUB
  return {
    ...stubUser,
    id: '55555555-5555-4555-8555-555555555555',
    email: body.email,
    role: body.role,
    status: 'invited' as UserStatus,
    lastLoginAt: null,
    employee: body.employeeId
      ? stubUser.employee
      : null,
  };
}

export async function getUser(id: string) {
  // TODO: STUB
  return { ...stubUser, id };
}

export async function updateUser(
  id: string,
  body: { role?: UserRole; status?: UserStatus; employeeId?: string | null },
) {
  // TODO: STUB
  return {
    ...stubUser,
    id,
    ...(body.role !== undefined ? { role: body.role } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.employeeId !== undefined
      ? { employee: body.employeeId ? stubUser.employee : null }
      : {}),
  };
}

export async function resendInvite(_id: string) {
  // TODO: STUB
}
