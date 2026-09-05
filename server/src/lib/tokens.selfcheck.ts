/**
 * ponytail: assert access JWT lifetime matches cookie maxAge (TRD §8).
 * Run: npx tsx --env-file=../.env src/lib/tokens.selfcheck.ts
 */
import assert from 'node:assert/strict';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_MAX_AGE_MS,
  signAccessToken,
  verifyAccessToken,
} from './tokens.js';

assert.equal(ACCESS_TOKEN_EXPIRES_IN, '15m');
assert.equal(ACCESS_TOKEN_MAX_AGE_MS, 15 * 60 * 1000);

const token = signAccessToken({
  sub: '00000000-0000-4000-8000-000000000099',
  role: 'admin',
  employeeId: null,
});
const payload = verifyAccessToken(token);
assert.equal(payload.sub, '00000000-0000-4000-8000-000000000099');

const parts = token.split('.');
const body = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString()) as {
  iat: number;
  exp: number;
};
const lifetimeSec = body.exp - body.iat;
assert.equal(lifetimeSec, 15 * 60, `expected 900s access lifetime, got ${lifetimeSec}`);

console.log('tokens.selfcheck: ok');
