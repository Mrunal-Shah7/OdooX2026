import { prisma } from '../db/client.js';
import { ApiError } from '../lib/apiError.js';
import { verifyPassword } from '../lib/password.js';
import {
  generateOpaqueToken,
  hashToken,
  REFRESH_TOKEN_MAX_AGE_MS,
  signAccessToken,
} from '../lib/tokens.js';
import type { UserRole } from '../../../shared/constants.js';

const employeeInclude = {
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
} as const;

type UserWithEmployee = {
  id: string;
  email: string;
  role: string;
  status: string;
  employeeId: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string | null;
    department: { name: string } | null;
  } | null;
};

async function issueTokenPair(user: UserWithEmployee) {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role as UserRole,
    employeeId: user.employeeId,
  });
  const refreshToken = generateOpaqueToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
    },
  });
  return { accessToken, refreshToken };
}

export async function login(body: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
    include: employeeInclude,
  });
  if (!user || user.status !== 'active' || !user.passwordHash) {
    throw ApiError.unauthenticated('Invalid email or password');
  }
  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthenticated('Invalid email or password');
  }

  const tokens = await issueTokenPair(user);
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  return { user: toSessionUser(user), ...tokens };
}

export async function logout(userId: string, rawRefreshToken: string | undefined) {
  if (rawRefreshToken) {
    await prisma.refreshToken.updateMany({
      where: { userId, tokenHash: hashToken(rawRefreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export async function refreshSession(rawRefreshToken: string | undefined) {
  if (!rawRefreshToken) {
    throw ApiError.unauthenticated('Missing refresh token');
  }
  const tokenHash = hashToken(rawRefreshToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!existing) {
    throw ApiError.unauthenticated('Invalid refresh token');
  }
  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw ApiError.unauthenticated('Refresh token reuse detected');
  }
  if (existing.expiresAt.getTime() <= Date.now()) {
    throw ApiError.unauthenticated('Refresh token expired');
  }

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.findUnique({
    where: { id: existing.userId },
    include: employeeInclude,
  });
  if (!user || user.status !== 'active') {
    throw ApiError.unauthenticated('Invalid or inactive session');
  }

  const tokens = await issueTokenPair(user);
  return { user: toSessionUser(user), ...tokens };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: employeeInclude,
  });
  if (!user) throw ApiError.notFound('User not found');
  return toSessionUser(user);
}

export async function requestPasswordReset(_body: { email: string }) {
  // TODO: STUB — auth_tokens + email
}

export async function setPassword(_body: { token: string; password: string }) {
  // TODO: STUB — consume auth_tokens
}

function toSessionUser(user: UserWithEmployee) {
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
