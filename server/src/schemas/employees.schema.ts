import { z } from 'zod';
import { EMPLOYEE_STATUS, EMPLOYEE_TYPE } from '../../../shared/constants.js';
import { paginationQuerySchema } from '../lib/pagination.js';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const listEmployeesQuerySchema = paginationQuerySchema.extend({
  q: z.string().max(100).optional(),
  departmentId: z.string().uuid().optional(),
  employeeType: z.enum([
    EMPLOYEE_TYPE.full_time,
    EMPLOYEE_TYPE.part_time,
    EMPLOYEE_TYPE.contract,
    EMPLOYEE_TYPE.intern,
  ]).optional(),
  status: z.enum([EMPLOYEE_STATUS.active, EMPLOYEE_STATUS.inactive]).optional(),
  sort: z.string().max(40).optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  workEmail: z.string().email(),
  personalEmail: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  departmentId: z.string().uuid(),
  jobPosition: z.string().min(1).max(80),
  managerId: z.string().uuid().nullable().optional(),
  workingScheduleId: z.string().uuid(),
  employeeType: z.enum([
    EMPLOYEE_TYPE.full_time,
    EMPLOYEE_TYPE.part_time,
    EMPLOYEE_TYPE.contract,
    EMPLOYEE_TYPE.intern,
  ]),
  joiningDate: dateSchema,
  workLocation: z.string().max(80).nullable().optional(),
  bankName: z.string().max(80).nullable().optional(),
  bankAccountHolder: z.string().max(80).nullable().optional(),
  bankAccountNumber: z.string().max(34).nullable().optional(),
  bankIfsc: z.string().max(20).nullable().optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
  personalEmail: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  departmentId: z.string().uuid().optional(),
  jobPosition: z.string().min(1).max(80).optional(),
  managerId: z.string().uuid().nullable().optional(),
  workingScheduleId: z.string().uuid().optional(),
  employeeType: z.enum([
    EMPLOYEE_TYPE.full_time,
    EMPLOYEE_TYPE.part_time,
    EMPLOYEE_TYPE.contract,
    EMPLOYEE_TYPE.intern,
  ]).optional(),
  status: z.enum([EMPLOYEE_STATUS.active, EMPLOYEE_STATUS.inactive]).optional(),
  workLocation: z.string().max(80).nullable().optional(),
  bankName: z.string().max(80).nullable().optional(),
  bankAccountHolder: z.string().max(80).nullable().optional(),
  bankAccountNumber: z.string().max(34).nullable().optional(),
  bankIfsc: z.string().max(20).nullable().optional(),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(60),
  code: z.string().min(1).max(8),
  managerId: z.string().uuid().nullable().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  code: z.string().min(1).max(8).optional(),
  managerId: z.string().uuid().nullable().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});
