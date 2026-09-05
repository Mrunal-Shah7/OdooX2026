import { Router } from 'express';
import { USER_ROLE } from '../../../shared/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { queryOf } from '../lib/request.js';
import { validate } from '../middleware/validate.js';
import { payrollDashboardQuerySchema } from '../schemas/dashboard.schema.js';
import * as dashboardService from '../services/dashboard.service.js';

const router = Router();

router.get(
  '/payroll',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_user),
  validate({ query: payrollDashboardQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await dashboardService.getPayrollDashboard(queryOf(payrollDashboardQuerySchema, req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
