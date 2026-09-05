import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../../../shared/constants.js';
import { prisma } from '../db/client.js';
import { env } from '../env.js';
import { ApiError } from '../lib/apiError.js';
import type { AccessTokenPayload } from '../lib/tokens.js';

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
      const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload & { sub: string };
      userId = decoded.sub;
    } catch {
      next(ApiError.unauthenticated('Invalid or expired JWT token'));
      return;
    }
  }

  // 2. Check Cookie (pp_at)
  if (!userId && req.cookies?.pp_at) {
    try {
      const decoded = jwt.verify(req.cookies.pp_at, env.JWT_SECRET) as AccessTokenPayload & {
        sub: string;
      };
      userId = decoded.sub;
    } catch {
      // Ignore cookie verify error, try fallback
    }
  }

  // 3. Fallback to x-user-id header
  if (!userId) {
    userId = req.header('x-user-id') || undefined;
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
