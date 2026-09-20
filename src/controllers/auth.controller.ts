// ============================================
// CONTROLLER — Auth
// ============================================
// Mismo patrón `safeParse` + `next(error)` que el resto del proyecto — el
// errorHandler global ya sabe convertir un ZodError en 400. Este controller
// es el único que toca `res.cookie`/`res.clearCookie`.

import { Request, Response, NextFunction, CookieOptions } from 'express';
import * as service from '../services/auth.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { SingleResponse } from '../types';
import { AppError } from '../errors/AppError';
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE, AuthTokens } from '../services/auth.service';

const isProduction = process.env['NODE_ENV'] === 'production';

function cookieOptions(maxAge: number, path = '/'): CookieOptions {
  return {
    httpOnly: true, // inaccesible desde document.cookie — mitiga robo por XSS
    secure: isProduction, // solo HTTPS en producción
    sameSite: 'lax',
    maxAge,
    path,
  };
}

function setAuthCookies(res: Response, tokens: AuthTokens): void {
  res.cookie('accessToken', tokens.accessToken, cookieOptions(ACCESS_TOKEN_MAX_AGE));
  // Restringida a /api/v1/auth: el navegador no la envía en cada request al
  // recurso de negocio, solo cuando se llama /refresh o /logout.
  res.cookie('refreshToken', tokens.refreshToken, cookieOptions(REFRESH_TOKEN_MAX_AGE, '/api/v1/auth'));
}

function clearAuthCookies(res: Response): void {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsedBody = registerSchema.safeParse(req.body);
    if (!parsedBody.success) {
      next(parsedBody.error);
      return;
    }

    const user = await service.register(parsedBody.data);
    const response: SingleResponse<typeof user> = { data: user };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsedBody = loginSchema.safeParse(req.body);
    if (!parsedBody.success) {
      next(parsedBody.error);
      return;
    }

    const tokens = await service.login(parsedBody.data);
    setAuthCookies(res, tokens);
    res.json({ message: 'Login exitoso' });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await service.getMe(req.user!.sub);
    const response: SingleResponse<typeof user> = { data: user };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const incomingToken = req.cookies?.['refreshToken'] as string | undefined;
    if (!incomingToken) {
      next(new AppError(401, 'No hay refresh token en la petición'));
      return;
    }

    const tokens = await service.refresh(incomingToken);
    setAuthCookies(res, tokens);
    res.json({ message: 'Tokens renovados' });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.logout(req.user!.sub);
    clearAuthCookies(res);
    res.json({ message: 'Sesión cerrada' });
  } catch (err) {
    next(err);
  }
}
