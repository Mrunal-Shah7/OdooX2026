import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/apiError.js';

declare global {
  namespace Express {
    interface Request {
      /** Set by scopeToEmployee when role is employee — own employee id. */
      scopedEmployeeId?: string;
    }
  }
}

/**
 * When the caller is role `employee`, force list filters to their own employeeId
 * and reject detail/mutation access to other employees' records with NOT_FOUND.
 * Module owners call this after requireAuth on employee-scoped routes.
 */
export function scopeToEmployee(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) {
    next(ApiError.unauthenticated());
    return;
  }
  if (req.auth.role !== 'employee') {
    next();
    return;
  }
  if (!req.auth.employeeId) {
    next(ApiError.forbidden('Employee account is not linked to an employee record'));
    return;
  }
  req.scopedEmployeeId = req.auth.employeeId;
  next();
}
