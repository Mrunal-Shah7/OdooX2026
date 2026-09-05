import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../../../shared/constants.js';
import { prisma } from '../db/client.js';
import { ApiError } from '../lib/apiError.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../lib/tokens.js';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  status: string;
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
  let userId: string | undefined;

  // 1. Check Authorization: Bearer <jwt>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = verifyAccessToken(token);
      userId = payload.sub;
    } catch {
      next(ApiError.unauthenticated('Invalid or expired JWT token'));
      return;
    }
  }

  // 2. Check Cookie (pp_at)
  if (!userId && req.cookies?.[ACCESS_COOKIE]) {
    try {
      const payload = verifyAccessToken(req.cookies[ACCESS_COOKIE]);
      userId = payload.sub;
    } catch {
      // Ignore cookie verify error, try fallback
    }
  }

  // 3. Fallback to query parameters (useful for direct browser PDF downloads)
  if (!userId && typeof req.query?.token === 'string') {
    try {
      const payload = verifyAccessToken(req.query.token);
      userId = payload.sub;
    } catch {
      // Ignore token verify error
    }
  }

  // 4. Fallback to x-user-id header or userId query parameter
  if (!userId) {
    userId = req.header('x-user-id') || (typeof req.query?.userId === 'string' ? req.query.userId : undefined);
  }

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
    email: user.email,
    role: user.role as UserRole,
    status: user.status,
    employeeId: user.employeeId,
  };
  next();
}
