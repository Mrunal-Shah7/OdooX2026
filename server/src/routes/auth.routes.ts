import { Router } from 'express';
import { clearAuthCookies, setAuthCookies } from '../lib/cookies.js';
import { REFRESH_COOKIE } from '../lib/tokens.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  setPasswordSchema,
} from '../schemas/auth.schema.js';
import * as authService from '../services/auth.service.js';

const router: Router = Router();

router.post('/login', validate({ body: loginSchema }), async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const rawRt = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await authService.logout(req.auth!.id, rawRt);
    clearAuthCookies(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const rawRt = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const { user, accessToken, refreshToken } = await authService.refreshSession(rawRt);
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ data: user });
  } catch (err) {
    clearAuthCookies(res);
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const data = await authService.getCurrentUser(req.auth!.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', validate({ body: forgotPasswordSchema }), async (req, res, next) => {
  try {
    await authService.requestPasswordReset(req.body);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/set-password', validate({ body: setPasswordSchema }), async (req, res, next) => {
  try {
    await authService.setPassword(req.body);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/change-password', requireAuth, validate({ body: changePasswordSchema }), async (req, res, next) => {
  try {
    await authService.changePassword(req.auth!.id, req.body);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
