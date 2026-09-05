import { Router } from 'express';
import { USER_ROLE } from '../../../shared/constants.js';
import { pathId, queryOf } from '../lib/request.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { scopeToEmployee } from '../middleware/scopeToEmployee.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/employees.schema.js';
import {
  createAllocationSchema,
  createTimeOffRequestSchema,
  createTimeOffTypeSchema,
  listAllocationsQuerySchema,
  listTimeOffRequestsQuerySchema,
  listTimeOffTypesQuerySchema,
  refuseTimeOffRequestSchema,
  timeOffDashboardQuerySchema,
  updateAllocationSchema,
  updateTimeOffRequestSchema,
  updateTimeOffTypeSchema,
} from '../schemas/timeoff.schema.js';
import * as timeoffService from '../services/timeoff.service.js';

const router: Router = Router();

router.get(
  '/types',
  requireAuth,
  validate({ query: listTimeOffTypesQuerySchema }),
  async (req, res, next) => {
    try {
      const result = await timeoffService.listTimeOffTypes(
        queryOf(listTimeOffTypesQuerySchema, req),
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/types',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ body: createTimeOffTypeSchema }),
  async (req, res, next) => {
    try {
      const data = await timeoffService.createTimeOffType(req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/types/:id',
  requireAuth,
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const data = await timeoffService.getTimeOffType(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/types/:id',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ params: idParamSchema, body: updateTimeOffTypeSchema }),
  async (req, res, next) => {
    try {
      const data = await timeoffService.updateTimeOffType(pathId(req), req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/allocations',
  requireAuth,
  scopeToEmployee,
  validate({ query: listAllocationsQuerySchema }),
  async (req, res, next) => {
    try {
      const result = await timeoffService.listAllocations(
        queryOf(listAllocationsQuerySchema, req),
        req.scopedEmployeeId,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/allocations',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ body: createAllocationSchema }),
  async (req, res, next) => {
    try {
      const data = await timeoffService.createAllocation(req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/allocations/:id',
  requireAuth,
  scopeToEmployee,
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const data = await timeoffService.getAllocation(pathId(req), req.scopedEmployeeId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/allocations/:id',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ params: idParamSchema, body: updateAllocationSchema }),
  async (req, res, next) => {
    try {
      const data = await timeoffService.updateAllocation(pathId(req), req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/allocations/:id/approve',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const data = await timeoffService.approveAllocation(
        pathId(req),
        req.auth?.employeeId,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/allocations/:id/refuse',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const data = await timeoffService.refuseAllocation(
        pathId(req),
        req.auth?.employeeId,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/requests',
  requireAuth,
  scopeToEmployee,
  validate({ query: listTimeOffRequestsQuerySchema }),
  async (req, res, next) => {
    try {
      const result = await timeoffService.listTimeOffRequests(
        queryOf(listTimeOffRequestsQuerySchema, req),
        req.scopedEmployeeId,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/requests',
  requireAuth,
  validate({ body: createTimeOffRequestSchema }),
  async (req, res, next) => {
    try {
      const data = await timeoffService.createTimeOffRequest(req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/requests/:id',
  requireAuth,
  scopeToEmployee,
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const data = await timeoffService.getTimeOffRequest(pathId(req), req.scopedEmployeeId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/requests/:id',
  requireAuth,
  scopeToEmployee,
  validate({ params: idParamSchema, body: updateTimeOffRequestSchema }),
  async (req, res, next) => {
    try {
      const data = await timeoffService.updateTimeOffRequest(
        pathId(req),
        req.body,
        req.scopedEmployeeId,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/requests/:id/approve',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const data = await timeoffService.approveTimeOffRequest(
        pathId(req),
        req.auth?.employeeId,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/requests/:id/refuse',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ params: idParamSchema, body: refuseTimeOffRequestSchema }),
  async (req, res, next) => {
    try {
      const data = await timeoffService.refuseTimeOffRequest(
        pathId(req),
        req.body?.refusalReason,
        req.auth?.employeeId,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/dashboard',
  requireAuth,
  scopeToEmployee,
  validate({ query: timeOffDashboardQuerySchema }),
  async (req, res, next) => {
    try {
      const query = queryOf(timeOffDashboardQuerySchema, req);
      const data = await timeoffService.getTimeOffDashboard(
        query.employeeId,
        query.year,
        req.scopedEmployeeId,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
