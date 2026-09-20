// ============================================
// ROUTES — Auth
// ============================================
// Semana 08: `authLimiter` (5 req / 15 min) solo en login/register — son el
// blanco de fuerza bruta y credential stuffing. `/me`, `/refresh` y
// `/logout` ya están detrás de una sesión válida, así que quedan bajo el
// límite global (100 req / 15 min) nada más.

import { Router } from 'express';
import * as controller from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authLimiter } from '../config/security';

export const authRouter = Router();

// Públicas
authRouter.post('/register', authLimiter, controller.register);
authRouter.post('/login', authLimiter, controller.login);
authRouter.post('/refresh', controller.refresh);

// Protegidas
authRouter.get('/me', authMiddleware, controller.me);
authRouter.post('/logout', authMiddleware, controller.logout);
