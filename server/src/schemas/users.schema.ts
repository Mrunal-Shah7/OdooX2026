import { z } from 'zod';
import { USER_ROLE, USER_STATUS } from '../../../shared/constants.js';
import { paginationQuerySchema } from '../lib/pagination.js';

export const listUsersQuerySchema = paginationQuerySchema.extend({
  q: z.string().max(100).optional(),
  role: z.enum([
    USER_ROLE.employee,
    USER_ROLE.hr_manager,
    USER_ROLE.hr_payroll_user,
    USER_ROLE.hr_payroll_manager,
    USER_ROLE.admin,
  ]).optional(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  role: z.enum([
    USER_ROLE.employee,
    USER_ROLE.hr_manager,
    USER_ROLE.hr_payroll_user,
    USER_ROLE.hr_payroll_manager,
    USER_ROLE.admin,
  ]),
  employeeId: z.string().uuid().nullable().optional(),
});

export const updateUserSchema = z.object({
  role: z.enum([
    USER_ROLE.employee,
    USER_ROLE.hr_manager,
    USER_ROLE.hr_payroll_user,
    USER_ROLE.hr_payroll_manager,
    USER_ROLE.admin,
  ]).optional(),
  status: z.enum([USER_STATUS.invited, USER_STATUS.active, USER_STATUS.disabled]).optional(),
  employeeId: z.string().uuid().nullable().optional(),
});

export const markNotificationsReadSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  all: z.boolean().default(false),
});
