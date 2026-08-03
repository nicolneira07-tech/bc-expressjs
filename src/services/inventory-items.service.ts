// ============================================
// SERVICE — Lógica de negocio
// ============================================
// Sin imports de Express. Contiene la paginación y validaciones de dominio.
// Retorna undefined cuando no encuentra; el controller decide el 404.

import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  InventoryItem,
  PaginatedResponse,
  PaginationParams,
} from '../types';
import * as repo from '../repositories/inventory-items.repository';

export async function findAll(params: PaginationParams): Promise<PaginatedResponse<InventoryItem>> {
  const { page, limit } = params;
  const all = await repo.findAll();
  const start = (page - 1) * limit;
  const data = all.slice(start, start + limit);
  return { data, total: all.length, page, limit };
}

export async function findById(id: number): Promise<InventoryItem | undefined> {
  return repo.findById(id);
}

export async function create(dto: CreateInventoryItemDto): Promise<InventoryItem> {
  return repo.create(dto);
}

export async function update(id: number, dto: UpdateInventoryItemDto): Promise<InventoryItem | undefined> {
  const exists = await repo.findById(id);
  if (!exists) {
    return undefined;
  }
  return repo.update(id, dto);
}

export async function remove(id: number): Promise<boolean> {
  const exists = await repo.findById(id);
  if (!exists) {
    return false;
  }
  return repo.remove(id);
}
