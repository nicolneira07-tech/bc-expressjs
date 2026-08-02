import type { Request, Response, NextFunction } from 'express';

// Logger personalizado — registra método, ruta, status code y duración.
// Se engancha al evento 'finish' de la respuesta porque el status code
// todavía no existe cuando la petición entra, solo cuando termina.
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
  });

  next();
}
