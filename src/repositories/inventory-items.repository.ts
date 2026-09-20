// ============================================
// REPOSITORY — Capa de acceso a datos (MongoDB vía Mongoose)
// ============================================
// La interfaz pública (findAll, findById, create, update, remove) es la
// MISMA de la semana 05: cambiar Prisma/PostgreSQL por Mongoose/MongoDB no
// obligó a tocar el controller ni las rutas.
//
// Aquí se traducen los errores propios de Mongo a AppError:
//   11000 (índice único duplicado, el sku)  → 409
//   CastError (id con formato inválido)     → 400
//   documento no encontrado (null)          → 404

import mongoose from 'mongoose';
import { InventoryItem, IInventoryItem } from '../models/inventory-item.model';
import { IWarehouse } from '../models/warehouse.model';
import { AppError } from '../errors/AppError';
import { InventoryItemView, PaginationParams, WarehouseView } from '../types';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from '../schemas/inventory-item.schema';

type ObjectId = mongoose.Types.ObjectId;

type InventoryItemDoc = Omit<IInventoryItem, 'warehouse'> & {
  _id: ObjectId;
  // Sin `.populate()`, `warehouse` es un ObjectId; con `.populate()`, el
  // documento completo de la bodega.
  warehouse: ObjectId | (IWarehouse & { _id: ObjectId; createdAt: Date; updatedAt: Date });
  createdAt: Date;
  updatedAt: Date;
};

function toWarehouseView(w: IWarehouse & { _id: ObjectId; createdAt: Date; updatedAt: Date }): WarehouseView {
  return {
    id: String(w._id),
    code: w.code,
    name: w.name,
    city: w.city,
    active: w.active,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

function toView(doc: InventoryItemDoc): InventoryItemView {
  const isPopulated = !(doc.warehouse instanceof mongoose.Types.ObjectId);

  return {
    id: String(doc._id),
    sku: doc.sku,
    name: doc.name,
    category: doc.category,
    price: doc.price,
    stock: doc.stock,
    location: doc.location,
    active: doc.active,
    warehouse: isPopulated
      ? toWarehouseView(doc.warehouse as IWarehouse & { _id: ObjectId; createdAt: Date; updatedAt: Date })
      : String(doc.warehouse),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function findAll(
  params: PaginationParams,
): Promise<{ data: InventoryItemView[]; total: number }> {
  const { page, limit } = params;
  const skip = (page - 1) * limit;

  // Las dos consultas son independientes → se lanzan en paralelo.
  const [items, total] = await Promise.all([
    InventoryItem.find()
      .populate('warehouse')
      // `_id` como desempate: igual que en la semana 05, el seed inserta
      // varios ítems en el mismo instante y sin un segundo criterio el orden
      // dentro de la página no sería determinista.
      .sort({ createdAt: -1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean<InventoryItemDoc[]>(),
    InventoryItem.countDocuments(),
  ]);

  return { data: items.map(toView), total };
}

export async function findById(id: string): Promise<InventoryItemView | null> {
  let doc: InventoryItemDoc | null;
  try {
    doc = await InventoryItem.findById(id).populate('warehouse').lean<InventoryItemDoc | null>();
  } catch (err) {
    throw translateMongoError(err, undefined, id);
  }
  return doc ? toView(doc) : null;
}

export async function create(dto: CreateInventoryItemDto): Promise<InventoryItemView> {
  try {
    const doc = await InventoryItem.create(dto);
    await doc.populate('warehouse');
    return toView(doc.toObject() as unknown as InventoryItemDoc);
  } catch (err) {
    throw translateMongoError(err, dto.sku);
  }
}

export async function update(
  id: string,
  dto: UpdateInventoryItemDto,
): Promise<InventoryItemView> {
  let doc: InventoryItemDoc | null;
  try {
    doc = await InventoryItem.findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .populate('warehouse')
      .lean<InventoryItemDoc | null>();
  } catch (err) {
    throw translateMongoError(err, dto.sku, id);
  }
  if (!doc) {
    throw new AppError(404, `El ítem de inventario ${id} no existe`);
  }
  return toView(doc);
}

export async function remove(id: string): Promise<void> {
  let doc: InventoryItemDoc | null;
  try {
    doc = await InventoryItem.findByIdAndDelete(id).lean<InventoryItemDoc | null>();
  } catch (err) {
    throw translateMongoError(err, undefined, id);
  }
  if (!doc) {
    throw new AppError(404, `El ítem de inventario ${id} no existe`);
  }
}

// Usado por warehouses.service para impedir borrar una bodega con ítems.
export async function countByWarehouse(warehouseId: string): Promise<number> {
  return InventoryItem.countDocuments({ warehouse: warehouseId });
}

function translateMongoError(err: unknown, sku?: string, id?: string): unknown {
  if (isDuplicateKeyError(err)) {
    return new AppError(
      409,
      sku ? `Ya existe un ítem de inventario con el sku "${sku}"` : 'Ya existe un registro con ese valor único',
    );
  }
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(400, `"${id}" no es un ObjectId válido`);
  }
  return err;
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}
