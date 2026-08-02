// ============================================
// READER — Lee el archivo de datos JSON
// ============================================

import { readFile } from 'fs/promises';
import { join } from 'path';
import type { InventoryItem } from './types.js';

export async function readInventory(): Promise<InventoryItem[]> {
  const filePath = join(import.meta.dirname, '..', 'data', 'inventory.json');

  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw) as InventoryItem[];
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`No se pudo leer el archivo de inventario en "${filePath}": ${reason}`);
  }
}
