import { Router } from 'express';
import { USER_ROLE } from '../../../shared/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { scopeToEmployee } from '../middleware/scopeToEmployee.js';
import { pathId, queryOf } from '../lib/request.js';
import { validate } from '../middleware/validate.js';
import {
  createContractSchema,
  listContractsQuerySchema,
  updateContractSchema,
} from '../schemas/contracts.schema.js';
import { idParamSchema } from '../schemas/employees.schema.js';
import * as contractsService from '../services/contracts.service.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  scopeToEmployee,
  validate({ query: listContractsQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const result = await contractsService.listContracts(queryOf(listContractsQuerySchema, req));
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
  validate({ body: createContractSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await contractsService.createContract(req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/:id',
  requireAuth,
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await contractsService.getContract(pathId(req));
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
  validate({ params: idParamSchema, body: updateContractSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await contractsService.updateContract(pathId(req), req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
