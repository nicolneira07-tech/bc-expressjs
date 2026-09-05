// ============================================
// MODELO — Warehouse (bodega, entidad secundaria)
// ============================================
// Sin referencias a otras colecciones. El validador `match` y el `unique` de
// `code` son la versión Mongoose de lo que en la semana 05 eran `@unique` +
// una regex de Zod — aquí quedan en el schema Y en Zod (defensa en dos capas,
// ver `schemas/warehouse.schema.ts`).

import { Schema, model } from 'mongoose';

export interface IWarehouse {
  code: string;
  name: string;
  city: string;
  active: boolean;
}

const warehouseSchema = new Schema<IWarehouse>(
  {
    code: {
      type: String,
      required: [true, 'code es requerido'],
      trim: true,
      uppercase: true,
      unique: true,
      match: [/^[A-Z]{3}-\d{2}$/, 'code debe seguir el formato AAA-00 (ej. BOG-01)'],
    },
    name: {
      type: String,
      required: [true, 'name es requerido'],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    city: {
      type: String,
      required: [true, 'city es requerido'],
      trim: true,
      minlength: 3,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// 'Warehouse' (singular, PascalCase) → colección 'warehouses'.
export const Warehouse = model<IWarehouse>('Warehouse', warehouseSchema);
