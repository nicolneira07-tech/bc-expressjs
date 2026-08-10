// ============================================
// REPOSITORY — Bodegas (PostgreSQL vía Prisma)
// ============================================

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../errors/AppError';
import { WarehouseView } from '../types';
import { CreateWarehouseDto, UpdateWarehouseDto } from '../schemas/warehouse.schema';

export async function findAll(): Promise<WarehouseView[]> {
  return prisma.warehouse.findMany({ orderBy: { code: 'asc' } });
}

export async function findById(id: number): Promise<WarehouseView | null> {
  return prisma.warehouse.findUnique({ where: { id } });
}

export async function create(dto: CreateWarehouseDto): Promise<WarehouseView> {
  try {
    return await prisma.warehouse.create({ data: dto });
  } catch (err) {
    throw translatePrismaError(err, dto.code);
  }
}

export async function update(id: number, dto: UpdateWarehouseDto): Promise<WarehouseView> {
  try {
    return await prisma.warehouse.update({ where: { id }, data: dto });
  } catch (err) {
    throw translatePrismaError(err, dto.code, id);
  }
}

export async function remove(id: number): Promise<void> {
  try {
    await prisma.warehouse.delete({ where: { id } });
  } catch (err) {
    throw translatePrismaError(err, undefined, id);
  }
}

function translatePrismaError(err: unknown, code?: string, id?: number): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return new AppError(409, `Ya existe una bodega con el código "${code}"`);
      case 'P2003':
        // Se intentó borrar una bodega que todavía tiene ítems asociados.
        return new AppError(
          409,
          'No se puede eliminar la bodega: todavía tiene ítems de inventario asociados'
        );
      case 'P2025':
        return new AppError(404, `La bodega ${id} no existe`);
    }
  }
  return err;
}
