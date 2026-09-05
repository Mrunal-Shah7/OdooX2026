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
  const token = req.cookies?.[ACCESS_COOKIE];
  if (typeof token !== 'string' || token.length === 0) {
    next(ApiError.unauthenticated());
    return;
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    next(ApiError.unauthenticated('Invalid or expired access token'));
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
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
