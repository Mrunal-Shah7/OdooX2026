import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(8),
  APP_URL: z.string().url(),
  RESEND_API_KEY: z.string().optional().default(''),
  MAIL_FROM: z.string().min(1),
});

export const env = envSchema.parse(process.env);
