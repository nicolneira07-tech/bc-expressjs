// ============================================
// ROUTES — Bodegas
// ============================================

import { Router } from 'express';
import * as controller from '../controllers/warehouses.controller';

export const warehousesRouter = Router();

warehousesRouter.get('/', controller.getAll);
warehousesRouter.get('/:id', controller.getById);
warehousesRouter.post('/', controller.create);
warehousesRouter.put('/:id', controller.update);
warehousesRouter.delete('/:id', controller.remove);
