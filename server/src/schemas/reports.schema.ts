import { z } from 'zod';
import { EMPLOYEE_TYPE } from '../../../shared/constants.js';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const salaryRegisterQuerySchema = z.object({
  periodStart: dateSchema,
  periodEnd: dateSchema,
  departmentId: z.string().uuid().optional(),
  employeeType: z.enum([
    EMPLOYEE_TYPE.full_time,
    EMPLOYEE_TYPE.part_time,
    EMPLOYEE_TYPE.contract,
    EMPLOYEE_TYPE.intern,
  ]).optional(),
  format: z.enum(['json', 'csv']).default('json'),
});

export const attendanceRegisterQuerySchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  departmentId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  format: z.enum(['json', 'csv']).default('json'),
});

export const leaveBalanceQuerySchema = z.object({
  asOf: dateSchema.optional(),
  timeOffTypeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  format: z.enum(['json', 'csv']).default('json'),
});

export const contractExpiryQuerySchema = z.object({
  withinDays: z.coerce.number().int().min(1).max(365).default(60),
  departmentId: z.string().uuid().optional(),
  format: z.enum(['json', 'csv']).default('json'),
});

export const departmentCostQuerySchema = z.object({
  periodStart: dateSchema,
  periodEnd: dateSchema,
  format: z.enum(['json', 'csv']).default('json'),
});
