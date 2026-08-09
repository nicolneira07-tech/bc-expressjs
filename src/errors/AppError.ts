// ============================================
// ERRORS — AppError (errores operacionales del dominio)
// ============================================
// Un error "operacional" es uno esperado y controlado (404 ítem no existe,
// 409 duplicado). Se distingue de un bug del programador (TypeError, etc.)
// para poder responder con el status correcto en vez de un 500 genérico.

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = 'AppError';

    // Necesario al extender clases nativas compilando a ES2022/CommonJS:
    // sin esto, `err instanceof AppError` puede devolver false.
    Object.setPrototypeOf(this, new.target.prototype);

    // Excluye el constructor del stack trace: apunta al lugar real del throw.
    Error.captureStackTrace(this, this.constructor);
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
