// ============================================
// SCHEMAS — Validación con Zod del recurso Warehouse (bodega)
// ============================================
// Sin cambios respecto a la semana 05: el formato de negocio de `code` no
// depende del motor de base de datos.

import { z } from 'zod';

const WAREHOUSE_CODE_REGEX = /^[A-Z]{3}-\d{2}$/;

export const createWarehouseSchema = z.object({
  code: z
    .string({ error: 'code es obligatorio' })
    .trim()
    .regex(WAREHOUSE_CODE_REGEX, 'code debe seguir el formato AAA-00 (ej. BOG-01)'),

  name: z
    .string({ error: 'name es obligatorio' })
    .trim()
    .min(3, 'name debe tener al menos 3 caracteres')
    .max(100, 'name no puede superar los 100 caracteres'),

  city: z
    .string({ error: 'city es obligatorio' })
    .trim()
    .min(3, 'city debe tener al menos 3 caracteres'),

  active: z.boolean().default(true),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export type CreateWarehouseDto = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseDto = z.infer<typeof updateWarehouseSchema>;
