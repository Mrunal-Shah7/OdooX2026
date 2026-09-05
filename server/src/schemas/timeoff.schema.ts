import { z } from 'zod';
import {
  ALLOCATION_STATUS,
  REQUEST_STATUS,
  TIME_OFF_DURATION_TYPE,
  TIME_OFF_UNIT,
  USER_ROLE,
} from '../../../shared/constants.js';
import { paginationQuerySchema } from '../lib/pagination.js';

const quantitySchema = z.string().regex(/^-?\d+\.\d{2}$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const listTimeOffTypesQuerySchema = paginationQuerySchema.extend({
  q: z.string().max(100).optional(),
});

export const createTimeOffTypeSchema = z.object({
  name: z.string().min(1).max(60),
  code: z.string().min(1).max(8),
  unit: z.enum([TIME_OFF_UNIT.days, TIME_OFF_UNIT.hours]),
  requiresAllocation: z.boolean().default(true),
  isPaid: z.boolean().default(true),
  approvalRole: z.enum([
    USER_ROLE.employee,
    USER_ROLE.hr_manager,
    USER_ROLE.hr_payroll_user,
    USER_ROLE.hr_payroll_manager,
    USER_ROLE.admin,
  ]).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  active: z.boolean().default(true),
});

export const updateTimeOffTypeSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  unit: z.enum([TIME_OFF_UNIT.days, TIME_OFF_UNIT.hours]).optional(),
  requiresAllocation: z.boolean().optional(),
  isPaid: z.boolean().optional(),
  approvalRole: z.enum([
    USER_ROLE.employee,
    USER_ROLE.hr_manager,
    USER_ROLE.hr_payroll_user,
    USER_ROLE.hr_payroll_manager,
    USER_ROLE.admin,
  ]).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  active: z.boolean().optional(),
});

export const listAllocationsQuerySchema = paginationQuerySchema.extend({
  employeeId: z.string().uuid().optional(),
  timeOffTypeId: z.string().uuid().optional(),
  status: z.enum([
    ALLOCATION_STATUS.draft,
    ALLOCATION_STATUS.approved,
    ALLOCATION_STATUS.refused,
  ]).optional(),
});

export const createAllocationSchema = z.object({
  employeeId: z.string().uuid(),
  timeOffTypeId: z.string().uuid(),
  allocated: quantitySchema,
  validFrom: dateSchema,
  validTo: dateSchema,
  description: z.string().max(500).nullable().optional(),
});

export const updateAllocationSchema = z.object({
  allocated: quantitySchema.optional(),
  validFrom: dateSchema.optional(),
  validTo: dateSchema.optional(),
  description: z.string().max(500).nullable().optional(),
});

export const listTimeOffRequestsQuerySchema = paginationQuerySchema.extend({
  employeeId: z.string().uuid().optional(),
  timeOffTypeId: z.string().uuid().optional(),
  status: z.enum([
    REQUEST_STATUS.to_approve,
    REQUEST_STATUS.approved,
    REQUEST_STATUS.refused,
    REQUEST_STATUS.cancelled,
  ]).optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
});

export const createTimeOffRequestSchema = z.object({
  employeeId: z.string().uuid(),
  timeOffTypeId: z.string().uuid(),
  startDate: dateSchema,
  endDate: dateSchema,
  durationType: z.enum([
    TIME_OFF_DURATION_TYPE.full_day,
    TIME_OFF_DURATION_TYPE.half_day,
    TIME_OFF_DURATION_TYPE.hours,
  ]),
  requestedHours: quantitySchema.optional(),
  reason: z.string().max(500).nullable().optional(),
});

export const updateTimeOffRequestSchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  durationType: z.enum([
    TIME_OFF_DURATION_TYPE.full_day,
    TIME_OFF_DURATION_TYPE.half_day,
    TIME_OFF_DURATION_TYPE.hours,
  ]).optional(),
  requestedHours: quantitySchema.optional(),
  reason: z.string().max(500).nullable().optional(),
  status: z.literal(REQUEST_STATUS.cancelled).optional(),
});

export const refuseTimeOffRequestSchema = z.object({
  refusalReason: z.string().max(500).nullable().optional(),
});

export const timeOffDashboardQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});
