import type { Request } from 'express';
import { z } from 'zod';

const idSchema = z.string().uuid();

/** Read a path UUID after validate({ params }) has run. */
export function pathId(req: Request): string {
  return idSchema.parse(req.params['id']);
}

/** Re-parse query with the same zod schema used in validate({ query }). */
export function queryOf<S extends z.ZodTypeAny>(schema: S, req: Request): z.output<S> {
  return schema.parse(req.query);
}
