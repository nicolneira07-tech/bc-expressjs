// ============================================
// APP — Configuración Express
// ============================================
// El ORDEN de registro importa, y en la semana 08 importa más que nunca:
//   1. Helmet (cabeceras) y rate limit global — antes que nada, ni body
//      parsing hace falta para rechazar por exceso de tráfico.
//   2. CORS — antes de las rutas, decide si el origen puede leer la respuesta.
//   3. Body parsing + cookies + sanitización — el body ya parseado es lo que
//      se sanitiza; sanitizar antes no tendría nada que limpiar todavía.
//   4. Logging HTTP (Morgan → Winston).
//   5. Rutas (auth con su propio rate limit más estricto).
//   6. notFound (ninguna ruta coincidió).
//   7. errorHandler (siempre el último, 4 parámetros).

import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import { morganMiddleware } from './config/logger';
import { globalLimiter, corsOptions } from './config/security';
import { sanitizeBody } from './middlewares/sanitize';
import { authRouter } from './routes/auth.routes';
import { inventoryItemsRouter } from './routes/inventory-items.routes';
import { warehousesRouter } from './routes/warehouses.routes';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// 1. Cabeceras de seguridad y límite de tráfico global
app.use(helmet());
app.use(globalLimiter);

// 2. CORS con whitelist (nunca `cors()` a secas)
app.use(cors(corsOptions));

// 3. Body parsing, cookies y sanitización contra NoSQL injection
app.use(express.json());
app.use(cookieParser());
app.use(sanitizeBody);

// 4. Logging HTTP
app.use(morganMiddleware);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', week: '08', project: 'api-rbac-seguridad-almacen' });
});

// 5. Rutas del dominio — login/register llevan su propio rate limit
//    más estricto, aplicado dentro de auth.routes.ts
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/warehouses', warehousesRouter);
app.use('/api/v1/inventory-items', inventoryItemsRouter);

// 6. Ruta no registrada → AppError(404) → errorHandler
app.use(notFound);

// 7. Error handler global — siempre el último
app.use(errorHandler);

export default app;
