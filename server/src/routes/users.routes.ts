import { Router } from 'express';
import { USER_ROLE } from '../../../shared/constants.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { pathId, queryOf } from '../lib/request.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/employees.schema.js';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from '../schemas/users.schema.js';
import * as usersService from '../services/users.service.js';

const router: Router = Router();

router.get(
  '/',
  requireAuth,
  requireRole(USER_ROLE.admin),
  validate({ query: listUsersQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const result = await usersService.listUsers(queryOf(listUsersQuerySchema, req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/',
  requireAuth,
  requireRole(USER_ROLE.admin),
  validate({ body: createUserSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await usersService.createUser(req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/:id',
  requireAuth,
  requireRole(USER_ROLE.admin),
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await usersService.getUser(pathId(req));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/:id',
  requireAuth,
  requireRole(USER_ROLE.admin),
  validate({ params: idParamSchema, body: updateUserSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const data = await usersService.updateUser(pathId(req), req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/:id/resend-invite',
  requireAuth,
  requireRole(USER_ROLE.admin),
  validate({ params: idParamSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      await usersService.resendInvite(pathId(req));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
