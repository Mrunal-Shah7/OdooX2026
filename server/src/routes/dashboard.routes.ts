import { Router } from 'express';
import { USER_ROLE } from '../../../shared/constants.js';
import { queryOf } from '../lib/request.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { payrollDashboardQuerySchema } from '../schemas/dashboard.schema.js';
import * as dashboardService from '../services/dashboard.service.js';

const router: Router = Router();

router.get(
  '/payroll',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_user),
  validate({ query: payrollDashboardQuerySchema }),
  async (req, res, next) => {
    try {
      const data = await dashboardService.getPayrollDashboard(
        queryOf(payrollDashboardQuerySchema, req),
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
