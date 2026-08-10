// ============================================
// SERVICE — Lógica de negocio
// ============================================
// Cero imports de Express y cero imports de Prisma: el service no sabe ni que
// existe HTTP ni qué motor de base de datos hay debajo. Solo habla con el
// repository y lanza AppError cuando una regla de negocio no se cumple.

import { InventoryItemView, PaginatedResponse, PaginationParams } from '../types';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
} from '../schemas/inventory-item.schema';
import * as repository from '../repositories/inventory-items.repository';
import * as warehousesRepository from '../repositories/warehouses.repository';
import { AppError } from '../errors/AppError';

export async function findAll(
  params: PaginationParams
): Promise<PaginatedResponse<InventoryItemView>> {
  const { page, limit } = params;
  const { data, total } = await repository.findAll(params);

  return { data, total, page, limit };
}

export async function findById(id: number): Promise<InventoryItemView> {
  const item = await repository.findById(id);
  if (!item) {
    throw new AppError(404, `El ítem de inventario ${id} no existe`);
  }
  return item;
}

export async function create(dto: CreateInventoryItemDto): Promise<InventoryItemView> {
  // Regla de negocio: no se puede dar de alta un ítem en una bodega que no
  // existe. La FK de PostgreSQL también lo impediría (P2003 → 400), pero
  // comprobarlo aquí permite dar un mensaje mucho más claro.
  await assertWarehouseExists(dto.warehouseId);
  return repository.create(dto);
}

export async function update(
  id: number,
  dto: UpdateInventoryItemDto
): Promise<InventoryItemView> {
  if (dto.warehouseId !== undefined) {
    await assertWarehouseExists(dto.warehouseId);
  }
  // No hace falta comprobar que el ítem existe: Prisma lanza P2025 y el
  // repository lo traduce a AppError(404).
  return repository.update(id, dto);
}

export async function remove(id: number): Promise<void> {
  await repository.remove(id);
}

async function assertWarehouseExists(warehouseId: number): Promise<void> {
  const warehouse = await warehousesRepository.findById(warehouseId);
  if (!warehouse) {
    throw new AppError(404, `La bodega ${warehouseId} no existe`);
  }
}
