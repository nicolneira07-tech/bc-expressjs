// ============================================
// PROCESSOR — Filtra y calcula estadísticas
// ============================================

import type { InventoryItem, InventoryItemSummary } from './types.js';

export function filterByCategory(
  items: InventoryItem[],
  categoryFilter: string | null,
): InventoryItem[] {
  if (categoryFilter === null) {
    return items;
  }

  const filtered = items.filter(
    (item) => item.category.toLowerCase() === categoryFilter.toLowerCase(),
  );

  if (filtered.length === 0) {
    const available = Array.from(new Set(items.map((item) => item.category))).join(', ');
    throw new Error(
      `No hay ítems en la categoría "${categoryFilter}". Categorías disponibles: ${available}`,
    );
  }

  return filtered;
}

export function calculateSummary(items: InventoryItem[]): InventoryItemSummary {
  const total = items.length;
  const active = items.filter((item) => item.active).length;
  const inactive = total - active;

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const averagePrice = total > 0 ? Math.round((totalPrice / total) * 100) / 100 : 0;

  const mostExpensive = items.reduce((max, item) => (item.price > max.price ? item : max));
  const cheapest = items.reduce((min, item) => (item.price < min.price ? item : min));

  const categories = Array.from(new Set(items.map((item) => item.category)));

  return {
    total,
    active,
    inactive,
    averagePrice,
    mostExpensive,
    cheapest,
    categories,
  };
}
