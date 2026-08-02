import type { InventoryItem, CreateInventoryItemDto, UpdateInventoryItemDto } from './types.js';

// Store en memoria — simula una base de datos sin persistencia.
// Sembrado con los mismos 12 ítems del inventario de la semana 01
// (data/inventory.json), para tener datos realistas desde el arranque.
// Se pierden al reiniciar el servidor (se usará BD real a partir de week-05).
const items: InventoryItem[] = [
  { id: 'WH-001', name: 'Pallet de cartón corrugado', category: 'packaging', price: 8.5, stock: 500, location: 'A-01', active: true },
  { id: 'WH-002', name: 'Film stretch industrial', category: 'packaging', price: 24.9, stock: 120, location: 'A-02', active: true },
  { id: 'WH-003', name: 'Escáner de código de barras', category: 'electronics', price: 189.99, stock: 15, location: 'B-05', active: true },
  { id: 'WH-004', name: 'Impresora de etiquetas térmica', category: 'electronics', price: 259.0, stock: 8, location: 'B-06', active: true },
  { id: 'WH-005', name: 'Rodamiento industrial 6205', category: 'spare-parts', price: 12.75, stock: 200, location: 'C-10', active: true },
  { id: 'WH-006', name: 'Correa transportadora 5m', category: 'spare-parts', price: 340.0, stock: 4, location: 'C-11', active: true },
  { id: 'WH-007', name: 'Motor reductor 1HP', category: 'spare-parts', price: 410.0, stock: 0, location: 'C-12', active: false },
  { id: 'WH-008', name: 'Casco de seguridad', category: 'safety-equipment', price: 15.5, stock: 80, location: 'D-01', active: true },
  { id: 'WH-009', name: 'Chaleco reflectivo', category: 'safety-equipment', price: 9.99, stock: 150, location: 'D-02', active: true },
  { id: 'WH-010', name: 'Guantes anticorte', category: 'safety-equipment', price: 6.25, stock: 300, location: 'D-03', active: true },
  { id: 'WH-011', name: 'Bobina de acero laminado', category: 'raw-materials', price: 890.0, stock: 6, location: 'E-01', active: true },
  { id: 'WH-012', name: 'Rollo de plástico reciclado', category: 'raw-materials', price: 145.3, stock: 0, location: 'E-02', active: false },
];

let nextSequence = items.length + 1;

function generateId(): string {
  const id = `WH-${String(nextSequence).padStart(3, '0')}`;
  nextSequence += 1;
  return id;
}

export function getAll(): InventoryItem[] {
  return items;
}

export function getById(id: string): InventoryItem | undefined {
  return items.find((item) => item.id === id);
}

export function create(data: CreateInventoryItemDto): InventoryItem {
  const newItem: InventoryItem = { id: generateId(), ...data };
  items.push(newItem);
  return newItem;
}

export function update(id: string, data: UpdateInventoryItemDto): InventoryItem | undefined {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return undefined;
  }
  items[index] = { ...items[index], ...data };
  return items[index];
}

export function remove(id: string): boolean {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return false;
  }
  items.splice(index, 1);
  return true;
}
