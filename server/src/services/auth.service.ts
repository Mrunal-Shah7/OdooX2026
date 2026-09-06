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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#039;';
      default:
        return character;
    }
  });
}

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

/** Create a single-use auth link token, email it, delete the row if send fails. */
export async function issueAuthTokenEmail(input: {
  userId: string;
  email: string;
  purpose: (typeof AUTH_TOKEN_PURPOSE)[keyof typeof AUTH_TOKEN_PURPOSE];
  subject: string;
  html: (link: string) => string;
}): Promise<void> {
  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + AUTH_TOKEN_TTL_MS);

  await prisma.authToken.updateMany({
    where: {
      userId: input.userId,
      purpose: input.purpose,
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  const created = await prisma.authToken.create({
    data: {
      userId: input.userId,
      tokenHash,
      purpose: input.purpose,
      expiresAt,
    },
  });

  const link = `${env.APP_URL}/set-password?token=${rawToken}`;
  try {
    await sendMail({
      to: input.email,
      subject: input.subject,
      html: input.html(link),
    });
  } catch (err) {
    await prisma.authToken.delete({ where: { id: created.id } });
    throw err;
  }
}

export async function issueInviteEmail(user: { id: string; email: string }): Promise<void> {
  await issueAuthTokenEmail({
    userId: user.id,
    email: user.email,
    purpose: AUTH_TOKEN_PURPOSE.invite,
    subject: 'Welcome to PeoplePay360 — set up your account',
    html: (link) => {
      const iconUrl = escapeHtml(`${env.APP_URL}/favicon.png`);
      const inviteLink = escapeHtml(link);
      const recipientEmail = escapeHtml(user.email);

      return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Welcome to PeoplePay360</title>
  </head>
  <body style="margin:0;background:#f4f6f8;color:#111a24;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Your PeoplePay360 account is ready. Create your password to get started.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f6f8;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;overflow:hidden;border:1px solid #dde2e8;border-radius:6px;background:#ffffff;box-shadow:0 4px 12px rgba(17,26,36,0.10);">
            <tr>
              <td style="padding:24px 32px;background:#14283f;text-align:center;">
                <img src="${iconUrl}" width="56" height="60" alt="PeoplePay360" style="display:block;margin:0 auto 12px;object-fit:contain;">
                <div style="color:#f7f9fb;font-size:22px;font-weight:700;line-height:1.35;">PeoplePay360</div>
                <div style="margin-top:4px;color:#e7ecf2;font-size:13px;line-height:1.6;">HR and Payroll, all in one place</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;color:#14283f;font-size:28px;line-height:1.15;">You’re invited!</h1>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hello,</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
                  Welcome to PeoplePay360. Your administrator has created an account for
                  <strong>${recipientEmail}</strong>. Set your password to securely access your HR and payroll workspace.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="border-radius:4px;background:#2563a8;">
                      <a href="${inviteLink}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:16px;font-weight:600;line-height:1.35;text-decoration:none;">Set up my account</a>
                    </td>
                  </tr>
                </table>
                <div style="margin-bottom:24px;padding:16px;border:1px solid #dde2e8;border-radius:4px;background:#f7f9fb;">
                  <p style="margin:0;color:#5b6672;font-size:14px;line-height:1.6;">
                    For your security, this invitation link is single-use and expires in 72 hours.
                    If you weren’t expecting this invitation, you can safely ignore this email.
                  </p>
                </div>
                <p style="margin:0 0 8px;color:#5b6672;font-size:13px;line-height:1.6;">If the button doesn’t work, copy and paste this link into your browser:</p>
                <p style="margin:0;overflow-wrap:anywhere;font-family:'IBM Plex Mono',monospace;font-size:12px;line-height:1.6;">
                  <a href="${inviteLink}" style="color:#2563a8;">${inviteLink}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #dde2e8;background:#f7f9fb;color:#5b6672;font-size:13px;line-height:1.6;">
                Warm regards,<br>
                <strong style="color:#111a24;">The PeoplePay360 Team</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
    },
  });
}

export async function requestPasswordReset(body: { email: string }) {
  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
  });
  if (!user || user.status !== USER_STATUS.active) {
    return;
  }

  await issueAuthTokenEmail({
    userId: user.id,
    email: user.email,
    purpose: AUTH_TOKEN_PURPOSE.password_reset,
    subject: 'Reset your PeoplePay360 password',
    html: (link) =>
      `<p>Reset your password using this link (expires in 72 hours):</p><p><a href="${link}">${link}</a></p>`,
  });
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
