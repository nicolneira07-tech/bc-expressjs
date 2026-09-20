// ============================================
// SERVICE — Auth (registro, login, refresh, logout)
// ============================================
// Igual que los demás services del proyecto: cero imports de Express, solo
// reglas de negocio y llamadas al repository. Las cookies las arma el
// controller — acá solo se generan los tokens y se decide su vida útil.

import bcrypt from 'bcrypt';
import { createHash, timingSafeEqual } from 'crypto';
import { AppError } from '../errors/AppError';
import * as usersRepository from '../repositories/users.repository';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { RegisterDto, LoginDto } from '../schemas/auth.schema';
import { UserView } from '../types';

const SALT_ROUNDS = 10;
export const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutos
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function register(dto: RegisterDto): Promise<UserView> {
  const existing = await usersRepository.findByEmail(dto.email);
  if (existing) {
    throw new AppError(409, `Ya existe un usuario registrado con el email "${dto.email}"`);
  }

  const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
  return usersRepository.create({ ...dto, password: hashedPassword });
}

export async function login(dto: LoginDto): Promise<AuthTokens> {
  const user = await usersRepository.findAuthByEmail(dto.email);

  // Mismo mensaje para "no existe" y "password incorrecto": revelar cuál de
  // los dos falló permite enumerar emails registrados (user enumeration).
  if (!user) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  const passwordMatches = await bcrypt.compare(dto.password, user.password);
  if (!passwordMatches) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  return issueTokens(String(user._id), user.email, user.role);
}

export async function refresh(incomingToken: string): Promise<AuthTokens> {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(incomingToken);
  } catch {
    throw new AppError(401, 'Refresh token inválido o expirado');
  }

  const user = await usersRepository.findAuthById(payload.sub);
  if (!user?.refreshToken) {
    throw new AppError(401, 'Sesión no válida: no hay un refresh token activo');
  }

  // Compara contra el HASH almacenado — el token en claro nunca se guarda.
  const matchesStored = matchesRefreshHash(incomingToken, user.refreshToken);
  if (!matchesStored) {
    // El refresh token es válido (firma/expiración OK) pero no es el vigente:
    // ya fue rotado antes (posible reuso de un token robado). Se invalida la
    // sesión completa como medida de contención.
    await usersRepository.updateRefreshToken(String(user._id), null);
    throw new AppError(401, 'Refresh token no coincide con la sesión activa');
  }

  // Rotación: cada refresh emite un par nuevo e invalida el anterior.
  return issueTokens(String(user._id), user.email, user.role);
}

export async function logout(userId: string): Promise<void> {
  await usersRepository.updateRefreshToken(userId, null);
}

export async function getMe(userId: string): Promise<UserView> {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw new AppError(404, 'El usuario autenticado ya no existe');
  }
  return user;
}

async function issueTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
  const accessToken = signAccessToken({ sub: userId, email, role });
  const refreshToken = signRefreshToken({ sub: userId });

  await usersRepository.updateRefreshToken(userId, hashRefreshToken(refreshToken));

  return { accessToken, refreshToken };
}

// ── Hash del refresh token ──────────────────────────────────────────────
// bcrypt SOLO usa los primeros 72 bytes del input: dos JWT del mismo usuario
// firmados segundos aparte comparten header + claim `sub` bien más allá de
// esos 72 bytes (solo cambian `iat`/`exp`, que van al final), así que
// `bcrypt.compare(tokenViejo, hash(tokenNuevo))` daba `true` — la rotación
// nunca invalidaba nada. Un JWT es alta entropía (no una contraseña humana
// reutilizable), así que no necesita el costo de bcrypt: se guarda un SHA-256
// de longitud fija y se compara en tiempo constante con `timingSafeEqual`.
function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function matchesRefreshHash(token: string, storedHash: string): boolean {
  const incoming = Buffer.from(hashRefreshToken(token), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return incoming.length === stored.length && timingSafeEqual(incoming, stored);
}
