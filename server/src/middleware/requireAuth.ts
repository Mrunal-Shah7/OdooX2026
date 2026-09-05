import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../../../shared/constants.js';
import { prisma } from '../db/client.js';
import { ApiError } from '../lib/apiError.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../lib/tokens.js';

export type AuthUser = {
  id: string;
  role: UserRole;
  employeeId: string | null;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  let tokenUser: AuthUser | undefined;

  // 1. Check Authorization: Bearer <jwt>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = verifyAccessToken(token);
      tokenUser = {
        id: payload.sub,
        role: payload.role,
        employeeId: payload.employeeId,
      };
    } catch {
      next(ApiError.unauthenticated('Invalid or expired JWT token'));
      return;
    }
  }

  // 2. Check Cookie (pp_at)
  if (!tokenUser && req.cookies?.[ACCESS_COOKIE]) {
    try {
      const payload = verifyAccessToken(req.cookies[ACCESS_COOKIE]);
      tokenUser = {
        id: payload.sub,
        role: payload.role,
        employeeId: payload.employeeId,
      };
    } catch {
      // Ignore cookie verify error, try fallback
    }
  }

  // 3. Fallback to query parameters (useful for direct browser PDF downloads)
  if (!tokenUser && typeof req.query?.token === 'string') {
    try {
      const payload = verifyAccessToken(req.query.token);
      tokenUser = {
        id: payload.sub,
        role: payload.role,
        employeeId: payload.employeeId,
      };
    } catch {
      // Ignore token verify error
    }
  }

  if (tokenUser) {
    req.auth = tokenUser;
    next();
    return;
  }

  // Development fallback when no signed token is available.
  const userId =
    req.header('x-user-id') ||
    (typeof req.query?.userId === 'string' ? req.query.userId : undefined);
  if (!userId) {
    next(ApiError.unauthenticated());
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== 'active') {
    next(ApiError.unauthenticated('Invalid or inactive session'));
    return;
  }

  req.auth = {
    id: user.id,
    role: user.role as UserRole,
    employeeId: user.employeeId,
  };
  next();
}
