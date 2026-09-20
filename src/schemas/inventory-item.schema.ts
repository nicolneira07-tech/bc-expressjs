// ============================================
// SCHEMAS — Validación con Zod del recurso InventoryItem
// ============================================
// Cambia una sola cosa respecto a la semana 05: `warehouseId` (entero,
// autoincremental de PostgreSQL) pasa a ser `warehouse` (ObjectId de Mongo,
// 24 caracteres hexadecimales). También vive aquí `objectIdSchema`, que
// valida el `:id` de la URL para las dos entidades — el mismo lugar que usa
// el starter del bootcamp para el schema de la entidad principal.

import { z } from 'zod';

export const INVENTORY_CATEGORIES = [
  'packaging',
  'electronics',
  'spare-parts',
  'safety-equipment',
  'raw-materials',
] as const;

const LOCATION_REGEX = /^[A-Z]-\d{2}$/;
const SKU_REGEX = /^[A-Z]{3}-\d{4}$/;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// Valida un ObjectId de Mongo (id de la URL o campo de referencia).
export const objectIdSchema = z
  .string({ error: 'El id es obligatorio' })
  .regex(OBJECT_ID_REGEX, 'El id debe ser un ObjectId válido (24 caracteres hexadecimales)');

export const createInventoryItemSchema = z.object({
  sku: z
    .string({ error: 'sku es obligatorio' })
    .trim()
    .regex(SKU_REGEX, 'sku debe seguir el formato AAA-0000 (ej. PKG-0001)'),

  name: z
    .string({ error: 'name es obligatorio y debe ser texto' })
    .trim()
    .min(3, 'name debe tener al menos 3 caracteres')
    .max(100, 'name no puede superar los 100 caracteres'),

  category: z.enum(INVENTORY_CATEGORIES, {
    error: `category debe ser una de: ${INVENTORY_CATEGORIES.join(', ')}`,
  }),

  price: z
    .number({ error: 'price es obligatorio y debe ser numérico' })
    .positive('price debe ser mayor a 0'),

  stock: z
    .number({ error: 'stock debe ser numérico' })
    .int('stock debe ser un número entero')
    .nonnegative('stock no puede ser negativo')
    .default(0),

  location: z
    .string({ error: 'location es obligatorio' })
    .trim()
    .regex(LOCATION_REGEX, 'location debe seguir el formato PASILLO-ESTANTE (ej. A-01)'),

  active: z.boolean().default(true),

  // Referencia a la bodega que almacena el ítem (relación 1:N).
  warehouse: objectIdSchema.describe('ID de la bodega'),
});

// Actualización parcial — reutiliza las reglas del schema de creación.
export const updateInventoryItemSchema = createInventoryItemSchema.partial();

// Query params de paginación, con valores por defecto.
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100, 'limit no puede superar 100').default(10),
});

export type CreateInventoryItemDto = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemDto = z.infer<typeof updateInventoryItemSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
