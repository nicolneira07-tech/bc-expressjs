// ============================================
// ROUTES — Mapeo de URLs a controllers
// ============================================
// Las rutas solo conectan: URL + Método HTTP → función del controller.
// No contienen lógica ni acceden a services directamente.

import { Router } from 'express';
import * as controller from '../controllers/inventory-items.controller';

export const inventoryItemsRouter = Router();

inventoryItemsRouter.get('/', controller.getAll);
inventoryItemsRouter.get('/:id', controller.getById);
inventoryItemsRouter.post('/', controller.create);
inventoryItemsRouter.put('/:id', controller.update);
inventoryItemsRouter.delete('/:id', controller.remove);
