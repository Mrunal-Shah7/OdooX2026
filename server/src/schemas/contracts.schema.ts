import { z } from 'zod';
import { CONTRACT_STATUS, CURRENCY } from '../../../shared/constants.js';
import { paginationQuerySchema } from '../lib/pagination.js';

const moneySchema = z.string().regex(/^-?\d+\.\d{2}$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

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

export const createContractSchema = z.object({
  employeeId: z.string().uuid(),
  departmentId: z.string().uuid(),
  jobPosition: z.string().min(1).max(80),
  workingScheduleId: z.string().uuid(),
  salaryStructureId: z.string().uuid(),
  startDate: dateSchema,
  endDate: dateSchema.nullable().optional(),
  wage: moneySchema,
  currency: z.enum([CURRENCY.INR, CURRENCY.USD]),
  status: z.enum([
    CONTRACT_STATUS.draft,
    CONTRACT_STATUS.running,
    CONTRACT_STATUS.expired,
    CONTRACT_STATUS.cancelled,
  ]).optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const updateContractSchema = z.object({
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
});
