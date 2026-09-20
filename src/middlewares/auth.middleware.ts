// ============================================
// MIDDLEWARE — authMiddleware (verifica el access token)
// ============================================
// El access token viaja en una cookie HttpOnly (`accessToken`), nunca en el
// body ni en `localStorage` — así un XSS en el frontend no puede leerlo con
// `document.cookie`. Si falta o no verifica, delega en el errorHandler con
// un AppError(401) en vez de responder acá directo.

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../errors/AppError';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.['accessToken'] as string | undefined;

  if (!token) {
    next(new AppError(401, 'No autenticado: falta el token de acceso'));
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new AppError(401, 'Token de acceso inválido o expirado'));
  }
}
