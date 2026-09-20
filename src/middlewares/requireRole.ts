// ============================================
// MIDDLEWARE — requireRole (autorización por rol, RBAC)
// ============================================
// Diferencia entre autenticación y autorización: `authMiddleware` responde
// "¿quién eres?" (401 si no hay sesión válida); `requireRole` responde
// "¿puedes hacer esto?" (403 si sí eres alguien, pero no el rol correcto).
// Por eso SIEMPRE va después de `authMiddleware` en la cadena de la ruta —
// necesita `req.user` ya poblado.

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from '../errors/AppError';

export function requireRole(...roles: Array<'operator' | 'admin'>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'No autenticado'));
      return;
    }

    if (!roles.includes(req.user.role as 'operator' | 'admin')) {
      next(new AppError(403, `Acceso denegado: se requiere el rol ${roles.join(' o ')}`));
      return;
    }

    next();
  };
}
