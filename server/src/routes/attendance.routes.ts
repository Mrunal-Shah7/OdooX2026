import { Router } from 'express';
import { USER_ROLE } from '../../../shared/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { scopeToEmployee } from '../middleware/scopeToEmployee.js';
import { pathId, queryOf } from '../lib/request.js';
import { validate } from '../middleware/validate.js';
import {
  createAttendanceSchema,
  listAttendanceQuerySchema,
  updateAttendanceSchema,
} from '../schemas/attendance.schema.js';
import { idParamSchema } from '../schemas/employees.schema.js';
import * as attendanceService from '../services/attendance.service.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  scopeToEmployee,
  validate({ query: listAttendanceQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const result = await attendanceService.listAttendance(queryOf(listAttendanceQuerySchema, req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ body: createAttendanceSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await attendanceService.createAttendance(req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get('/active', requireAuth, async (req, res, next) => { // TODO: STUB
  try {
    const employeeId = req.auth!.employeeId ?? '11111111-1111-4111-8111-111111111111';
    const data = await attendanceService.getActiveAttendance(employeeId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post('/check-in', requireAuth, async (req, res, next) => { // TODO: STUB
  try {
    const employeeId = req.auth!.employeeId ?? '11111111-1111-4111-8111-111111111111';
    const data = await attendanceService.checkIn(employeeId);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

router.post('/check-out', requireAuth, async (req, res, next) => { // TODO: STUB
  try {
    const employeeId = req.auth!.employeeId ?? '11111111-1111-4111-8111-111111111111';
    const data = await attendanceService.checkOut(employeeId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/:id',
  requireAuth,
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await attendanceService.getAttendance(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/:id',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ params: idParamSchema, body: updateAttendanceSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await attendanceService.updateAttendance(pathId(req), req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
