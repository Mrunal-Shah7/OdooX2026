import { z } from 'zod';
import { ATTENDANCE_STATUS } from '../../../shared/constants.js';
import { paginationQuerySchema } from '../lib/pagination.js';

const quantitySchema = z.string().regex(/^-?\d+\.\d{2}$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const listAttendanceQuerySchema = paginationQuerySchema.extend({
  employeeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  status: z.enum([
    ATTENDANCE_STATUS.present,
    ATTENDANCE_STATUS.late,
    ATTENDANCE_STATUS.absent,
    ATTENDANCE_STATUS.half_day,
    ATTENDANCE_STATUS.on_leave,
  ]).optional(),
});

export const createAttendanceSchema = z.object({
  employeeId: z.string().uuid(),
  date: dateSchema,
  checkIn: z.string().datetime().nullable().optional(),
  checkOut: z.string().datetime().nullable().optional(),
  overtimeHours: quantitySchema.optional(),
  status: z.enum([
    ATTENDANCE_STATUS.present,
    ATTENDANCE_STATUS.late,
    ATTENDANCE_STATUS.absent,
    ATTENDANCE_STATUS.half_day,
    ATTENDANCE_STATUS.on_leave,
  ]),
  notes: z.string().max(500).nullable().optional(),
});

export const updateAttendanceSchema = z.object({
  checkIn: z.string().datetime().nullable().optional(),
  checkOut: z.string().datetime().nullable().optional(),
  overtimeHours: quantitySchema.optional(),
  status: z.enum([
    ATTENDANCE_STATUS.present,
    ATTENDANCE_STATUS.late,
    ATTENDANCE_STATUS.absent,
    ATTENDANCE_STATUS.half_day,
    ATTENDANCE_STATUS.on_leave,
  ]).optional(),
  notes: z.string().max(500).nullable().optional(),
});
