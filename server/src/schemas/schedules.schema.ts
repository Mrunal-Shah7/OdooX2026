import { z } from 'zod';
import { paginationQuerySchema } from '../lib/pagination.js';

const quantitySchema = z.string().regex(/^-?\d+\.\d{2}$/);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const listWorkingSchedulesQuerySchema = paginationQuerySchema.extend({
  q: z.string().max(100).optional(),
});

export const workingScheduleDayInputSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: timeSchema,
  endTime: timeSchema,
  breakHours: quantitySchema.optional(),
});

export const createWorkingScheduleSchema = z.object({
  name: z.string().min(1).max(60),
  active: z.boolean().default(true),
  days: z.array(workingScheduleDayInputSchema).min(1).max(7),
});

export const updateWorkingScheduleSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  active: z.boolean().optional(),
  days: z.array(workingScheduleDayInputSchema).min(1).max(7).optional(),
});

export const listPublicHolidaysQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const createPublicHolidaySchema = z.object({
  name: z.string().min(1).max(80),
  date: dateSchema,
});
