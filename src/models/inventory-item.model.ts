// ============================================
// MODELO — InventoryItem (ítem de inventario, entidad principal)
// ============================================
// Referencia a `Warehouse` vía `warehouse: ObjectId`. `category` se deja como
// String sin `enum` de Mongoose a propósito — la misma decisión que en la
// semana 05 con Prisma: los valores del dominio llevan guion
// (`spare-parts`, `safety-equipment`) y la lista de categorías válidas vive
// solo en Zod (`schemas/inventory-item.schema.ts`), para poder ampliarla sin
// tocar el modelo.

import { Schema, model, Types } from 'mongoose';

export interface IInventoryItem {
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  location: string;
  active: boolean;
  warehouse: Types.ObjectId;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    sku: {
      type: String,
      required: [true, 'sku es requerido'],
      trim: true,
      uppercase: true,
      unique: true,
      match: [/^[A-Z]{3}-\d{4}$/, 'sku debe seguir el formato AAA-0000 (ej. PKG-0001)'],
    },
    name: {
      type: String,
      required: [true, 'name es requerido'],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    category: {
      type: String,
      required: [true, 'category es requerido'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'price es requerido'],
      min: [0.01, 'price debe ser mayor a 0'],
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'stock no puede ser negativo'],
      default: 0,
    },
    location: {
      type: String,
      required: [true, 'location es requerido'],
      trim: true,
      match: [/^[A-Z]-\d{2}$/, 'location debe seguir el formato PASILLO-ESTANTE (ej. A-01)'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    // Referencia a la bodega (relación 1:N). `populate('warehouse')` la
    // resuelve a objeto completo; sin popular, viaja como ObjectId.
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'warehouse es requerido'],
    },
  },
  { timestamps: true },
);

export const InventoryItem = model<IInventoryItem>('InventoryItem', inventoryItemSchema);
