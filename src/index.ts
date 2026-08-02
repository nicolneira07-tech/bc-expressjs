// ============================================
// ENTRY POINT — Orquesta todo el flujo
// ============================================

import { readInventory } from './reader.js';
import { filterByCategory, calculateSummary } from './processor.js';
import { writeReport } from './writer.js';
import type { Report } from './types.js';

function parseCategoryArg(): string | null {
  const args = process.argv.slice(2);
  const categoryIndex = args.indexOf('--category');
  return categoryIndex !== -1 ? args[categoryIndex + 1] : null;
}

async function main(): Promise<void> {
  try {
    const categoryFilter = parseCategoryArg();

    const allItems = await readInventory();
    const filteredItems = filterByCategory(allItems, categoryFilter);
    const summary = calculateSummary(filteredItems);

    const report: Report = {
      generatedAt: new Date().toISOString(),
      appliedFilter: categoryFilter,
      summary,
      items: filteredItems,
    };

    console.log('📦 Resumen de inventario — Almacén');
    console.log('----------------------------------');
    console.log(`Filtro aplicado: ${categoryFilter ?? '(ninguno)'}`);
    console.log(`Total de ítems: ${summary.total}`);
    console.log(`Activos: ${summary.active} | Inactivos: ${summary.inactive}`);
    console.log(`Precio promedio: $${summary.averagePrice}`);
    console.log(`Más caro: ${summary.mostExpensive.name} ($${summary.mostExpensive.price})`);
    console.log(`Más barato: ${summary.cheapest.name} ($${summary.cheapest.price})`);
    console.log(`Categorías: ${summary.categories.join(', ')}`);

    await writeReport(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Error: ${message}`);
    process.exit(1);
  }
}

main();
