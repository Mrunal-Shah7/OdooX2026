import { ERROR_CODE, type ErrorCode } from '../../../shared/constants.js';

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: { field: string; message: string }[];

  constructor(
    code: ErrorCode,
    message: string,
    status: number,
    details?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static validation(message: string, details?: { field: string; message: string }[]) {
    return new ApiError(ERROR_CODE.VALIDATION_FAILED, message, 400, details);
  }

  static unauthenticated(message = 'Authentication required') {
    return new ApiError(ERROR_CODE.UNAUTHENTICATED, message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(ERROR_CODE.FORBIDDEN, message, 403);
  }

  static notFound(message = 'Not found') {
    return new ApiError(ERROR_CODE.NOT_FOUND, message, 404);
  }

  static conflict(message: string) {
    return new ApiError(ERROR_CODE.CONFLICT, message, 409);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(ERROR_CODE.INTERNAL, message, 500);
  }
}
