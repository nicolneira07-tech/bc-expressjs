// ============================================
// ROUTES — Bodegas
// ============================================

import { Router } from 'express';
import * as controller from '../controllers/warehouses.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const warehousesRouter = Router();

// Semana 07: mismo criterio que inventory-items — requiere sesión.
warehousesRouter.use(authMiddleware);

warehousesRouter.get('/', controller.getAll);
warehousesRouter.get('/:id', controller.getById);
warehousesRouter.post('/', controller.create);
warehousesRouter.put('/:id', controller.update);
warehousesRouter.delete('/:id', controller.remove);
