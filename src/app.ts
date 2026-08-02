import express from 'express';
import type { Application, Request, Response } from 'express';
import { inventoryItemsRouter } from './routes/inventory-items.routes.js';
import { requestLogger } from './middlewares/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';

export function createApp(): Application {
  const app = express();

  // 1. Parseo de body — requerido antes de leer req.body en POST/PUT
  app.use(express.json());

  // 2. Logger — registra todas las peticiones
  app.use(requestLogger);

  // 3. Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // 4. Rutas del recurso principal
  app.use('/api/v1/inventory-items', inventoryItemsRouter);

  // 5. Handler para rutas no encontradas
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // 6. Error handler global — siempre el último app.use()
  app.use(errorHandler);

  return app;
}
