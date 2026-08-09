// ============================================
// TYPES — Dominio: Logística / Almacén
// ============================================
// Recurso principal: InventoryItem (mismo recurso de las semanas 01, 02 y 03).
// Los DTOs de entrada YA NO viven aquí: desde esta semana se infieren desde los
// schemas de Zod (`src/schemas/inventory-item.schema.ts`) para tener una única
// fuente de verdad entre validación en runtime y tipos en compilación.

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  location: string;
  active: boolean;
  createdAt: Date;
}

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
