import { z } from 'zod';
import { EMPLOYEE_STATUS, EMPLOYEE_TYPE } from '../../../shared/constants.js';
import { paginationQuerySchema } from '../lib/pagination.js';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const emailSchema = z.string().email('Please enter a valid email address');
const optionalEmailSchema = z
  .union([z.string().email('Please enter a valid email address'), z.literal('')])
  .nullable()
  .optional()
  .transform((val) => (val === '' ? null : val));

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
  firstName: z.string().trim().min(1, 'First name is required').max(60, 'First name cannot exceed 60 characters'),
  lastName: z.string().trim().min(1, 'Last name is required').max(60, 'Last name cannot exceed 60 characters'),
  workEmail: emailSchema,
  personalEmail: optionalEmailSchema,
  phone: z.string().max(20, 'Phone cannot exceed 20 characters').nullable().optional(),
  departmentId: z.string().uuid('Please select a valid department'),
  jobPosition: z.string().trim().min(1, 'Job position is required').max(80, 'Job position cannot exceed 80 characters'),
  managerId: z.string().uuid().nullable().optional(),
  workingScheduleId: z.string().uuid('Please select a valid working schedule'),
  employeeType: z.enum(
    [
      EMPLOYEE_TYPE.full_time,
      EMPLOYEE_TYPE.part_time,
      EMPLOYEE_TYPE.contract,
      EMPLOYEE_TYPE.intern,
    ],
    { errorMap: () => ({ message: 'Please select a valid employee type' }) },
  ),
  joiningDate: dateSchema,
  workLocation: z.string().max(80).nullable().optional(),
  bankName: z.string().max(80).nullable().optional(),
  bankAccountHolder: z.string().max(80).nullable().optional(),
  bankAccountNumber: z.string().max(34, 'Bank account number cannot exceed 34 characters').nullable().optional(),
  bankIfsc: z.string().max(20, 'IFSC code cannot exceed 20 characters').nullable().optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().trim().min(1, 'First name cannot be empty').max(60).optional(),
  lastName: z.string().trim().min(1, 'Last name cannot be empty').max(60).optional(),
  personalEmail: optionalEmailSchema,
  phone: z.string().max(20).nullable().optional(),
  departmentId: z.string().uuid().optional(),
  jobPosition: z.string().trim().min(1).max(80).optional(),
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
  name: z.string().trim().min(1, 'Department name is required').max(60, 'Department name cannot exceed 60 characters'),
  code: z.string().trim().min(1, 'Department code is required').max(8, 'Department code cannot exceed 8 characters'),
  managerId: z.string().uuid().nullable().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  code: z.string().trim().min(1).max(8).optional(),
  managerId: z.string().uuid().nullable().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid record ID format'),
});
