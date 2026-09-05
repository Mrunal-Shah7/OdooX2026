import { Router } from 'express';
import { USER_ROLE } from '../../../shared/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { pathId, queryOf } from '../lib/request.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/employees.schema.js';
import {
  createPublicHolidaySchema,
  createWorkingScheduleSchema,
  listPublicHolidaysQuerySchema,
  listWorkingSchedulesQuerySchema,
  updateWorkingScheduleSchema,
} from '../schemas/schedules.schema.js';
import * as schedulesService from '../services/schedules.service.js';

const router: Router = Router();

router.get(
  '/working-schedules',
  requireAuth,
  validate({ query: listWorkingSchedulesQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const result = await schedulesService.listWorkingSchedules(queryOf(listWorkingSchedulesQuerySchema, req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/working-schedules',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ body: createWorkingScheduleSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await schedulesService.createWorkingSchedule(req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/working-schedules/:id',
  requireAuth,
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await schedulesService.getWorkingSchedule(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/working-schedules/:id',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ params: idParamSchema, body: updateWorkingScheduleSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await schedulesService.updateWorkingSchedule(pathId(req), req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/public-holidays',
  requireAuth,
  validate({ query: listPublicHolidaysQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await schedulesService.listPublicHolidays(queryOf(listPublicHolidaysQuerySchema, req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/public-holidays',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_manager),
  validate({ body: createPublicHolidaySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await schedulesService.createPublicHoliday(req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/public-holidays/:id',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_manager),
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      await schedulesService.deletePublicHoliday(pathId(req));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
