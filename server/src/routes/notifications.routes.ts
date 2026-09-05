import { Router } from 'express';
import { z } from 'zod';
import { paginationQuerySchema } from '../lib/pagination.js';
import { queryOf } from '../lib/request.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { markNotificationsReadSchema } from '../schemas/users.schema.js';
import * as notificationsService from '../services/notifications.service.js';

const listNotificationsQuerySchema = paginationQuerySchema.extend({
  unreadOnly: z.coerce.boolean().default(false),
});

const router: Router = Router();

router.get(
  '/',
  requireAuth,
  validate({ query: listNotificationsQuerySchema }),
  async (req, res, next) => {
    try {
      const result = await notificationsService.listNotifications(
        req.auth!.id,
        queryOf(listNotificationsQuerySchema, req),
      );
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
  async (req, res, next) => {
    try {
      await notificationsService.markNotificationsRead(req.auth!.id, req.body);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
