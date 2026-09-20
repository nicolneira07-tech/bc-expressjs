// ============================================
// TYPES — Extensión de Express.Request
// ============================================
// `authMiddleware` decodifica el access token y cuelga el payload en
// `req.user`. Declarado global para que todos los controllers lo vean
// tipado sin importar nada extra.

import { JwtPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
