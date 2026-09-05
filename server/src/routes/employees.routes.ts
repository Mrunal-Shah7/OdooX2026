import { Router } from 'express';
import { USER_ROLE } from '../../../shared/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { scopeToEmployee } from '../middleware/scopeToEmployee.js';
import { ApiError } from '../lib/apiError.js';
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

const router: Router = Router();

// Employee list endpoint (supported on /employees and /admin/employees)
router.get(
  ['/employees', '/admin/employees'],
  requireAuth,
  requireRole(USER_ROLE.admin),
  validate({ query: listEmployeesQuerySchema }),
  async (req, res, next) => {
    try {
      const result = await employeesService.listEmployees(queryOf(listEmployeesQuerySchema, req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// Create employee (supported on /employees and /admin/employees)
router.post(
  ['/employees', '/admin/employees'],
  requireAuth,
  requireRole(USER_ROLE.admin),
  validate({ body: createEmployeeSchema }),
  async (req, res, next) => {
    try {
      const data = await employeesService.createEmployee(req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

// User profile endpoint for the currently logged in employee (accessible by any authenticated user)
router.get(
  ['/profile', '/employees/profile'],
  requireAuth,
  async (req, res, next) => {
    try {
      if (!req.auth?.employeeId) {
        throw ApiError.notFound('Employee profile not linked to user');
      }
      const data = await employeesService.getEmployeeProfile(req.auth.employeeId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

// Get employee by ID (supported on /employees/:id and /admin/employees/:id)
router.get(
  ['/employees/:id', '/admin/employees/:id'],
  requireAuth,
  requireRole(USER_ROLE.admin),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const data = await employeesService.getEmployee(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

// Update employee (supported on /employees/:id and /admin/employees/:id)
router.patch(
  ['/employees/:id', '/admin/employees/:id'],
  requireAuth,
  requireRole(USER_ROLE.admin),
  validate({ params: idParamSchema, body: updateEmployeeSchema }),
  async (req, res, next) => {
    try {
      const data = await employeesService.updateEmployee(pathId(req), req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

// Delete employee (supported on /employees/:id and /admin/employees/:id)
router.delete(
  ['/employees/:id', '/admin/employees/:id'],
  requireAuth,
  requireRole(USER_ROLE.admin),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      await employeesService.deleteEmployee(pathId(req));
      res.status(204).send();
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
  requireRole(USER_ROLE.admin),
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
  requireRole(USER_ROLE.admin),
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
  requireRole(USER_ROLE.admin),
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
