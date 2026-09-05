import type { Response } from 'express';
import {
  ACCESS_COOKIE,
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_COOKIE,
  REFRESH_TOKEN_MAX_AGE_MS,
} from './tokens.js';

const cookieBase = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false,
  path: '/',
};

/** Set pp_at (JWT) and pp_rt (opaque) after login or refresh. */
export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, { ...cookieBase, maxAge: ACCESS_TOKEN_MAX_AGE_MS });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieBase, maxAge: REFRESH_TOKEN_MAX_AGE_MS });
}

/** Clear both auth cookies on logout or failed refresh. */
export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
}
