// ============================================
// SERVICE — Bodegas
// ============================================

import { WarehouseView } from '../types';
import { CreateWarehouseDto, UpdateWarehouseDto } from '../schemas/warehouse.schema';
import * as repository from '../repositories/warehouses.repository';
import { AppError } from '../errors/AppError';

export async function findAll(): Promise<WarehouseView[]> {
  return repository.findAll();
}

export async function findById(id: number): Promise<WarehouseView> {
  const warehouse = await repository.findById(id);
  if (!warehouse) {
    throw new AppError(404, `La bodega ${id} no existe`);
  }
  return warehouse;
}

export async function create(dto: CreateWarehouseDto): Promise<WarehouseView> {
  return repository.create(dto);
}

export async function update(id: number, dto: UpdateWarehouseDto): Promise<WarehouseView> {
  return repository.update(id, dto);
}

export async function remove(id: number): Promise<void> {
  await repository.remove(id);
}
