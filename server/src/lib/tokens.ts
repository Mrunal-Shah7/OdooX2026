import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import type { UserRole } from '../../../shared/constants.js';

export const ACCESS_COOKIE = 'pp_at';
export const REFRESH_COOKIE = 'pp_rt';

export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function generateOpaqueToken(): string {
  return randomBytes(32).toString('hex');
}

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  employeeId: string | null;
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded !== 'object' || decoded === null || typeof decoded.sub !== 'string') {
    throw new Error('Invalid access token payload');
  }
  if (typeof decoded.role !== 'string') {
    throw new Error('Invalid access token payload');
  }
  const employeeId =
    decoded.employeeId === null || typeof decoded.employeeId === 'string'
      ? decoded.employeeId
      : null;
  return { sub: decoded.sub, role: decoded.role as UserRole, employeeId };
}
