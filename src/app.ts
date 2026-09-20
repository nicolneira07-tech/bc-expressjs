// ============================================
// APP — Configuración Express
// ============================================
// El ORDEN de registro importa:
//   1. middlewares generales (json + logging HTTP con Morgan → Winston)
//   2. rutas
//   3. notFound (ninguna ruta coincidió)
//   4. errorHandler (siempre el último, 4 parámetros)

import express from 'express';
import cookieParser from 'cookie-parser';
import { morganMiddleware } from './config/logger';
import { authRouter } from './routes/auth.routes';
import { inventoryItemsRouter } from './routes/inventory-items.routes';
import { warehousesRouter } from './routes/warehouses.routes';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// 1. Middlewares generales
app.use(express.json());
app.use(cookieParser());
app.use(morganMiddleware);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', week: '07', project: 'api-jwt-auth-almacen' });
});

// 2. Rutas del dominio
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/warehouses', warehousesRouter);
app.use('/api/v1/inventory-items', inventoryItemsRouter);

// 3. Ruta no registrada → AppError(404) → errorHandler
app.use(notFound);

// 4. Error handler global — siempre el último
app.use(errorHandler);

export default app;
