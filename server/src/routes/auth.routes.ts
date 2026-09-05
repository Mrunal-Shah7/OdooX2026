import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import {
  forgotPasswordSchema,
  loginSchema,
  setPasswordSchema,
} from '../schemas/auth.schema.js';
import * as authService from '../services/auth.service.js';

const router = Router();

router.post('/login', validate({ body: loginSchema }), async (req, res, next) => { // TODO: STUB
  try {
    const data = await authService.login(req.body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', requireAuth, async (req, res, next) => { // TODO: STUB
  try {
    await authService.logout(req.auth!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (_req, res, next) => { // TODO: STUB
  try {
    const data = await authService.refreshSession();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => { // TODO: STUB
  try {
    const data = await authService.getCurrentUser(req.auth!.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', validate({ body: forgotPasswordSchema }), async (req, res, next) => { // TODO: STUB
  try {
    await authService.requestPasswordReset(req.body);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/set-password', validate({ body: setPasswordSchema }), async (req, res, next) => { // TODO: STUB
  try {
    await authService.setPassword(req.body);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
