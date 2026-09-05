import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ERROR_CODE } from '../../../shared/constants.js';
import { ApiError } from '../lib/apiError.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: ERROR_CODE.VALIDATION_FAILED,
        message: 'Request validation failed',
        details: err.issues.map((issue) => ({
          field: issue.path.join('.') || '(root)',
          message: issue.message,
        })),
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: {
      code: ERROR_CODE.INTERNAL,
      message: 'Internal server error',
    },
  });
}
