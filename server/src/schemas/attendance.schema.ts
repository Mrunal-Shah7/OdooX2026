import { z } from 'zod';
import { ATTENDANCE_STATUS } from '../../../shared/constants.js';
import { paginationQuerySchema } from '../lib/pagination.js';

const quantitySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Overtime hours must be a valid non-negative number (e.g. 1.50)');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

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

export const createAttendanceSchema = z
  .object({
    employeeId: z.string().uuid('Please select a valid employee'),
    date: dateSchema,
    checkIn: z.string().datetime({ message: 'Check-in must be a valid ISO timestamp' }).nullable().optional(),
    checkOut: z.string().datetime({ message: 'Check-out must be a valid ISO timestamp' }).nullable().optional(),
    overtimeHours: quantitySchema.optional(),
    status: z.enum([
      ATTENDANCE_STATUS.present,
      ATTENDANCE_STATUS.late,
      ATTENDANCE_STATUS.absent,
      ATTENDANCE_STATUS.half_day,
      ATTENDANCE_STATUS.on_leave,
    ], { errorMap: () => ({ message: 'Please select a valid attendance status' }) }),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.checkIn && data.checkOut) {
        return new Date(data.checkOut).getTime() >= new Date(data.checkIn).getTime();
      }
      return true;
    },
    {
      message: 'Check-out time must be after check-in time',
      path: ['checkOut'],
    },
  );

export const updateAttendanceSchema = z
  .object({
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
  })
  .refine(
    (data) => {
      if (data.checkIn && data.checkOut) {
        return new Date(data.checkOut).getTime() >= new Date(data.checkIn).getTime();
      }
      return true;
    },
    {
      message: 'Check-out time must be after check-in time',
      path: ['checkOut'],
    },
  );
