import type { NextFunction, Request, Response } from 'express';
import { ROLE_ORDER, type UserRole } from '../../../shared/constants.js';
import { ApiError } from '../lib/apiError.js';

export function requireRole(minimum: UserRole) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(ApiError.unauthenticated());
      return;
    }
    const have = ROLE_ORDER.indexOf(req.auth.role);
    const need = ROLE_ORDER.indexOf(minimum);
    if (have < 0 || need < 0 || have < need) {
      next(ApiError.forbidden());
      return;
    }
    next();
  };
}
