import { z } from 'zod';
import { paginationQuerySchema } from '../lib/pagination.js';

const quantitySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Break hours must be a valid positive number (e.g. 1.00)');
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm format (e.g. 09:00)');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const listWorkingSchedulesQuerySchema = paginationQuerySchema.extend({
  q: z.string().max(100).optional(),
});

export const workingScheduleDayInputSchema = z
  .object({
    dayOfWeek: z.number().int().min(1, 'Day of week must be between 1 (Mon) and 7 (Sun)').max(7),
    startTime: timeSchema,
    endTime: timeSchema,
    breakHours: quantitySchema.optional(),
  })
  .refine(
    (data) => data.startTime < data.endTime,
    {
      message: 'End time must be later than start time',
      path: ['endTime'],
    },
  );

export const createWorkingScheduleSchema = z.object({
  name: z.string().trim().min(1, 'Schedule name is required').max(60, 'Schedule name cannot exceed 60 characters'),
  active: z.boolean().default(true),
  days: z.array(workingScheduleDayInputSchema).min(1, 'At least one working day must be configured').max(7),
});

export const updateWorkingScheduleSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  active: z.boolean().optional(),
  days: z.array(workingScheduleDayInputSchema).min(1).max(7).optional(),
});

export const listPublicHolidaysQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const createPublicHolidaySchema = z.object({
  name: z.string().trim().min(1, 'Holiday name is required').max(80, 'Holiday name cannot exceed 80 characters'),
  date: dateSchema,
});
