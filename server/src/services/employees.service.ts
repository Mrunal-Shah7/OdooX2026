import { prisma } from '../db/client.js';
import { ApiError } from '../lib/apiError.js';
import { paginationMeta } from '../lib/pagination.js';
function mapDepartment(
  d: {
    id: string;
    name: string;
    code: string;
    manager: {
      id: string;
      firstName: string;
      lastName: string;
      workEmail: string;
      jobPosition: string | null;
    } | null;
    _count: { employees: number };
  },
) {
  return {
    id: d.id,
    name: d.name,
    code: d.code,
    headcount: d._count.employees,
    manager: d.manager
      ? {
          id: d.manager.id,
          firstName: d.manager.firstName,
          lastName: d.manager.lastName,
          workEmail: d.manager.workEmail,
          jobPosition: d.manager.jobPosition,
          departmentName: null,
        }
      : null,
  };
}

const departmentInclude = {
  manager: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      workEmail: true,
      jobPosition: true,
    },
  },
  _count: { select: { employees: true } },
} as const;

export async function listDepartments() {
  const rows = await prisma.department.findMany({
    include: departmentInclude,
    orderBy: { name: 'asc' },
  });
  return rows.map(mapDepartment);
}

export async function createDepartment(input: {
  name: string;
  code: string;
  managerId?: string | null;
}) {
  const company = await prisma.company.findFirst();
  if (!company) throw ApiError.internal('Company not configured');

  const code = input.code.toUpperCase();
  const existing = await prisma.department.findFirst({
    where: { OR: [{ name: input.name }, { code }] },
  });
  if (existing) {
    throw ApiError.conflict(
      existing.name === input.name
        ? `Department name "${input.name}" already exists`
        : `Department code "${code}" already exists`,
    );
  }

  if (input.managerId) {
    const manager = await prisma.employee.findUnique({ where: { id: input.managerId } });
    if (!manager) throw ApiError.validation('Manager not found', [
      { field: 'managerId', message: 'Employee does not exist' },
    ]);
  }

  const created = await prisma.department.create({
    data: {
      companyId: company.id,
      name: input.name,
      code,
      managerId: input.managerId ?? null,
    },
    include: departmentInclude,
  });
  return mapDepartment(created);
}

export async function updateDepartment(
  id: string,
  input: { name?: string; code?: string; managerId?: string | null },
) {
  const current = await prisma.department.findUnique({ where: { id } });
  if (!current) throw ApiError.notFound('Department not found');

  const code = input.code !== undefined ? input.code.toUpperCase() : undefined;
  if (input.name || code) {
    const clash = await prisma.department.findFirst({
      where: {
        id: { not: id },
        OR: [
          ...(input.name ? [{ name: input.name }] : []),
          ...(code ? [{ code }] : []),
        ],
      },
    });
    if (clash) {
      throw ApiError.conflict(
        clash.name === input.name
          ? `Department name "${input.name}" already exists`
          : `Department code "${code}" already exists`,
      );
    }
  }

  if (input.managerId) {
    const manager = await prisma.employee.findUnique({ where: { id: input.managerId } });
    if (!manager) throw ApiError.validation('Manager not found', [
      { field: 'managerId', message: 'Employee does not exist' },
    ]);
  }

  const updated = await prisma.department.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(code !== undefined ? { code } : {}),
      ...(input.managerId !== undefined ? { managerId: input.managerId } : {}),
    },
    include: departmentInclude,
  });
  return mapDepartment(updated);
}

export async function deleteDepartment(id: string) {
  const current = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { employees: true } } },
  });
  if (!current) throw ApiError.notFound('Department not found');
  if (current._count.employees > 0) {
    throw ApiError.conflict('Cannot delete a department that still has employees');
  }
  await prisma.department.delete({ where: { id } });
}

const stubEmployee = {
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'Priya',
  lastName: 'Sharma',
  workEmail: 'priya.sharma@peoplepay360.com',
  personalEmail: 'priya.personal@gmail.com',
  phone: '+91 98765 43210',
  department: { id: '33333333-3333-4333-8333-333333333333', name: 'Engineering', code: 'ENG' },
  jobPosition: 'Software Engineer',
  workingSchedule: {
    id: '66666666-6666-4666-8666-666666666666',
    name: 'Standard 40h',
    hoursPerWeek: '40.00',
  },
  employeeType: 'full_time' as const,
  status: 'active' as const,
  joiningDate: '2025-01-15',
  workLocation: 'Bangalore',
  bankName: 'HDFC Bank',
  bankAccountHolder: 'Priya Sharma',
  bankAccountLast4: '1234',
  bankIfsc: 'HDFC0001234',
  manager: null,
};

export async function listEmployees(query: { page: number; pageSize: number }) {
  // TODO: STUB
  return {
    data: [stubEmployee],
    meta: paginationMeta(query.page, query.pageSize, 1),
  };
}

export async function getEmployee(id: string) {
  // TODO: STUB
  return {
    employee: { ...stubEmployee, id },
    counts: { contracts: 1, attendance: 22, timeOff: 3, allocations: 2 },
  };
}

export async function createEmployee(body: {
  firstName: string;
  lastName: string;
  workEmail: string;
  departmentId: string;
  jobPosition: string;
  workingScheduleId: string;
  employeeType: 'full_time' | 'part_time' | 'contract' | 'intern';
  joiningDate: string;
  personalEmail?: string | null;
  phone?: string | null;
  managerId?: string | null;
  workLocation?: string | null;
  bankName?: string | null;
  bankAccountHolder?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
}) {
  // TODO: STUB
  const last4 = body.bankAccountNumber ? body.bankAccountNumber.slice(-4) : null;
  return {
    ...stubEmployee,
    id: '22222222-2222-4222-8222-222222222222',
    firstName: body.firstName,
    lastName: body.lastName,
    workEmail: body.workEmail,
    personalEmail: body.personalEmail ?? null,
    phone: body.phone ?? null,
    department: { ...stubEmployee.department, id: body.departmentId },
    jobPosition: body.jobPosition,
    workingSchedule: { ...stubEmployee.workingSchedule, id: body.workingScheduleId },
    employeeType: body.employeeType,
    joiningDate: body.joiningDate,
    workLocation: body.workLocation ?? null,
    bankName: body.bankName ?? null,
    bankAccountHolder: body.bankAccountHolder ?? null,
    bankAccountLast4: last4,
    bankIfsc: body.bankIfsc ?? null,
  };
}

export async function updateEmployee(
  id: string,
  body: Partial<{
    firstName: string;
    lastName: string;
    personalEmail: string | null;
    phone: string | null;
    departmentId: string;
    jobPosition: string;
    managerId: string | null;
    workingScheduleId: string;
    employeeType: 'full_time' | 'part_time' | 'contract' | 'intern';
    status: 'active' | 'inactive';
    workLocation: string | null;
    bankName: string | null;
    bankAccountHolder: string | null;
    bankAccountNumber: string | null;
    bankIfsc: string | null;
  }>,
) {
  // TODO: STUB
  const last4 =
    body.bankAccountNumber !== undefined
      ? body.bankAccountNumber
        ? body.bankAccountNumber.slice(-4)
        : null
      : stubEmployee.bankAccountLast4;
  return {
    ...stubEmployee,
    id,
    ...(body.firstName !== undefined ? { firstName: body.firstName } : {}),
    ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
    ...(body.personalEmail !== undefined ? { personalEmail: body.personalEmail } : {}),
    ...(body.phone !== undefined ? { phone: body.phone } : {}),
    ...(body.departmentId !== undefined
      ? { department: { ...stubEmployee.department, id: body.departmentId } }
      : {}),
    ...(body.jobPosition !== undefined ? { jobPosition: body.jobPosition } : {}),
    ...(body.workingScheduleId !== undefined
      ? { workingSchedule: { ...stubEmployee.workingSchedule, id: body.workingScheduleId } }
      : {}),
    ...(body.employeeType !== undefined ? { employeeType: body.employeeType } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.workLocation !== undefined ? { workLocation: body.workLocation } : {}),
    ...(body.bankName !== undefined ? { bankName: body.bankName } : {}),
    ...(body.bankAccountHolder !== undefined ? { bankAccountHolder: body.bankAccountHolder } : {}),
    bankAccountLast4: last4,
    ...(body.bankIfsc !== undefined ? { bankIfsc: body.bankIfsc } : {}),
  };
}
