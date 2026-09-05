import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

type Schemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

/**
 * Validate at the trust boundary. Body is replaced with the parsed value.
 * Query/params are validated in place but not reassigned (Express 5 makes them getters);
 * handlers re-parse via queryOf / pathId.
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      schemas.query.parse(req.query);
    }
    if (schemas.params) {
      schemas.params.parse(req.params);
    }
    next();
  };
}
