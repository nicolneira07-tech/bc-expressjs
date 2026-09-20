// ============================================
// ROUTES — Auth
// ============================================

import { Router } from 'express';
import * as controller from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const authRouter = Router();

// Públicas
authRouter.post('/register', controller.register);
authRouter.post('/login', controller.login);
authRouter.post('/refresh', controller.refresh);

// Protegidas
authRouter.get('/me', authMiddleware, controller.me);
authRouter.post('/logout', authMiddleware, controller.logout);
