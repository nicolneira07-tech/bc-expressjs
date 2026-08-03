// ============================================
// CONTROLLER — Interfaz HTTP
// ============================================
// Exactamente 3 pasos por función: extraer → llamar service → responder.
// Sin lógica de negocio. Maneja el 404 cuando el service retorna undefined.

import { Request, Response, NextFunction } from 'express';
import * as service from '../services/inventory-items.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto, ErrorResponse } from '../types';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = await service.findAll({ page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const item = await service.findById(id);
    if (!item) {
      const response: ErrorResponse = { error: 'Not Found', message: `Item ${req.params.id} not found` };
      res.status(404).json(response);
      return;
    }
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = req.body as CreateInventoryItemDto;
    const item = await service.create(dto);
    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const dto = req.body as UpdateInventoryItemDto;
    const item = await service.update(id, dto);
    if (!item) {
      const response: ErrorResponse = { error: 'Not Found', message: `Item ${req.params.id} not found` };
      res.status(404).json(response);
      return;
    }
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const removed = await service.remove(id);
    if (!removed) {
      const response: ErrorResponse = { error: 'Not Found', message: `Item ${req.params.id} not found` };
      res.status(404).json(response);
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
