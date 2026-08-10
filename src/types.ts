// ============================================
// TYPES — Dominio: Logística / Almacén
// ============================================
// Desde la semana 05 las entidades las genera Prisma a partir de
// `prisma/schema.prisma` (`InventoryItem`, `Warehouse`), y los DTOs de entrada
// se infieren de los schemas Zod. Aquí solo quedan los tipos que no vienen de
// ninguno de los dos: los contratos de respuesta de la API y las vistas que
// exponemos al cliente.

import { Warehouse } from '@prisma/client';

// Vista de un ítem tal como sale de la API.
// Se diferencia del modelo de Prisma en `price`: en la base de datos es
// Decimal(12,2) (tipo Prisma.Decimal) y aquí se convierte a `number` para que
// el JSON siga siendo el mismo contrato de las semanas 02-04.
export interface InventoryItemView {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  location: string;
  active: boolean;
  warehouseId: number;
  warehouse?: WarehouseView;
  createdAt: Date;
  updatedAt: Date;
}

export type WarehouseView = Omit<Warehouse, 'items'>;

// Contratos de respuesta (genéricos, no se adaptan al dominio)
export interface SingleResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Respuesta de error de validación (ZodError → 400)
export interface ValidationErrorResponse {
  error: string;
  message: string;
  issues: Array<{ field: string; message: string }>;
}

// Respuesta de error genérica (AppError → statusCode, Error → 500)
export interface ErrorResponse {
  error: string;
  message: string;
  stack?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}
