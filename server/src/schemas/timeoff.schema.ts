import { z } from 'zod';
import {
  ALLOCATION_STATUS,
  REQUEST_STATUS,
  TIME_OFF_DURATION_TYPE,
  TIME_OFF_UNIT,
  USER_ROLE,
} from '../../../shared/constants.js';
import { paginationQuerySchema } from '../lib/pagination.js';

const quantitySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive number (e.g. 1.00)')
  .refine((val) => Number(val) > 0, 'Amount must be greater than 0');

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const listTimeOffTypesQuerySchema = paginationQuerySchema.extend({
  activeOnly: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
});

export const createTimeOffTypeSchema = z.object({
  name: z.string().trim().min(1, 'Type name is required').max(60, 'Type name cannot exceed 60 characters'),
  code: z
    .string()
    .trim()
    .min(1, 'Type code is required')
    .max(8, 'Type code cannot exceed 8 characters')
    .regex(/^[A-Z0-9_]{1,8}$/, 'Code must contain only uppercase letters, numbers, and underscores'),
  unit: z.enum([TIME_OFF_UNIT.days, TIME_OFF_UNIT.hours], { errorMap: () => ({ message: 'Unit must be days or hours' }) }),
  requiresAllocation: z.boolean().default(true),
  isPaid: z.boolean().default(true),
  approvalRole: z
    .enum([
      USER_ROLE.employee,
      USER_ROLE.hr_manager,
      USER_ROLE.hr_payroll_user,
      USER_ROLE.hr_payroll_manager,
      USER_ROLE.admin,
    ])
    .default(USER_ROLE.hr_manager),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex code (e.g. #3b82f6)'),
  active: z.boolean().default(true),
});

export const updateTimeOffTypeSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  unit: z.enum([TIME_OFF_UNIT.days, TIME_OFF_UNIT.hours]).optional(),
  requiresAllocation: z.boolean().optional(),
  isPaid: z.boolean().optional(),
  approvalRole: z
    .enum([
      USER_ROLE.employee,
      USER_ROLE.hr_manager,
      USER_ROLE.hr_payroll_user,
      USER_ROLE.hr_payroll_manager,
      USER_ROLE.admin,
    ])
    .optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  active: z.boolean().optional(),
});

export const listAllocationsQuerySchema = paginationQuerySchema.extend({
  employeeId: z.string().uuid().optional(),
  timeOffTypeId: z.string().uuid().optional(),
  status: z
    .enum([
      ALLOCATION_STATUS.draft,
      ALLOCATION_STATUS.approved,
      ALLOCATION_STATUS.refused,
    ])
    .optional(),
});

export const createAllocationSchema = z
  .object({
    employeeId: z.string().uuid('Please select a valid employee'),
    timeOffTypeId: z.string().uuid('Please select a valid time off type'),
    allocated: quantitySchema,
    validFrom: dateSchema,
    validTo: dateSchema,
    description: z.string().max(500, 'Description cannot exceed 500 characters').nullable().optional(),
  })
  .refine(
    (data) => data.validTo >= data.validFrom,
    {
      message: 'Valid To date must be on or after Valid From date',
      path: ['validTo'],
    },
  );

export const updateAllocationSchema = z
  .object({
    allocated: quantitySchema.optional(),
    validFrom: dateSchema.optional(),
    validTo: dateSchema.optional(),
    description: z.string().max(500).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.validFrom && data.validTo) {
        return data.validTo >= data.validFrom;
      }
      return true;
    },
    {
      message: 'Valid To date must be on or after Valid From date',
      path: ['validTo'],
    },
  );

export const listTimeOffRequestsQuerySchema = paginationQuerySchema.extend({
  employeeId: z.string().uuid().optional(),
  timeOffTypeId: z.string().uuid().optional(),
  status: z
    .enum([
      REQUEST_STATUS.to_approve,
      REQUEST_STATUS.approved,
      REQUEST_STATUS.refused,
      REQUEST_STATUS.cancelled,
    ])
    .optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
});

export const createTimeOffRequestSchema = z
  .object({
    employeeId: z.string().uuid('Please select a valid employee'),
    timeOffTypeId: z.string().uuid('Please select a valid time off type'),
    startDate: dateSchema,
    endDate: dateSchema,
    durationType: z.enum([
      TIME_OFF_DURATION_TYPE.full_day,
      TIME_OFF_DURATION_TYPE.half_day,
      TIME_OFF_DURATION_TYPE.hours,
    ]),
    requestedHours: quantitySchema.optional(),
    reason: z.string().max(500, 'Reason cannot exceed 500 characters').nullable().optional(),
  })
  .refine(
    (data) => data.endDate >= data.startDate,
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    },
  );

export const updateTimeOffRequestSchema = z
  .object({
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    durationType: z
      .enum([
        TIME_OFF_DURATION_TYPE.full_day,
        TIME_OFF_DURATION_TYPE.half_day,
        TIME_OFF_DURATION_TYPE.hours,
      ])
      .optional(),
    requestedHours: quantitySchema.optional(),
    reason: z.string().max(500).nullable().optional(),
    status: z.literal(REQUEST_STATUS.cancelled).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    },
  );

export const refuseTimeOffRequestSchema = z.object({
  refusalReason: z.string().max(500, 'Refusal reason cannot exceed 500 characters').nullable().optional(),
});

export const timeOffDashboardQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});
