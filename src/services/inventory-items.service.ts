// ============================================
// SERVICE — Lógica de negocio
// ============================================
// Cero imports de Express y cero imports de Mongoose: el service no sabe ni
// que existe HTTP ni qué motor de base de datos hay debajo. Solo habla con
// el repository y lanza AppError cuando una regla de negocio no se cumple.

import { InventoryItemView, PaginatedResponse, PaginationParams } from '../types';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from '../schemas/inventory-item.schema';
import * as repository from '../repositories/inventory-items.repository';
import * as warehousesRepository from '../repositories/warehouses.repository';
import { AppError } from '../errors/AppError';

export async function findAll(params: PaginationParams): Promise<PaginatedResponse<InventoryItemView>> {
  const { page, limit } = params;
  const { data, total } = await repository.findAll(params);

  return { data, total, page, limit };
}

export async function findById(id: string): Promise<InventoryItemView> {
  const item = await repository.findById(id);
  if (!item) {
    throw new AppError(404, `El ítem de inventario ${id} no existe`);
  }
  return item;
}

export async function create(dto: CreateInventoryItemDto): Promise<InventoryItemView> {
  // Regla de negocio: no se puede dar de alta un ítem en una bodega que no
  // existe. MongoDB no lo impide por sí solo (no hay FK) — a diferencia de la
  // semana 05, aquí esta comprobación es la ÚNICA defensa, no una redundante.
  await assertWarehouseExists(dto.warehouse);
  return repository.create(dto);
}

export async function update(id: string, dto: UpdateInventoryItemDto): Promise<InventoryItemView> {
  if (dto.warehouse !== undefined) {
    await assertWarehouseExists(dto.warehouse);
  }
  return repository.update(id, dto);
}

export async function remove(id: string): Promise<void> {
  await repository.remove(id);
}

async function assertWarehouseExists(warehouseId: string): Promise<void> {
  const warehouse = await warehousesRepository.findById(warehouseId);
  if (!warehouse) {
    throw new AppError(404, `La bodega ${warehouseId} no existe`);
  }
}
