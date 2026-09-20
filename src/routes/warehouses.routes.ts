// ============================================
// ROUTES — Bodegas
// ============================================
// Semana 08 — RBAC: las bodegas son la estructura física de la empresa
// (centros de distribución). Cualquier operador autenticado puede
// consultarlas; solo `admin` puede abrir, modificar o cerrar una.

import { Router } from 'express';
import * as controller from '../controllers/warehouses.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole';

export const warehousesRouter = Router();

// Requiere sesión en TODAS las rutas.
warehousesRouter.use(authMiddleware);

warehousesRouter.get('/', controller.getAll);
warehousesRouter.get('/:id', controller.getById);

warehousesRouter.post('/', requireRole('admin'), controller.create);
warehousesRouter.put('/:id', requireRole('admin'), controller.update);
warehousesRouter.delete('/:id', requireRole('admin'), controller.remove);
