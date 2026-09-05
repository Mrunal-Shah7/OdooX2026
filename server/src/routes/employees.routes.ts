import { Router } from 'express';
import { USER_ROLE } from '../../../shared/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { scopeToEmployee } from '../middleware/scopeToEmployee.js';
import { pathId, queryOf } from '../lib/request.js';
import { validate } from '../middleware/validate.js';
import {
  createDepartmentSchema,
  createEmployeeSchema,
  idParamSchema,
  listEmployeesQuerySchema,
  updateDepartmentSchema,
  updateEmployeeSchema,
} from '../schemas/employees.schema.js';
import * as employeesService from '../services/employees.service.js';

const router = Router();

router.get(
  '/employees',
  requireAuth,
  scopeToEmployee,
  validate({ query: listEmployeesQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const result = await employeesService.listEmployees(queryOf(listEmployeesQuerySchema, req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/employees',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ body: createEmployeeSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await employeesService.createEmployee(req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/employees/:id',
  requireAuth,
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await employeesService.getEmployee(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/employees/:id',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ params: idParamSchema, body: updateEmployeeSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await employeesService.updateEmployee(pathId(req), req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get('/departments', requireAuth, async (_req, res, next) => {
  try {
    const data = await employeesService.listDepartments();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/departments',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ body: createDepartmentSchema }),
  async (req, res, next) => {
    try {
      const data = await employeesService.createDepartment(req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/departments/:id',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ params: idParamSchema, body: updateDepartmentSchema }),
  async (req, res, next) => {
    try {
      const data = await employeesService.updateDepartment(pathId(req), req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/departments/:id',
  requireAuth,
  requireRole(USER_ROLE.hr_manager),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      await employeesService.deleteDepartment(pathId(req));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
