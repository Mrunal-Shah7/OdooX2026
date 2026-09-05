import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../../../shared/constants.js';
import { prisma } from '../db/client.js';
import { ApiError } from '../lib/apiError.js';

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
  // TODO: STUB — replace with JWT verification of pp_at cookie
  const userId = req.header('x-user-id');
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
