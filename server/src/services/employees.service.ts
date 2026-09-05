import { Prisma } from '@prisma/client';
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

function mapEmployee(emp: {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail: string | null;
  phone: string | null;
  jobPosition: string;
  employeeType: string;
  status: string;
  joiningDate: Date;
  workLocation: string | null;
  bankName: string | null;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  department: { id: string; name: string; code: string };
  workingSchedule: { id: string; name: string; hoursPerWeek: Prisma.Decimal };
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string;
  } | null;
}) {
  const joiningDateStr =
    emp.joiningDate instanceof Date
      ? emp.joiningDate.toISOString().split('T')[0]
      : String(emp.joiningDate);

  return {
    id: emp.id,
    firstName: emp.firstName,
    lastName: emp.lastName,
    workEmail: emp.workEmail,
    personalEmail: emp.personalEmail,
    phone: emp.phone,
    department: {
      id: emp.department.id,
      name: emp.department.name,
      code: emp.department.code,
    },
    jobPosition: emp.jobPosition,
    workingSchedule: {
      id: emp.workingSchedule.id,
      name: emp.workingSchedule.name,
      hoursPerWeek: emp.workingSchedule.hoursPerWeek.toString(),
    },
    employeeType: emp.employeeType as 'full_time' | 'part_time' | 'contract' | 'intern',
    status: emp.status as 'active' | 'inactive',
    joiningDate: joiningDateStr,
    workLocation: emp.workLocation,
    bankName: emp.bankName,
    bankAccountHolder: emp.bankAccountHolder,
    bankAccountLast4: emp.bankAccountNumber ? emp.bankAccountNumber.slice(-4) : null,
    bankIfsc: emp.bankIfsc,
    manager: emp.manager
      ? {
          id: emp.manager.id,
          firstName: emp.manager.firstName,
          lastName: emp.manager.lastName,
          workEmail: emp.manager.workEmail,
          jobPosition: emp.manager.jobPosition,
        }
      : null,
  };
}

const employeeInclude = {
  department: { select: { id: true, name: true, code: true } },
  workingSchedule: { select: { id: true, name: true, hoursPerWeek: true } },
  manager: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      workEmail: true,
      jobPosition: true,
    },
  },
} as const;

export async function listEmployees(query: {
  page: number;
  pageSize: number;
  q?: string;
  departmentId?: string;
  employeeType?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}) {
  const where: Prisma.EmployeeWhereInput = {};

  if (query.q) {
    where.OR = [
      { firstName: { contains: query.q, mode: 'insensitive' } },
      { lastName: { contains: query.q, mode: 'insensitive' } },
      { workEmail: { contains: query.q, mode: 'insensitive' } },
      { jobPosition: { contains: query.q, mode: 'insensitive' } },
    ];
  }

  if (query.departmentId) {
    where.departmentId = query.departmentId;
  }

  if (query.employeeType) {
    where.employeeType = query.employeeType;
  }

  if (query.status) {
    where.status = query.status;
  }

  let orderBy: Prisma.EmployeeOrderByWithRelationInput = { createdAt: 'desc' };
  if (query.sort) {
    const orderDir = query.order ?? 'asc';
    if (query.sort === 'name' || query.sort === 'firstName') {
      orderBy = { firstName: orderDir };
    } else if (query.sort === 'joiningDate') {
      orderBy = { joiningDate: orderDir };
    } else if (query.sort === 'jobPosition') {
      orderBy = { jobPosition: orderDir };
    } else {
      orderBy = { [query.sort]: orderDir };
    }
  }

  const skip = (query.page - 1) * query.pageSize;
  const take = query.pageSize;

  const [total, rows] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      skip,
      take,
      orderBy,
      include: employeeInclude,
    }),
  ]);

  return {
    data: rows.map(mapEmployee),
    meta: paginationMeta(query.page, query.pageSize, total),
  };
}

export async function getEmployee(id: string) {
  const emp = await prisma.employee.findUnique({
    where: { id },
    include: {
      ...employeeInclude,
      _count: {
        select: {
          contracts: true,
          attendanceRecords: true,
          timeOffRequests: true,
          allocations: true,
        },
      },
    },
  });

  if (!emp) throw ApiError.notFound('Employee not found');

  return {
    employee: mapEmployee(emp),
    counts: {
      contracts: emp._count.contracts,
      attendance: emp._count.attendanceRecords,
      timeOff: emp._count.timeOffRequests,
      allocations: emp._count.allocations,
    },
  };
}

export async function getEmployeeProfile(employeeId: string) {
  return getEmployee(employeeId);
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
  const existing = await prisma.employee.findUnique({
    where: { workEmail: body.workEmail },
  });
  if (existing) {
    throw ApiError.conflict(`Employee with email "${body.workEmail}" already exists`);
  }

  const dept = await prisma.department.findUnique({ where: { id: body.departmentId } });
  if (!dept) {
    throw ApiError.validation('Department not found', [
      { field: 'departmentId', message: 'Department does not exist' },
    ]);
  }

  const schedule = await prisma.workingSchedule.findUnique({
    where: { id: body.workingScheduleId },
  });
  if (!schedule) {
    throw ApiError.validation('Working schedule not found', [
      { field: 'workingScheduleId', message: 'Schedule does not exist' },
    ]);
  }

  if (body.managerId) {
    const manager = await prisma.employee.findUnique({ where: { id: body.managerId } });
    if (!manager) {
      throw ApiError.validation('Manager not found', [
        { field: 'managerId', message: 'Manager does not exist' },
      ]);
    }
  }

  const created = await prisma.employee.create({
    data: {
      companyId: dept.companyId,
      firstName: body.firstName,
      lastName: body.lastName,
      workEmail: body.workEmail,
      personalEmail: body.personalEmail ?? null,
      phone: body.phone ?? null,
      departmentId: body.departmentId,
      jobPosition: body.jobPosition,
      workingScheduleId: body.workingScheduleId,
      employeeType: body.employeeType,
      joiningDate: new Date(body.joiningDate),
      managerId: body.managerId ?? null,
      workLocation: body.workLocation ?? null,
      bankName: body.bankName ?? null,
      bankAccountHolder: body.bankAccountHolder ?? null,
      bankAccountNumber: body.bankAccountNumber ?? null,
      bankIfsc: body.bankIfsc ?? null,
    },
    include: employeeInclude,
  });

  return mapEmployee(created);
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
  const current = await prisma.employee.findUnique({ where: { id } });
  if (!current) throw ApiError.notFound('Employee not found');

  if (body.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: body.departmentId } });
    if (!dept) {
      throw ApiError.validation('Department not found', [
        { field: 'departmentId', message: 'Department does not exist' },
      ]);
    }
  }

  if (body.workingScheduleId) {
    const schedule = await prisma.workingSchedule.findUnique({
      where: { id: body.workingScheduleId },
    });
    if (!schedule) {
      throw ApiError.validation('Working schedule not found', [
        { field: 'workingScheduleId', message: 'Schedule does not exist' },
      ]);
    }
  }

  if (body.managerId) {
    if (body.managerId === id) {
      throw ApiError.conflict('An employee cannot be their own manager');
    }
    const manager = await prisma.employee.findUnique({ where: { id: body.managerId } });
    if (!manager) {
      throw ApiError.validation('Manager not found', [
        { field: 'managerId', message: 'Manager does not exist' },
      ]);
    }
  }

  const updated = await prisma.employee.update({
    where: { id },
    data: {
      ...(body.firstName !== undefined ? { firstName: body.firstName } : {}),
      ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
      ...(body.personalEmail !== undefined ? { personalEmail: body.personalEmail } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.departmentId !== undefined ? { departmentId: body.departmentId } : {}),
      ...(body.jobPosition !== undefined ? { jobPosition: body.jobPosition } : {}),
      ...(body.workingScheduleId !== undefined
        ? { workingScheduleId: body.workingScheduleId }
        : {}),
      ...(body.employeeType !== undefined ? { employeeType: body.employeeType } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.workLocation !== undefined ? { workLocation: body.workLocation } : {}),
      ...(body.bankName !== undefined ? { bankName: body.bankName } : {}),
      ...(body.bankAccountHolder !== undefined ? { bankAccountHolder: body.bankAccountHolder } : {}),
      ...(body.bankAccountNumber !== undefined
        ? { bankAccountNumber: body.bankAccountNumber }
        : {}),
      ...(body.bankIfsc !== undefined ? { bankIfsc: body.bankIfsc } : {}),
      ...(body.managerId !== undefined ? { managerId: body.managerId } : {}),
    },
    include: employeeInclude,
  });

  return mapEmployee(updated);
}

export async function deleteEmployee(id: string) {
  const current = await prisma.employee.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          contracts: true,
          attendanceRecords: true,
          timeOffRequests: true,
        },
      },
    },
  });

  if (!current) throw ApiError.notFound('Employee not found');
  if (current._count.contracts > 0) {
    throw ApiError.conflict('Cannot delete an employee with active or past contracts');
  }

  await prisma.employee.delete({ where: { id } });
}

