// ============================================
// SCHEMAS — Validación con Zod del recurso InventoryItem
// ============================================
// Única fuente de verdad para la entrada: el schema valida en runtime y de él
// se infieren los tipos con z.infer<>. Prisma aporta los tipos de SALIDA
// (los que devuelve la base de datos); Zod los de ENTRADA.

import { z } from 'zod';

// Categorías válidas del catálogo del almacén.
// En la base de datos `category` es un String: la lista de valores válidos se
// controla aquí, en el borde de la API, para poder ampliarla sin migración.
export const INVENTORY_CATEGORIES = [
  'packaging',
  'electronics',
  'spare-parts',
  'safety-equipment',
  'raw-materials',
] as const;

// Ubicación dentro de la bodega: PASILLO-ESTANTE (una letra, guion, 2 dígitos).
const LOCATION_REGEX = /^[A-Z]-\d{2}$/;

// SKU del catálogo: 3 letras, guion, 4 dígitos (ej. PKG-0001). Es @unique en
// la base de datos, así que un duplicado dispara el P2002 de Prisma.
const SKU_REGEX = /^[A-Z]{3}-\d{4}$/;

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

  // Clave foránea a la bodega que almacena el ítem (relación 1:N).
  warehouseId: z
    .number({ error: 'warehouseId es obligatorio' })
    .int('warehouseId debe ser un número entero')
    .positive('warehouseId debe ser un número entero positivo'),
});

// Actualización parcial — reutiliza las reglas del schema de creación.
export const updateInventoryItemSchema = createInventoryItemSchema.partial();

// Validación del parámetro :id de la URL (llega siempre como string).
export const idParamSchema = z.coerce
  .number({ error: 'El id debe ser numérico' })
  .int('El id debe ser un número entero')
  .positive('El id debe ser un número entero positivo');

// Query params de paginación, con valores por defecto.
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100, 'limit no puede superar 100').default(10),
});

export type CreateInventoryItemDto = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemDto = z.infer<typeof updateInventoryItemSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
