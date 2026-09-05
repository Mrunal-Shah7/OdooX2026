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

const moneySchema = z.string().regex(/^-?\d+\.\d{2}$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const listSalaryStructuresQuerySchema = paginationQuerySchema.extend({
  q: z.string().max(100).optional(),
});

export const createSalaryStructureSchema = z.object({
  name: z.string().min(1).max(60),
  code: z.string().min(1).max(12),
  active: z.boolean().default(true),
});

export const updateSalaryStructureSchema = z.object({
  name: z.string().min(1).max(60).optional(),
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
  structureId: z.string().uuid(),
  name: z.string().min(1).max(60),
  code: z.string().regex(/^[A-Z][A-Z0-9_]{0,15}$/),
  category: z.enum([
    RULE_CATEGORY.basic,
    RULE_CATEGORY.allowance,
    RULE_CATEGORY.gross,
    RULE_CATEGORY.deduction,
    RULE_CATEGORY.net,
  ]),
  sequence: z.number().int().min(1).max(9999),
  computation: z.enum([
    RULE_COMPUTATION.fixed,
    RULE_COMPUTATION.percentage,
    RULE_COMPUTATION.formula,
  ]),
  amount: moneySchema.optional(),
  percentage: z.string().nullable().optional(),
  percentageBase: z.enum([
    PERCENTAGE_BASE.contract_wage,
    PERCENTAGE_BASE.basic,
    PERCENTAGE_BASE.gross,
  ]).nullable().optional(),
  formula: z.string().max(500).nullable().optional(),
  active: z.boolean().default(true),
});

export const updateSalaryRuleSchema = z.object({
  name: z.string().min(1).max(60).optional(),
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

export const createPayrunSchema = z.object({
  name: z.string().min(1).max(60),
  salaryStructureId: z.string().uuid(),
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
  employeeIds: z.array(z.string().uuid()).min(1),
});

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
