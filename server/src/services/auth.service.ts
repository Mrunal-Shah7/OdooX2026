import { prisma } from '../db/client.js';
import { ApiError } from '../lib/apiError.js';
import { verifyPassword } from '../lib/password.js';
import type { UserRole } from '../../../shared/constants.js';

export async function login(body: { email: string; password: string }) {
  // TODO: STUB
  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
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
  if (!user || user.status !== 'active' || !user.passwordHash) {
    throw ApiError.unauthenticated('Invalid email or password');
  }
  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthenticated('Invalid email or password');
  }
  return toSessionUser(user);
}

export async function logout(_userId: string) {
  // TODO: STUB
}

export async function refreshSession() {
  // TODO: STUB
  return {
    id: '44444444-4444-4444-8444-444444444444',
    email: 'admin@peoplepay360.com',
    role: 'admin' as UserRole,
    status: 'active' as const,
    employee: null,
  };
}

export async function getCurrentUser(userId: string) {
  // TODO: STUB
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
  if (!user) throw ApiError.notFound('User not found');
  return toSessionUser(user);
}

export async function requestPasswordReset(_body: { email: string }) {
  // TODO: STUB
}

export async function setPassword(_body: { token: string; password: string }) {
  // TODO: STUB
}

function toSessionUser(user: {
  id: string;
  email: string;
  role: string;
  status: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string | null;
    department: { name: string } | null;
  } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    status: user.status as 'invited' | 'active' | 'disabled',
    employee: user.employee
      ? {
          id: user.employee.id,
          firstName: user.employee.firstName,
          lastName: user.employee.lastName,
          workEmail: user.employee.workEmail,
          jobPosition: user.employee.jobPosition,
          departmentName: user.employee.department?.name ?? null,
        }
      : null,
  };
}
