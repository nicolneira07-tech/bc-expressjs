// ============================================
// TYPES — Dominio: Logística / Almacén
// ============================================
// Con Mongoose las entidades ya no las genera un cliente aparte (como el
// `@prisma/client` de la semana 05): los `interface I*` viven junto a cada
// modelo (`models/*.model.ts`). Aquí solo quedan las "vistas" que expone la
// API (con `id: string` en vez de `_id: ObjectId`) y los contratos de
// respuesta, que no cambian de una semana a otra.

export interface WarehouseView {
  id: string;
  code: string;
  name: string;
  city: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItemView {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  location: string;
  active: boolean;
  // Sin popular viaja el ObjectId como string; poblado, el objeto completo.
  warehouse: string | WarehouseView;
  createdAt: Date;
  updatedAt: Date;
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
