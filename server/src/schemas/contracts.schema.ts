import { z } from 'zod';
import { CONTRACT_STATUS, CURRENCY } from '../../../shared/constants.js';
import { paginationQuerySchema } from '../lib/pagination.js';

const moneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Wage must be a valid positive amount (e.g. 50000.00)')
  .refine((val) => Number(val) > 0, 'Wage must be greater than 0');

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const listContractsQuerySchema = paginationQuerySchema.extend({
  q: z.string().max(100).optional(),
  employeeId: z.string().uuid().optional(),
  status: z.enum([
    CONTRACT_STATUS.draft,
    CONTRACT_STATUS.running,
    CONTRACT_STATUS.expired,
    CONTRACT_STATUS.cancelled,
  ]).optional(),
});

export const createContractSchema = z
  .object({
    employeeId: z.string().uuid('Please select a valid employee'),
    departmentId: z.string().uuid('Please select a valid department'),
    jobPosition: z.string().min(1, 'Job position is required').max(80, 'Job position cannot exceed 80 characters'),
    workingScheduleId: z.string().uuid('Please select a valid working schedule'),
    salaryStructureId: z.string().uuid('Please select a valid salary structure'),
    startDate: dateSchema,
    endDate: dateSchema.nullable().optional(),
    wage: moneySchema,
    currency: z.enum([CURRENCY.INR, CURRENCY.USD], { errorMap: () => ({ message: 'Currency must be INR or USD' }) }),
    status: z.enum([
      CONTRACT_STATUS.draft,
      CONTRACT_STATUS.running,
      CONTRACT_STATUS.expired,
      CONTRACT_STATUS.cancelled,
    ]).optional(),
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    },
  );

export const updateContractSchema = z
  .object({
    departmentId: z.string().uuid().optional(),
    jobPosition: z.string().min(1).max(80).optional(),
    workingScheduleId: z.string().uuid().optional(),
    salaryStructureId: z.string().uuid().optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.nullable().optional(),
    wage: moneySchema.optional(),
    currency: z.enum([CURRENCY.INR, CURRENCY.USD]).optional(),
    status: z.enum([
      CONTRACT_STATUS.draft,
      CONTRACT_STATUS.running,
      CONTRACT_STATUS.expired,
      CONTRACT_STATUS.cancelled,
    ]).optional(),
    notes: z.string().max(1000).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    },
  );
