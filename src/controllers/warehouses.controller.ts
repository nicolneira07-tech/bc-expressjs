// ============================================
// CONTROLLER — Bodegas
// ============================================

import { Request, Response, NextFunction } from 'express';
import * as service from '../services/warehouses.service';
import { createWarehouseSchema, updateWarehouseSchema } from '../schemas/warehouse.schema';
import { objectIdSchema } from '../schemas/inventory-item.schema';
import { SingleResponse } from '../types';

export async function getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const warehouses = await service.findAll();
    res.json({ data: warehouses, total: warehouses.length });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsedId = objectIdSchema.safeParse(req.params['id']);
    if (!parsedId.success) {
      next(parsedId.error);
      return;
    }

    const warehouse = await service.findById(parsedId.data);
    const response: SingleResponse<typeof warehouse> = { data: warehouse };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsedBody = createWarehouseSchema.safeParse(req.body);
    if (!parsedBody.success) {
      next(parsedBody.error);
      return;
    }

    const warehouse = await service.create(parsedBody.data);
    const response: SingleResponse<typeof warehouse> = { data: warehouse };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsedId = objectIdSchema.safeParse(req.params['id']);
    if (!parsedId.success) {
      next(parsedId.error);
      return;
    }

    const parsedBody = updateWarehouseSchema.safeParse(req.body);
    if (!parsedBody.success) {
      next(parsedBody.error);
      return;
    }

    const warehouse = await service.update(parsedId.data, parsedBody.data);
    const response: SingleResponse<typeof warehouse> = { data: warehouse };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsedId = objectIdSchema.safeParse(req.params['id']);
    if (!parsedId.success) {
      next(parsedId.error);
      return;
    }

    await service.remove(parsedId.data);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
