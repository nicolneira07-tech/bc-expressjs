// ============================================
// UNIT TESTS — warehouses.service.ts
// ============================================

jest.mock('../repositories/warehouses.repository');
jest.mock('../repositories/inventory-items.repository');

import * as service from '../services/warehouses.service';
import * as repository from '../repositories/warehouses.repository';
import * as inventoryItemsRepository from '../repositories/inventory-items.repository';
import { WarehouseView } from '../types';

const mockFindAll = repository.findAll as jest.MockedFunction<typeof repository.findAll>;
const mockFindById = repository.findById as jest.MockedFunction<typeof repository.findById>;
const mockCreate = repository.create as jest.MockedFunction<typeof repository.create>;
const mockUpdate = repository.update as jest.MockedFunction<typeof repository.update>;
const mockRemove = repository.remove as jest.MockedFunction<typeof repository.remove>;
const mockCountByWarehouse = inventoryItemsRepository.countByWarehouse as jest.MockedFunction<
  typeof inventoryItemsRepository.countByWarehouse
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

describe('WarehousesService — Unit Tests', () => {
  describe('findAll()', () => {
    it('devuelve todas las bodegas', async () => {
      mockFindAll.mockResolvedValue([warehouse]);

      const result = await service.findAll();

      expect(result).toEqual([warehouse]);
    });

    it('devuelve un array vacío si no hay bodegas', async () => {
      mockFindAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById()', () => {
    it('devuelve la bodega cuando existe', async () => {
      mockFindById.mockResolvedValue(warehouse);

      const result = await service.findById('wh-1');

      expect(result).toEqual(warehouse);
    });

    it('lanza AppError 404 cuando no existe', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(service.findById('no-existe')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('create()', () => {
    it('crea la bodega delegando en el repository', async () => {
      mockCreate.mockResolvedValue(warehouse);

      const result = await service.create({ code: 'BOG-01', name: warehouse.name, city: 'Bogotá', active: true });

      expect(result).toEqual(warehouse);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('update()', () => {
    it('actualiza la bodega delegando en el repository', async () => {
      mockUpdate.mockResolvedValue({ ...warehouse, city: 'Medellín' });

      const result = await service.update('wh-1', { city: 'Medellín' });

      expect(result.city).toBe('Medellín');
    });
  });

  describe('remove()', () => {
    it('elimina la bodega cuando no tiene ítems asociados', async () => {
      mockCountByWarehouse.mockResolvedValue(0);
      mockRemove.mockResolvedValue(undefined);

      await service.remove('wh-1');

      expect(mockRemove).toHaveBeenCalledWith('wh-1');
    });

    it('lanza AppError 409 si la bodega todavía tiene ítems — regla de negocio sin FK real', async () => {
      mockCountByWarehouse.mockResolvedValue(3);

      await expect(service.remove('wh-1')).rejects.toMatchObject({ statusCode: 409 });
      expect(mockRemove).not.toHaveBeenCalled();
    });
  });
});
