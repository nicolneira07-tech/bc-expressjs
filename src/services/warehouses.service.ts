// ============================================
// SERVICE — Bodegas
// ============================================
// `remove` gana una regla de negocio que en la semana 05 resolvía la base de
// datos sola (la FK de PostgreSQL: P2003 → 409 al borrar una bodega con
// ítems). MongoDB no tiene claves foráneas, así que la comprobación se hace
// aquí, a mano, antes de borrar.

import { WarehouseView } from '../types';
import { CreateWarehouseDto, UpdateWarehouseDto } from '../schemas/warehouse.schema';
import * as repository from '../repositories/warehouses.repository';
import * as inventoryItemsRepository from '../repositories/inventory-items.repository';
import { AppError } from '../errors/AppError';

export async function findAll(): Promise<WarehouseView[]> {
  return repository.findAll();
}

export async function findById(id: string): Promise<WarehouseView> {
  const warehouse = await repository.findById(id);
  if (!warehouse) {
    throw new AppError(404, `La bodega ${id} no existe`);
  }
  return warehouse;
}

export async function create(dto: CreateWarehouseDto): Promise<WarehouseView> {
  return repository.create(dto);
}

export async function update(id: string, dto: UpdateWarehouseDto): Promise<WarehouseView> {
  return repository.update(id, dto);
}

export async function remove(id: string): Promise<void> {
  const itemCount = await inventoryItemsRepository.countByWarehouse(id);
  if (itemCount > 0) {
    throw new AppError(409, 'No se puede eliminar la bodega: todavía tiene ítems de inventario asociados');
  }
  await repository.remove(id);
}
