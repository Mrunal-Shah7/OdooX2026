import { prisma } from '../db/client.js';
import { ApiError } from '../lib/apiError.js';
import { env } from '../env.js';
import { sendMail } from '../lib/mailer.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import {
  generateOpaqueToken,
  hashToken,
  REFRESH_TOKEN_MAX_AGE_MS,
  signAccessToken,
} from '../lib/tokens.js';
import {
  AUTH_TOKEN_PURPOSE,
  USER_STATUS,
  type UserRole,
} from '../../../shared/constants.js';

const AUTH_TOKEN_TTL_MS = 72 * 60 * 60 * 1000;

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

export async function requestPasswordReset(body: { email: string }) {
  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
  });
  if (!user || user.status !== USER_STATUS.active) {
    return;
  }

  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + AUTH_TOKEN_TTL_MS);

  await prisma.authToken.updateMany({
    where: {
      userId: user.id,
      purpose: AUTH_TOKEN_PURPOSE.password_reset,
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  const created = await prisma.authToken.create({
    data: {
      userId: user.id,
      tokenHash,
      purpose: AUTH_TOKEN_PURPOSE.password_reset,
      expiresAt,
    },
  });

  const link = `${env.APP_URL}/set-password?token=${rawToken}`;
  try {
    await sendMail({
      to: user.email,
      subject: 'Reset your PeoplePay360 password',
      html: `<p>Reset your password using this link (expires in 72 hours):</p><p><a href="${link}">${link}</a></p>`,
    });
  } catch (err) {
    await prisma.authToken.delete({ where: { id: created.id } });
    throw err;
  }
}

export async function setPassword(body: { token: string; password: string }) {
  const tokenHash = hashToken(body.token);
  const authToken = await prisma.authToken.findUnique({ where: { tokenHash } });
  if (!authToken) {
    throw ApiError.notFound('Invalid or unknown token');
  }
  if (authToken.usedAt) {
    throw ApiError.conflict('Token has already been used');
  }
  if (authToken.expiresAt.getTime() <= Date.now()) {
    throw ApiError.conflict('Token has expired');
  }

  const purpose = authToken.purpose;
  if (
    purpose !== AUTH_TOKEN_PURPOSE.invite &&
    purpose !== AUTH_TOKEN_PURPOSE.password_reset
  ) {
    throw ApiError.notFound('Invalid or unknown token');
  }

  const user = await prisma.user.findUnique({ where: { id: authToken.userId } });
  if (!user) {
    throw ApiError.notFound('Invalid or unknown token');
  }
  if (user.status === USER_STATUS.disabled) {
    throw ApiError.conflict('User is disabled');
  }
  if (purpose === AUTH_TOKEN_PURPOSE.password_reset && user.status !== USER_STATUS.active) {
    throw ApiError.conflict('Password reset is only valid for active users');
  }
  if (purpose === AUTH_TOKEN_PURPOSE.invite && user.status !== USER_STATUS.invited) {
    throw ApiError.conflict('Invite token is no longer valid for this user');
  }

  const passwordHash = await hashPassword(body.password);
  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: USER_STATUS.active,
      },
    }),
    prisma.authToken.update({
      where: { id: authToken.id },
      data: { usedAt: now },
    }),
    prisma.authToken.updateMany({
      where: {
        userId: user.id,
        purpose,
        usedAt: null,
        id: { not: authToken.id },
      },
      data: { usedAt: now },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: now },
    }),
  ]);
}

export async function changePassword(
  userId: string,
  body: { currentPassword: string; newPassword: string },
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) {
    throw ApiError.unauthenticated('User not found');
  }
  const valid = await verifyPassword(body.currentPassword, user.passwordHash);
  if (!valid) {
    throw ApiError.validation('Current password is incorrect', [
      { field: 'currentPassword', message: 'Current password does not match' },
    ]);
  }
  const passwordHash = await hashPassword(body.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
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
