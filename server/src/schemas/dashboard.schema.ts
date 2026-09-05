import { z } from 'zod';
import { EMPLOYEE_TYPE } from '../../../shared/constants.js';

export const payrollDashboardQuerySchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  departmentId: z.string().uuid().optional(),
  employeeType: z.enum([
    EMPLOYEE_TYPE.full_time,
    EMPLOYEE_TYPE.part_time,
    EMPLOYEE_TYPE.contract,
    EMPLOYEE_TYPE.intern,
  ]).optional(),
});
