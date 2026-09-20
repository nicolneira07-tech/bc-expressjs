// ============================================
// UTILS — Firma y verificación de JWT
// ============================================
// Dos secretos DISTINTOS (JWT_ACCESS_SECRET ≠ JWT_REFRESH_SECRET): si el de
// acceso se filtra, el atacante no puede forjar refresh tokens y viceversa.
// Access token: 15 minutos (vive en memoria del cliente, se re-emite seguido).
// Refresh token: 7 días (solo viaja a /api/v1/auth/refresh, con rotación).

import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { AppError } from '../errors/AppError';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

function getSecret(name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const secret = process.env[name];
  if (!secret) {
    throw new AppError(500, `${name} no está configurada`);
  }
  return secret;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret('JWT_ACCESS_SECRET'), { expiresIn: '15m' });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret('JWT_ACCESS_SECRET')) as JwtPayload;
}

export function signRefreshToken(payload: Pick<JwtPayload, 'sub'>): string {
  // `jti` (JWT ID) aleatorio: sin él, dos refresh tokens del mismo usuario
  // firmados dentro del mismo segundo (`iat` solo tiene resolución de
  // segundos) son BYTE-IDÉNTICOS — HMAC-SHA256 es determinista, así que
  // mismo payload + mismo secreto = misma firma. Eso rompía la rotación
  // bajo carga (dos refresh casi simultáneos) y hacía imposible testear la
  // rotación sin esperar un segundo real entre llamadas. `jti` garantiza que
  // cada token emitido es único sin importar cuándo se firme.
  return jwt.sign({ ...payload, jti: randomUUID() }, getSecret('JWT_REFRESH_SECRET'), {
    expiresIn: '7d',
  });
}

export function verifyRefreshToken(token: string): Pick<JwtPayload, 'sub'> {
  return jwt.verify(token, getSecret('JWT_REFRESH_SECRET')) as Pick<JwtPayload, 'sub'>;
}
