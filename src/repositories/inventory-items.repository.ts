// ============================================
// REPOSITORY — Capa de acceso a datos
// ============================================
// Único punto de acceso al store en memoria. Todos los métodos son
// async Promise<T> y retornan copias defensivas (nunca la referencia interna).

import { InventoryItem, CreateInventoryItemDto, UpdateInventoryItemDto } from '../types';

const seededAt = new Date().toISOString();

const store: InventoryItem[] = [
  { id: 1, name: 'Pallet de cartón corrugado', category: 'packaging', price: 8.5, stock: 500, location: 'A-01', active: true, createdAt: seededAt },
  { id: 2, name: 'Escáner de código de barras', category: 'electronics', price: 189.99, stock: 15, location: 'B-05', active: true, createdAt: seededAt },
  { id: 3, name: 'Rodamiento industrial 6205', category: 'spare-parts', price: 12.75, stock: 200, location: 'C-10', active: true, createdAt: seededAt },
  { id: 4, name: 'Casco de seguridad', category: 'safety-equipment', price: 15.5, stock: 80, location: 'D-01', active: true, createdAt: seededAt },
  { id: 5, name: 'Bobina de acero laminado', category: 'raw-materials', price: 890.0, stock: 6, location: 'E-01', active: true, createdAt: seededAt },
];
let nextId = 6;

export async function findAll(): Promise<InventoryItem[]> {
  return [...store];
}

export async function findById(id: number): Promise<InventoryItem | undefined> {
  return store.find((item) => item.id === id);
}

export async function create(dto: CreateInventoryItemDto): Promise<InventoryItem> {
  const item: InventoryItem = { id: nextId++, ...dto, createdAt: new Date().toISOString() };
  store.push(item);
  return { ...item };
}

export async function update(id: number, dto: UpdateInventoryItemDto): Promise<InventoryItem | undefined> {
  const index = store.findIndex((item) => item.id === id);
  if (index === -1) {
    return undefined;
  }
  store[index] = { ...store[index]!, ...dto };
  return { ...store[index]! };
}

export async function remove(id: number): Promise<boolean> {
  const index = store.findIndex((item) => item.id === id);
  if (index === -1) {
    return false;
  }
  store.splice(index, 1);
  return true;
}
