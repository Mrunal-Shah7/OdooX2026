import { Router } from 'express';
import { paginationQuerySchema } from '../lib/pagination.js';
import { queryOf } from '../lib/request.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { markNotificationsReadSchema } from '../schemas/users.schema.js';
import * as notificationsService from '../services/notifications.service.js';
import { z } from 'zod';

const listNotificationsQuerySchema = paginationQuerySchema.extend({
  unreadOnly: z.coerce.boolean().default(false),
});

const router = Router();

router.get(
  '/',
  requireAuth,
  validate({ query: listNotificationsQuerySchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      const result = await notificationsService.listNotifications(queryOf(listNotificationsQuerySchema, req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/read',
  requireAuth,
  validate({ body: markNotificationsReadSchema }),
  async (req, res, next) => { // TODO: STUB
    try {
      await notificationsService.markNotificationsRead(req.body);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
