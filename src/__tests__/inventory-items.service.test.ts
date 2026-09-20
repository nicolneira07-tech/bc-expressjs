// ============================================
// UNIT TESTS — inventory-items.service.ts
// ============================================
// El repository se mockea con jest.mock(): estos tests verifican la LÓGICA
// DE NEGOCIO (¿existe la bodega?, ¿se propaga el AppError correcto?), no
// consultas reales a MongoDB — eso lo cubre inventory-items.routes.test.ts.

jest.mock('../repositories/inventory-items.repository');
jest.mock('../repositories/warehouses.repository');

import * as service from '../services/inventory-items.service';
import * as repository from '../repositories/inventory-items.repository';
import * as warehousesRepository from '../repositories/warehouses.repository';
import { AppError } from '../errors/AppError';
import { InventoryItemView, WarehouseView } from '../types';

const mockFindAll = repository.findAll as jest.MockedFunction<typeof repository.findAll>;
const mockFindById = repository.findById as jest.MockedFunction<typeof repository.findById>;
const mockCreate = repository.create as jest.MockedFunction<typeof repository.create>;
const mockUpdate = repository.update as jest.MockedFunction<typeof repository.update>;
const mockRemove = repository.remove as jest.MockedFunction<typeof repository.remove>;
const mockWarehouseFindById = warehousesRepository.findById as jest.MockedFunction<
  typeof warehousesRepository.findById
>;

const warehouse: WarehouseView = {
  id: 'wh-1',
  code: 'BOG-01',
  name: 'Centro de distribución Bogotá',
  city: 'Bogotá',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const item: InventoryItemView = {
  id: 'item-1',
  sku: 'PKG-0001',
  name: 'Pallet de cartón corrugado',
  category: 'packaging',
  price: 8.5,
  stock: 500,
  location: 'A-01',
  active: true,
  warehouse: warehouse.id,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('InventoryItemsService — Unit Tests', () => {
  describe('findAll()', () => {
    it('devuelve los items paginados con el total del repository', async () => {
      mockFindAll.mockResolvedValue({ data: [item], total: 1 });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({ data: [item], total: 1, page: 1, limit: 10 });
      expect(mockFindAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });

    it('devuelve un array vacío cuando no hay items', async () => {
      mockFindAll.mockResolvedValue({ data: [], total: 0 });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findById()', () => {
    it('devuelve el item cuando existe', async () => {
      mockFindById.mockResolvedValue(item);

      const result = await service.findById('item-1');

      expect(result).toEqual(item);
    });

    it('lanza AppError 404 cuando el item no existe', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(service.findById('no-existe')).rejects.toMatchObject({
        statusCode: 404,
      });
      await expect(service.findById('no-existe')).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('create()', () => {
    const dto = {
      sku: 'PKG-0002',
      name: 'Film stretch industrial',
      category: 'packaging' as const,
      price: 24.9,
      stock: 120,
      location: 'A-04',
      active: true,
      warehouse: warehouse.id,
    };

    it('crea el item cuando la bodega existe', async () => {
      mockWarehouseFindById.mockResolvedValue(warehouse);
      mockCreate.mockResolvedValue({ ...item, ...dto });

      const result = await service.create(dto);

      expect(mockWarehouseFindById).toHaveBeenCalledWith(warehouse.id);
      expect(mockCreate).toHaveBeenCalledWith(dto);
      expect(result.sku).toBe('PKG-0002');
    });

    it('lanza AppError 404 si la bodega no existe — nunca llega a crear el item', async () => {
      mockWarehouseFindById.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toMatchObject({ statusCode: 404 });
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    it('actualiza el item sin volver a validar la bodega si no cambia', async () => {
      mockUpdate.mockResolvedValue({ ...item, stock: 10 });

      const result = await service.update('item-1', { stock: 10 });

      expect(mockWarehouseFindById).not.toHaveBeenCalled();
      expect(result.stock).toBe(10);
    });

    it('valida la bodega nueva cuando el update cambia `warehouse`', async () => {
      mockWarehouseFindById.mockResolvedValue(warehouse);
      mockUpdate.mockResolvedValue(item);

      await service.update('item-1', { warehouse: warehouse.id });

      expect(mockWarehouseFindById).toHaveBeenCalledWith(warehouse.id);
    });

    it('lanza AppError 404 si la bodega nueva no existe', async () => {
      mockWarehouseFindById.mockResolvedValue(null);

      await expect(service.update('item-1', { warehouse: 'no-existe' })).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('elimina el item delegando en el repository', async () => {
      mockRemove.mockResolvedValue(undefined);

      await service.remove('item-1');

      expect(mockRemove).toHaveBeenCalledWith('item-1');
    });

    it('propaga el AppError 404 del repository cuando no existe', async () => {
      mockRemove.mockRejectedValue(new AppError(404, 'El ítem de inventario item-1 no existe'));

      await expect(service.remove('item-1')).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
