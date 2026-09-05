import { Router } from 'express';
import { USER_ROLE } from '../../../shared/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { queryOf } from '../lib/request.js';
import { validate } from '../middleware/validate.js';
import {
  attendanceRegisterQuerySchema,
  contractExpiryQuerySchema,
  departmentCostQuerySchema,
  leaveBalanceQuerySchema,
  salaryRegisterQuerySchema,
} from '../schemas/reports.schema.js';
import * as reportsService from '../services/reports.service.js';

const router = Router();

function sendReport(
  res: import('express').Response,
  result: Record<string, unknown> | { csv: string },
  format: 'json' | 'csv',
) {
  if (format === 'csv' && 'csv' in result) {
    // TODO: STUB
    res.setHeader('Content-Type', 'text/csv');
    res.send(result.csv);
    return;
  }
  res.json({ data: result });
}

router.get(
  '/salary-register',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_user),
  validate({ query: salaryRegisterQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const query = queryOf(salaryRegisterQuerySchema, req);
      const result = await reportsService.getSalaryRegister(query);
      sendReport(res, result, query.format);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/attendance-register',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ query: attendanceRegisterQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const query = queryOf(attendanceRegisterQuerySchema, req);
      const result = await reportsService.getAttendanceRegister(query);
      sendReport(res, result, query.format);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/leave-balance',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ query: leaveBalanceQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const query = queryOf(leaveBalanceQuerySchema, req);
      const result = await reportsService.getLeaveBalanceReport(query);
      sendReport(res, result, query.format);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/contract-expiry',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ query: contractExpiryQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const query = queryOf(contractExpiryQuerySchema, req);
      const result = await reportsService.getContractExpiryReport(query);
      sendReport(res, result, query.format);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/department-cost',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_user),
  validate({ query: departmentCostQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const query = queryOf(departmentCostQuerySchema, req);
      const result = await reportsService.getDepartmentCostReport(query);
      sendReport(res, result, query.format);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
