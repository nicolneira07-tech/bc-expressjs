// ============================================
// ROUTES — Mapeo de URLs a controllers
// ============================================
// Las rutas solo conectan: URL + Método HTTP → función del controller.
// No contienen lógica ni acceden a services directamente.

import { Router } from 'express';
import * as controller from '../controllers/inventory-items.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const inventoryItemsRouter = Router();

// Semana 07: toda la API de inventario requiere sesión — sin cuenta no hay
// acceso, ni siquiera de lectura (dato interno de la empresa, no un catálogo
// público).
inventoryItemsRouter.use(authMiddleware);

inventoryItemsRouter.get('/', controller.getAll);
inventoryItemsRouter.get('/:id', controller.getById);
inventoryItemsRouter.post('/', controller.create);
inventoryItemsRouter.put('/:id', controller.update);
inventoryItemsRouter.delete('/:id', controller.remove);
