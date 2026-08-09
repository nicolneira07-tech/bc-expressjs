// ============================================
// SERVICE — Lógica de negocio
// ============================================
// Cero imports de Express: el service no sabe que existe HTTP. Cuando algo
// sale mal lanza un AppError con su status code y el errorHandler global lo
// traduce a una respuesta HTTP (cambio respecto a la semana 03, donde el
// service retornaba undefined y el controller decidía el 404).

import { InventoryItem, PaginatedResponse, PaginationParams } from '../types';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from '../schemas/inventory-item.schema';
import * as repository from '../repositories/inventory-items.repository';
import { AppError } from '../errors/AppError';

export async function findAll(params: PaginationParams): Promise<PaginatedResponse<InventoryItem>> {
  const { page, limit } = params;
  const all = await repository.findAll();
  const start = (page - 1) * limit;
  const data = all.slice(start, start + limit);

  return { data, total: all.length, page, limit };
}

export async function findById(id: number): Promise<InventoryItem> {
  const item = await repository.findById(id);
  if (!item) {
    throw new AppError(404, `El ítem de inventario ${id} no existe`);
  }
  return item;
}

export async function create(dto: CreateInventoryItemDto): Promise<InventoryItem> {
  // Regla de negocio del almacén: no puede haber dos ítems con el mismo nombre
  // en el catálogo (evita duplicar la misma referencia en varias ubicaciones).
  const duplicated = await repository.findByName(dto.name);
  if (duplicated) {
    throw new AppError(409, `Ya existe un ítem de inventario llamado "${dto.name}"`);
  }
  return repository.create(dto);
}

export async function update(id: number, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
  const exists = await repository.findById(id);
  if (!exists) {
    throw new AppError(404, `El ítem de inventario ${id} no existe`);
  }

  if (dto.name !== undefined) {
    const duplicated = await repository.findByName(dto.name);
    if (duplicated && duplicated.id !== id) {
      throw new AppError(409, `Ya existe un ítem de inventario llamado "${dto.name}"`);
    }
  }

  const updated = await repository.update(id, dto);
  return updated!;
}

export async function remove(id: number): Promise<void> {
  const deleted = await repository.remove(id);
  if (!deleted) {
    throw new AppError(404, `El ítem de inventario ${id} no existe`);
  }
}
