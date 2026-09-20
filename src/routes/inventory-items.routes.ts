// ============================================
// ROUTES — Mapeo de URLs a controllers
// ============================================
// Las rutas solo conectan: URL + Método HTTP → función del controller.
// No contienen lógica ni acceden a services directamente.
//
// Semana 08 — RBAC: dar de alta, consultar y ajustar stock es trabajo diario
// de cualquier operador. Eliminar un ítem del catálogo (no solo bajar su
// stock) es una decisión de mayor peso — reservada a `admin`.

import { Router } from 'express';
import * as controller from '../controllers/inventory-items.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole';

export const inventoryItemsRouter = Router();

// Requiere sesión en TODAS las rutas — sin cuenta no hay acceso, ni siquiera
// de lectura (dato interno de la empresa, no un catálogo público).
inventoryItemsRouter.use(authMiddleware);

inventoryItemsRouter.get('/', controller.getAll);
inventoryItemsRouter.get('/:id', controller.getById);
inventoryItemsRouter.post('/', controller.create);
inventoryItemsRouter.put('/:id', controller.update);
inventoryItemsRouter.delete('/:id', requireRole('admin'), controller.remove);
