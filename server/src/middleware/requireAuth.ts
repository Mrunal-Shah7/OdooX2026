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

  // 3. Fallback to query parameters (useful for direct browser PDF downloads)
  if (!userId && req.query?.token && typeof req.query.token === 'string') {
    try {
      const decoded = jwt.verify(req.query.token, env.JWT_SECRET) as AccessTokenPayload & {
        sub: string;
      };
      userId = decoded.sub;
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
