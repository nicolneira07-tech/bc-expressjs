// ============================================
// UNIT TESTS — requireRole middleware
// ============================================
// Middleware puro: se prueba con un req/res/next simulados, sin levantar
// Express ni tocar la base de datos.

import { Request, Response, NextFunction } from 'express';
import { requireRole } from '../middlewares/requireRole';
import { AppError } from '../errors/AppError';

function mockNext(): jest.MockedFunction<NextFunction> {
  return jest.fn() as unknown as jest.MockedFunction<NextFunction>;
}

describe('requireRole middleware — Unit Tests', () => {
  it('llama a next(AppError 401) si no hay req.user', () => {
    const req = {} as Request;
    const next = mockNext();

    requireRole('admin')(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0]![0] as unknown as AppError).statusCode).toBe(401);
  });

  it('llama a next(AppError 403) si el rol no está en la lista permitida', () => {
    const req = { user: { sub: 'u1', email: 'a@a.com', role: 'operator' } } as Request;
    const next = mockNext();

    requireRole('admin')(req, {} as Response, next);

    expect((next.mock.calls[0]![0] as unknown as AppError).statusCode).toBe(403);
  });

  it('llama a next() sin argumentos si el rol coincide', () => {
    const req = { user: { sub: 'u1', email: 'a@a.com', role: 'admin' } } as Request;
    const next = mockNext();

    requireRole('admin')(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('acepta múltiples roles permitidos', () => {
    const req = { user: { sub: 'u1', email: 'a@a.com', role: 'operator' } } as Request;
    const next = mockNext();

    requireRole('operator', 'admin')(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });
});
