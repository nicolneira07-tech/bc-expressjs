// ============================================
// CONTROLLER — Interfaz HTTP
// ============================================
// Validar/extraer → llamar service → responder. Sin lógica de negocio y sin
// decidir status de error: los ZodError y los AppError van a next(err) y el
// errorHandler global arma la respuesta.

import { Request, Response, NextFunction } from 'express';
import * as service from '../services/inventory-items.service';
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  objectIdSchema,
  paginationSchema,
} from '../schemas/inventory-item.schema';
import { SingleResponse } from '../types';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsedQuery = paginationSchema.safeParse(req.query);
    if (!parsedQuery.success) {
      next(parsedQuery.error);
      return;
    }

    const result = await service.findAll(parsedQuery.data);
    res.json(result);
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

    const item = await service.findById(parsedId.data);
    const response: SingleResponse<typeof item> = { data: item };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsedBody = createInventoryItemSchema.safeParse(req.body);
    if (!parsedBody.success) {
      next(parsedBody.error);
      return;
    }

    const item = await service.create(parsedBody.data);
    const response: SingleResponse<typeof item> = { data: item };
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

    const parsedBody = updateInventoryItemSchema.safeParse(req.body);
    if (!parsedBody.success) {
      next(parsedBody.error);
      return;
    }

    const item = await service.update(parsedId.data, parsedBody.data);
    const response: SingleResponse<typeof item> = { data: item };
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
