// ============================================
// SCHEMAS — Validación con Zod del recurso InventoryItem
// ============================================
// Única fuente de verdad: el schema valida en runtime y de él se infieren
// los tipos de TypeScript con z.infer<> (no se escriben DTOs a mano).

import { z } from 'zod';

// Categorías válidas del almacén — las mismas que siembra el repository.
export const INVENTORY_CATEGORIES = [
  'packaging',
  'electronics',
  'spare-parts',
  'safety-equipment',
  'raw-materials',
] as const;

// Ubicación física en el almacén: PASILLO-ESTANTE (una letra, guion, 2 dígitos).
const LOCATION_REGEX = /^[A-Z]-\d{2}$/;

export const createInventoryItemSchema = z.object({
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
});

// Actualización parcial — se reutiliza el schema de creación con .partial()
// en lugar de duplicar las reglas de validación.
export const updateInventoryItemSchema = createInventoryItemSchema.partial();

// Validación del parámetro :id de la URL (llega siempre como string).
export const idParamSchema = z.coerce
  .number({ error: 'El id debe ser numérico' })
  .int('El id debe ser un número entero')
  .positive('El id debe ser un número entero positivo');

// Tipos inferidos desde los schemas — single source of truth.
export type CreateInventoryItemDto = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemDto = z.infer<typeof updateInventoryItemSchema>;
