import { z } from 'zod';
import {
  CURRENCY,
  EMPLOYEE_TYPE,
  PAYRUN_STATUS,
  PAYSLIP_STATUS,
  PERCENTAGE_BASE,
  RULE_CATEGORY,
  RULE_COMPUTATION,
} from '../../../shared/constants.js';
import { paginationQuerySchema } from '../lib/pagination.js';

const moneySchema = z.string().regex(/^-?\d+\.\d{2}$/, 'Amount must be formatted as 0.00');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const listSalaryStructuresQuerySchema = paginationQuerySchema.extend({
  q: z.string().max(100).optional(),
});

export const createSalaryStructureSchema = z.object({
  name: z.string().trim().min(1, 'Structure name is required').max(60, 'Structure name cannot exceed 60 characters'),
  code: z
    .string()
    .trim()
    .min(1, 'Structure code is required')
    .max(12, 'Structure code cannot exceed 12 characters')
    .regex(/^[A-Z0-9_]{1,12}$/, 'Code must contain only uppercase letters, numbers, and underscores'),
  active: z.boolean().default(true),
});

export const updateSalaryStructureSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  active: z.boolean().optional(),
});

export const listSalaryRulesQuerySchema = paginationQuerySchema.extend({
  structureId: z.string().uuid().optional(),
  category: z.enum([
    RULE_CATEGORY.basic,
    RULE_CATEGORY.allowance,
    RULE_CATEGORY.gross,
    RULE_CATEGORY.deduction,
    RULE_CATEGORY.net,
  ]).optional(),
});

export const createSalaryRuleSchema = z.object({
  structureId: z.string().uuid('Please select a valid salary structure'),
  name: z.string().trim().min(1, 'Rule name is required').max(60, 'Rule name cannot exceed 60 characters'),
  code: z.string().trim().regex(/^[A-Z][A-Z0-9_]{0,15}$/, 'Code must start with an uppercase letter and contain only uppercase letters, numbers, and underscores'),
  category: z.enum([
    RULE_CATEGORY.basic,
    RULE_CATEGORY.allowance,
    RULE_CATEGORY.gross,
    RULE_CATEGORY.deduction,
    RULE_CATEGORY.net,
  ], { errorMap: () => ({ message: 'Please select a valid rule category' }) }),
  sequence: z.number().int().min(1, 'Sequence must be at least 1').max(9999, 'Sequence cannot exceed 9999'),
  computation: z.enum([
    RULE_COMPUTATION.fixed,
    RULE_COMPUTATION.percentage,
    RULE_COMPUTATION.formula,
  ], { errorMap: () => ({ message: 'Please select a valid computation type' }) }),
  amount: moneySchema.optional(),
  percentage: z.string().nullable().optional(),
  percentageBase: z.enum([
    PERCENTAGE_BASE.contract_wage,
    PERCENTAGE_BASE.basic,
    PERCENTAGE_BASE.gross,
  ]).nullable().optional(),
  formula: z.string().max(500, 'Formula cannot exceed 500 characters').nullable().optional(),
  active: z.boolean().default(true),
});

export const updateSalaryRuleSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  category: z.enum([
    RULE_CATEGORY.basic,
    RULE_CATEGORY.allowance,
    RULE_CATEGORY.gross,
    RULE_CATEGORY.deduction,
    RULE_CATEGORY.net,
  ]).optional(),
  sequence: z.number().int().min(1).max(9999).optional(),
  computation: z.enum([
    RULE_COMPUTATION.fixed,
    RULE_COMPUTATION.percentage,
    RULE_COMPUTATION.formula,
  ]).optional(),
  amount: moneySchema.optional(),
  percentage: z.string().nullable().optional(),
  percentageBase: z.enum([
    PERCENTAGE_BASE.contract_wage,
    PERCENTAGE_BASE.basic,
    PERCENTAGE_BASE.gross,
  ]).nullable().optional(),
  formula: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
});

export const listEligibleEmployeesQuerySchema = z.object({
  periodStart: dateSchema,
  periodEnd: dateSchema,
  structureId: z.string().uuid(),
  employeeType: z.enum([
    EMPLOYEE_TYPE.full_time,
    EMPLOYEE_TYPE.part_time,
    EMPLOYEE_TYPE.contract,
    EMPLOYEE_TYPE.intern,
  ]).optional(),
  q: z.string().max(100).optional(),
});

export const listPayrunsQuerySchema = paginationQuerySchema.extend({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  status: z.enum([
    PAYRUN_STATUS.draft,
    PAYRUN_STATUS.computed,
    PAYRUN_STATUS.validated,
    PAYRUN_STATUS.paid,
  ]).optional(),
});

export const createPayrunSchema = z
  .object({
    name: z.string().trim().min(1, 'Pay run name is required').max(60, 'Pay run name cannot exceed 60 characters'),
    salaryStructureId: z.string().uuid('Please select a valid salary structure'),
    employeeType: z.enum([
      EMPLOYEE_TYPE.full_time,
      EMPLOYEE_TYPE.part_time,
      EMPLOYEE_TYPE.contract,
      EMPLOYEE_TYPE.intern,
    ]).nullable().optional(),
    periodStart: dateSchema,
    periodEnd: dateSchema,
    payoutCurrency: z.enum([CURRENCY.INR, CURRENCY.USD]),
    exchangeRate: z.string().optional(),
    employeeIds: z.array(z.string().uuid()).min(1, 'At least one employee must be selected for the pay run'),
  })
  .refine(
    (data) => data.periodEnd >= data.periodStart,
    {
      message: 'Period end date must be on or after period start date',
      path: ['periodEnd'],
    },
  );

export const listPayslipsQuerySchema = paginationQuerySchema.extend({
  employeeId: z.string().uuid().optional(),
  payrunId: z.string().uuid().optional(),
  status: z.enum([
    PAYSLIP_STATUS.draft,
    PAYSLIP_STATUS.computed,
    PAYSLIP_STATUS.done,
    PAYSLIP_STATUS.paid,
  ]).optional(),
  includeArchived: z.coerce.boolean().default(false),
});
