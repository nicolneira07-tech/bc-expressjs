import type { Request, Response, NextFunction } from 'express';

// Error handler global — Express lo reconoce por tener 4 parámetros.
// Debe registrarse SIEMPRE al final de la cadena de middlewares.
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err.stack);

  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: 'Internal Server Error',
    message: isDev ? err.message : undefined,
  });
}
