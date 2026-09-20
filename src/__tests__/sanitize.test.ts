// ============================================
// UNIT TESTS — sanitizeBody middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { sanitizeBody } from '../middlewares/sanitize';

describe('sanitizeBody middleware — Unit Tests', () => {
  it('elimina claves que empiezan con "$" (operadores de Mongo)', () => {
    const req = { body: { email: { $gt: '' }, password: 'x' } } as unknown as Request;
    const next = jest.fn() as unknown as NextFunction;

    sanitizeBody(req, {} as Response, next);

    expect(req.body).toEqual({ email: {}, password: 'x' });
    expect(next).toHaveBeenCalled();
  });

  it('elimina claves con "." (acceso a sub-documento)', () => {
    const req = { body: { 'profile.role': 'admin', name: 'x' } } as unknown as Request;
    const next = jest.fn() as unknown as NextFunction;

    sanitizeBody(req, {} as Response, next);

    expect(req.body).toEqual({ name: 'x' });
  });

  it('sanitiza objetos anidados y arrays', () => {
    const req = {
      body: { items: [{ sku: 'A', $where: 'x' }], nested: { safe: 'ok', $ne: null } },
    } as unknown as Request;
    const next = jest.fn() as unknown as NextFunction;

    sanitizeBody(req, {} as Response, next);

    expect(req.body).toEqual({ items: [{ sku: 'A' }], nested: { safe: 'ok' } });
  });

  it('no toca un body ya limpio', () => {
    const body = { email: 'a@a.com', password: 'x' };
    const req = { body } as unknown as Request;
    const next = jest.fn() as unknown as NextFunction;

    sanitizeBody(req, {} as Response, next);

    expect(req.body).toEqual(body);
  });

  it('no revienta si el body no es un objeto (undefined, ya vaciado por json())', () => {
    const req = { body: undefined } as unknown as Request;
    const next = jest.fn() as unknown as NextFunction;

    expect(() => sanitizeBody(req, {} as Response, next)).not.toThrow();
    expect(next).toHaveBeenCalled();
  });
});
