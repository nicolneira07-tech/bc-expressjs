// ============================================
// MIDDLEWARE — errorHandler global (4 parámetros)
// ============================================
// ⚠️ Express identifica los error handlers por la ARIDAD de la función: con 3
// parámetros sería un middleware normal y nunca recibiría el error. Por eso
// `_next` se declara aunque no se use.
//
// Único lugar del proyecto que decide cómo se ve una respuesta de error:
//   ZodError  → 400  (input inválido)
//   AppError  → err.statusCode  (error esperado del dominio)
//   Error     → 500  (bug no controlado)

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { logger } from '../config/logger';
import { ErrorResponse, ValidationErrorResponse } from '../types';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProduction = process.env['NODE_ENV'] === 'production';

  // 1. Error de validación de Zod → 400 con el detalle campo por campo.
  if (err instanceof ZodError) {
    const response: ValidationErrorResponse = {
      error: 'Validation Error',
      message: 'Los datos enviados no son válidos',
      issues: err.issues.map((issue) => ({
        field: issue.path.join('.') || 'id',
        message: issue.message,
      })),
    };
    logger.warn(`Validation Error: ${response.issues.map((i) => i.field).join(', ')}`);
    res.status(400).json(response);
    return;
  }

  // 2. Error operacional del dominio → su propio status code.
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: 'Application Error',
      message: err.message,
    };
    logger.warn(`AppError ${err.statusCode}: ${err.message}`);
    res.status(err.statusCode).json(response);
    return;
  }

  // 3. Cualquier otra cosa → 500. El stack solo se expone fuera de producción.
  const error = err instanceof Error ? err : new Error('Error desconocido');
  logger.error(`Unhandled error: ${error.message}`, { stack: error.stack });

  const response: ErrorResponse = {
    error: 'Internal Server Error',
    message: isProduction ? 'Ocurrió un error inesperado' : error.message,
    ...(isProduction ? {} : { stack: error.stack }),
  };
  res.status(500).json(response);
}
