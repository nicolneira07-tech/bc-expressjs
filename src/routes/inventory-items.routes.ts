import { Router } from 'express';
import * as store from '../store.js';
import type { CreateInventoryItemDto, UpdateInventoryItemDto } from '../types.js';

export const inventoryItemsRouter = Router();

const REQUIRED_FIELDS = ['name', 'category', 'price', 'stock', 'location', 'active'] as const;

// Validación básica de presencia y tipo de los campos requeridos.
// PUT también la usa porque el endpoint reemplaza el recurso completo.
function validatePayload(body: Record<string, unknown>): string[] {
  const errors: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push(`El campo "${field}" es requerido`);
    }
  }
  if (body.price !== undefined && typeof body.price !== 'number') {
    errors.push('El campo "price" debe ser un número');
  }
  if (body.stock !== undefined && typeof body.stock !== 'number') {
    errors.push('El campo "stock" debe ser un número');
  }
  if (body.active !== undefined && typeof body.active !== 'boolean') {
    errors.push('El campo "active" debe ser un booleano');
  }

  return errors;
}

// GET /inventory-items — Listar todos los ítems
inventoryItemsRouter.get('/', (_req, res) => {
  res.json(store.getAll());
});

// GET /inventory-items/:id — Obtener ítem por ID
inventoryItemsRouter.get('/:id', (req, res) => {
  const item = store.getById(req.params.id);
  if (!item) {
    res.status(404).json({ error: `Ítem "${req.params.id}" no encontrado` });
    return;
  }
  res.json(item);
});

// POST /inventory-items — Crear nuevo ítem
inventoryItemsRouter.post('/', (req, res) => {
  const errors = validatePayload(req.body ?? {});
  if (errors.length > 0) {
    res.status(400).json({ error: 'Datos inválidos', details: errors });
    return;
  }

  const created = store.create(req.body as CreateInventoryItemDto);
  res.status(201).json(created);
});

// PUT /inventory-items/:id — Actualizar ítem completo
inventoryItemsRouter.put('/:id', (req, res) => {
  const errors = validatePayload(req.body ?? {});
  if (errors.length > 0) {
    res.status(400).json({ error: 'Datos inválidos', details: errors });
    return;
  }

  const updated = store.update(req.params.id, req.body as UpdateInventoryItemDto);
  if (!updated) {
    res.status(404).json({ error: `Ítem "${req.params.id}" no encontrado` });
    return;
  }
  res.json(updated);
});

// DELETE /inventory-items/:id — Eliminar ítem
inventoryItemsRouter.delete('/:id', (req, res) => {
  const removed = store.remove(req.params.id);
  if (!removed) {
    res.status(404).json({ error: `Ítem "${req.params.id}" no encontrado` });
    return;
  }
  res.status(204).send();
});
