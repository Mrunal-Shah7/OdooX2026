import { prisma } from '../db/client.js';
import { ApiError } from '../lib/apiError.js';
import { paginationMeta } from '../lib/pagination.js';
import { USER_STATUS, type UserRole, type UserStatus } from '../../../shared/constants.js';
import { issueInviteEmail } from './auth.service.js';

export async function listUsers(query: { page: number; pageSize: number; q?: string; role?: UserRole }) {
  const where: any = {};
  if (query.role) {
    where.role = query.role;
  }
  if (query.q) {
    where.OR = [
      { email: { contains: query.q, mode: 'insensitive' } },
      { employee: { firstName: { contains: query.q, mode: 'insensitive' } } },
      { employee: { lastName: { contains: query.q, mode: 'insensitive' } } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            jobPosition: true,
            department: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const formattedUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role as UserRole,
    status: u.status as UserStatus,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    employee: u.employee
      ? {
          id: u.employee.id,
          firstName: u.employee.firstName,
          lastName: u.employee.lastName,
          workEmail: u.employee.workEmail,
          jobPosition: u.employee.jobPosition,
          departmentName: u.employee.department?.name ?? '',
        }
      : null,
  }));

  return {
    data: formattedUsers,
    meta: paginationMeta(query.page, query.pageSize, total),
  };
}

export async function createUser(body: {
  email: string;
  role: UserRole;
  employeeId?: string | null;
}) {
  const email = body.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('User with this email already exists');
  }

  if (body.employeeId) {
    const employee = await prisma.employee.findUnique({ where: { id: body.employeeId } });
    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }
    const linked = await prisma.user.findUnique({ where: { employeeId: body.employeeId } });
    if (linked) {
      throw ApiError.conflict('Employee is already linked to another user');
    }
  }

  const user = await prisma.user.create({
    data: {
      email,
      role: body.role,
      status: USER_STATUS.invited,
      employeeId: body.employeeId || null,
    },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          workEmail: true,
          jobPosition: true,
          department: { select: { name: true } },
        },
      },
    },
  });

  await issueInviteEmail({ id: user.id, email: user.email });

  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    status: user.status as UserStatus,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    employee: user.employee
      ? {
          id: user.employee.id,
          firstName: user.employee.firstName,
          lastName: user.employee.lastName,
          workEmail: user.employee.workEmail,
          jobPosition: user.employee.jobPosition,
          departmentName: user.employee.department?.name ?? '',
        }
      : null,
  };
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          workEmail: true,
          jobPosition: true,
          department: { select: { name: true } },
        },
      },
    },
  });
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    status: user.status as UserStatus,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    employee: user.employee
      ? {
          id: user.employee.id,
          firstName: user.employee.firstName,
          lastName: user.employee.lastName,
          workEmail: user.employee.workEmail,
          jobPosition: user.employee.jobPosition,
          departmentName: user.employee.department?.name ?? '',
        }
      : null,
  };
}

export async function updateUser(
  id: string,
  body: { role?: UserRole; status?: UserStatus; employeeId?: string | null },
) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(body.role !== undefined ? { role: body.role } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.employeeId !== undefined ? { employeeId: body.employeeId } : {}),
    },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          workEmail: true,
          jobPosition: true,
          department: { select: { name: true } },
        },
      },
    },
  });

  return {
    id: updated.id,
    email: updated.email,
    role: updated.role as UserRole,
    status: updated.status as UserStatus,
    lastLoginAt: updated.lastLoginAt ? updated.lastLoginAt.toISOString() : null,
    createdAt: updated.createdAt.toISOString(),
    employee: updated.employee
      ? {
          id: updated.employee.id,
          firstName: updated.employee.firstName,
          lastName: updated.employee.lastName,
          workEmail: updated.employee.workEmail,
          jobPosition: updated.employee.jobPosition,
          departmentName: updated.employee.department?.name ?? '',
        }
      : null,
  };
}

export async function resendInvite(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  if (user.status !== USER_STATUS.invited) {
    throw ApiError.conflict('Invite can only be resent for invited users');
  }

  await issueInviteEmail({ id: user.id, email: user.email });
}
