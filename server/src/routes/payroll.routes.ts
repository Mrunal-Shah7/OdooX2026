import { Router } from 'express';
import { USER_ROLE } from '../../../shared/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { scopeToEmployee } from '../middleware/scopeToEmployee.js';
import { pathId, queryOf } from '../lib/request.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/employees.schema.js';
import {
  createPayrunSchema,
  createSalaryRuleSchema,
  createSalaryStructureSchema,
  listEligibleEmployeesQuerySchema,
  listPayrunsQuerySchema,
  listPayslipsQuerySchema,
  listSalaryRulesQuerySchema,
  listSalaryStructuresQuerySchema,
  updateSalaryRuleSchema,
  updateSalaryStructureSchema,
} from '../schemas/payroll.schema.js';
import * as payrunsService from '../services/payroll/payruns.service.js';
import * as payslipsService from '../services/payroll/payslips.service.js';
import * as rulesService from '../services/payroll/rules.service.js';
import * as structuresService from '../services/payroll/structures.service.js';

const router: Router = Router();

router.get(
  '/structures',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_user),
  validate({ query: listSalaryStructuresQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const result = await structuresService.listSalaryStructures(queryOf(listSalaryStructuresQuerySchema, req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/structures',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_manager),
  validate({ body: createSalaryStructureSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await structuresService.createSalaryStructure(req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/structures/:id',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_user),
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await structuresService.getSalaryStructure(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/structures/:id',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_manager),
  validate({ params: idParamSchema, body: updateSalaryStructureSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await structuresService.updateSalaryStructure(pathId(req), req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/rules',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_user),
  validate({ query: listSalaryRulesQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const result = await rulesService.listSalaryRules(queryOf(listSalaryRulesQuerySchema, req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/rules',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_manager),
  validate({ body: createSalaryRuleSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await rulesService.createSalaryRule(req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/rules/:id',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_user),
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await rulesService.getSalaryRule(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/rules/:id',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_manager),
  validate({ params: idParamSchema, body: updateSalaryRuleSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await rulesService.updateSalaryRule(pathId(req), req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/rules/:id',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_manager),
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      await rulesService.deleteSalaryRule(pathId(req));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/payruns/eligible-employees',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_user),
  validate({ query: listEligibleEmployeesQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const result = await payrunsService.listEligibleEmployees(queryOf(listEligibleEmployeesQuerySchema, req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/payruns',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_user),
  validate({ query: listPayrunsQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const result = await payrunsService.listPayruns(queryOf(listPayrunsQuerySchema, req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/payruns',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_user),
  validate({ body: createPayrunSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await payrunsService.createPayrun(req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/payruns/:id',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_user),
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await payrunsService.getPayrun(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/payruns/:id/compute',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_user),
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await payrunsService.computePayrun(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/payruns/:id/validate',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_manager),
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await payrunsService.validatePayrun(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/payruns/:id/mark-paid',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_manager),
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await payrunsService.markPayrunPaid(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/payruns/:id/send-payslips',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_manager),
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await payrunsService.sendPayslips(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/payslips',
  requireAuth,
  scopeToEmployee,
  validate({ query: listPayslipsQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const result = await payslipsService.listPayslips(queryOf(listPayslipsQuerySchema, req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/payslips/:id',
  requireAuth,
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await payslipsService.getPayslip(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/payslips/:id/archive',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_user),
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await payslipsService.archivePayslip(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/payslips/:id/pdf',
  requireAuth,
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const pdf = await payslipsService.getPayslipPdf(pathId(req));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="payslip.pdf"');
      res.send(pdf);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/payslips/:id/send-email',
  requireAuth,
  requireRole(USER_ROLE.hr_payroll_user),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const data = await payslipsService.sendSinglePayslipEmail(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
