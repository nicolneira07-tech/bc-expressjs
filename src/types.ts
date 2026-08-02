// ============================================
// TIPOS — Dominio: Logística / Almacén
// ============================================
// Recurso principal: InventoryItem (ítem de inventario de almacén)

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  location: string;
  active: boolean;
}

// Resumen que el procesador debe calcular
export interface InventoryItemSummary {
  total: number;
  active: number;
  inactive: number;
  averagePrice: number;
  mostExpensive: InventoryItem;
  cheapest: InventoryItem;
  categories: string[];
}

// Reporte final que se escribirá en output/report.json
export interface Report {
  generatedAt: string;
  appliedFilter: string | null;
  summary: InventoryItemSummary;
  items: InventoryItem[];
}
