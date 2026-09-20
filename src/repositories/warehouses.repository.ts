// ============================================
// REPOSITORY — Bodegas (MongoDB vía Mongoose)
// ============================================
// Único punto del proyecto que importa el modelo `Warehouse`. Traduce los
// errores propios de Mongo a `AppError`:
//   11000 (índice único duplicado) → 409
//   CastError (id con formato inválido) → 400
// A diferencia de PostgreSQL, Mongo no tiene claves foráneas: la regla "no
// borrar una bodega con ítems" no puede resolverla la base — vive en
// `services/warehouses.service.ts`.

import mongoose from 'mongoose';
import { Warehouse, IWarehouse } from '../models/warehouse.model';
import { AppError } from '../errors/AppError';
import { WarehouseView } from '../types';
import { CreateWarehouseDto, UpdateWarehouseDto } from '../schemas/warehouse.schema';

type WarehouseDoc = IWarehouse & { _id: mongoose.Types.ObjectId; createdAt: Date; updatedAt: Date };

function toView(doc: WarehouseDoc): WarehouseView {
  return {
    id: String(doc._id),
    code: doc.code,
    name: doc.name,
    city: doc.city,
    active: doc.active,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function findAll(): Promise<WarehouseView[]> {
  const docs = await Warehouse.find().sort({ code: 1 }).lean<WarehouseDoc[]>();
  return docs.map(toView);
}

export async function findById(id: string): Promise<WarehouseView | null> {
  let doc: WarehouseDoc | null;
  try {
    doc = await Warehouse.findById(id).lean<WarehouseDoc | null>();
  } catch (err) {
    throw translateMongoError(err, undefined, id);
  }
  return doc ? toView(doc) : null;
}

export async function create(dto: CreateWarehouseDto): Promise<WarehouseView> {
  try {
    const doc = await Warehouse.create(dto);
    return toView(doc.toObject() as unknown as WarehouseDoc);
  } catch (err) {
    throw translateMongoError(err, dto.code);
  }
}

export async function update(id: string, dto: UpdateWarehouseDto): Promise<WarehouseView> {
  let doc: WarehouseDoc | null;
  try {
    doc = await Warehouse.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    }).lean<WarehouseDoc | null>();
  } catch (err) {
    throw translateMongoError(err, dto.code, id);
  }
  if (!doc) {
    throw new AppError(404, `La bodega ${id} no existe`);
  }
  return toView(doc);
}

export async function remove(id: string): Promise<void> {
  let doc: WarehouseDoc | null;
  try {
    doc = await Warehouse.findByIdAndDelete(id).lean<WarehouseDoc | null>();
  } catch (err) {
    throw translateMongoError(err, undefined, id);
  }
  if (!doc) {
    throw new AppError(404, `La bodega ${id} no existe`);
  }
}

function translateMongoError(err: unknown, code?: string, id?: string): unknown {
  if (isDuplicateKeyError(err)) {
    return new AppError(409, `Ya existe una bodega con el código "${code}"`);
  }
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(400, `"${id}" no es un ObjectId válido`);
  }
  return err;
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}
