import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import type { UserRole } from '../../../shared/constants.js';

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
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}
