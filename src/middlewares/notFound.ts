// ============================================
// MIDDLEWARE — notFound (404 para rutas no registradas)
// ============================================
// Middleware normal de 3 parámetros. Se registra DESPUÉS de todas las rutas:
// si la petición llega hasta aquí es porque ninguna ruta coincidió.
// No responde directamente — delega en el errorHandler para que el formato
// de error sea siempre el mismo.

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, `Ruta ${req.method} ${req.path} no encontrada`));
}
