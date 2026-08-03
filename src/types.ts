// ============================================
// TYPES — Dominio: Logística / Almacén
// ============================================
// Recurso principal: InventoryItem (mismo recurso de las semanas 01 y 02)

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  location: string;
  active: boolean;
  createdAt: string;
}

// DTO para crear — sin campos auto-generados
export type CreateInventoryItemDto = Omit<InventoryItem, 'id' | 'createdAt'>;

// DTO para actualizar — todos los campos opcionales
export type UpdateInventoryItemDto = Partial<CreateInventoryItemDto>;

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

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}
