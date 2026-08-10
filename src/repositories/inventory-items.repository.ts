// ============================================
// REPOSITORY — Capa de acceso a datos (PostgreSQL vía Prisma)
// ============================================
// Único punto del proyecto que habla con la base de datos. La interfaz pública
// (findAll, findById, create, update, remove) es la MISMA de la semana 04:
// cambiar el array en memoria por PostgreSQL no obligó a tocar el controller
// ni las rutas. Eso es lo que compra la arquitectura en capas.
//
// Aquí también se traducen los códigos de error de Prisma a AppError:
//   P2002 → 409 (violación de restricción @unique)
//   P2003 → 400 (clave foránea inválida: la bodega no existe)
//   P2025 → 404 (el registro a actualizar/eliminar no existe)

import { Prisma, InventoryItem } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../errors/AppError';
import { InventoryItemView, PaginationParams } from '../types';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
} from '../schemas/inventory-item.schema';

// El ítem tal como lo trae Prisma cuando se pide con su bodega.
type InventoryItemWithWarehouse = Prisma.InventoryItemGetPayload<{
  include: { warehouse: true };
}>;

// price es Decimal(12,2) en PostgreSQL → Prisma.Decimal en JavaScript.
// Sin esta conversión el JSON saldría como string ("8.5") y rompería el
// contrato que vienen consumiendo las semanas anteriores.
function toView(item: InventoryItemWithWarehouse | InventoryItem): InventoryItemView {
  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    category: item.category,
    price: Number(item.price),
    stock: item.stock,
    location: item.location,
    active: item.active,
    warehouseId: item.warehouseId,
    ...('warehouse' in item ? { warehouse: item.warehouse } : {}),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function findAll(
  params: PaginationParams
): Promise<{ data: InventoryItemView[]; total: number }> {
  const { page, limit } = params;

  // Promise.all: las dos consultas son independientes, se lanzan en paralelo
  // en vez de esperar una y después la otra.
  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: { warehouse: true },
      // El `id` como segundo criterio hace el orden determinista: el seed crea
      // los 6 ítems en el mismo instante, así que ordenar solo por createdAt
      // dejaría el orden dentro de la página a merced de PostgreSQL.
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    }),
    prisma.inventoryItem.count(),
  ]);

  return { data: items.map(toView), total };
}

export async function findById(id: number): Promise<InventoryItemView | null> {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { warehouse: true },
  });

  return item ? toView(item) : null;
}

export async function create(dto: CreateInventoryItemDto): Promise<InventoryItemView> {
  try {
    const item = await prisma.inventoryItem.create({
      data: dto,
      include: { warehouse: true },
    });
    return toView(item);
  } catch (err) {
    throw translatePrismaError(err, dto.sku);
  }
}

export async function update(
  id: number,
  dto: UpdateInventoryItemDto
): Promise<InventoryItemView> {
  try {
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: dto,
      include: { warehouse: true },
    });
    return toView(item);
  } catch (err) {
    throw translatePrismaError(err, dto.sku, id);
  }
}

export async function remove(id: number): Promise<void> {
  try {
    await prisma.inventoryItem.delete({ where: { id } });
  } catch (err) {
    throw translatePrismaError(err, undefined, id);
  }
}

function translatePrismaError(err: unknown, sku?: string, id?: number): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return new AppError(
          409,
          sku
            ? `Ya existe un ítem de inventario con el sku "${sku}"`
            : 'Ya existe un registro con ese valor único'
        );
      case 'P2003':
        return new AppError(400, 'La bodega indicada en warehouseId no existe');
      case 'P2025':
        return new AppError(404, `El ítem de inventario ${id} no existe`);
    }
  }
  // Cualquier otro error sube tal cual → 500 en el errorHandler.
  return err;
}
