// ============================================
// TIPOS — Dominio: Logística / Almacén
// ============================================
// Recurso principal: InventoryItem (ítem de inventario de almacén)
// Mismos campos que la semana 01 — ahora expuestos vía API REST en vez de CLI.

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  location: string;
  active: boolean;
}

// DTO usado para crear un nuevo ítem (sin id, se genera automáticamente)
export type CreateInventoryItemDto = Omit<InventoryItem, 'id'>;

// DTO para actualización completa (PUT) — mismos campos, editables
export type UpdateInventoryItemDto = Partial<CreateInventoryItemDto>;
