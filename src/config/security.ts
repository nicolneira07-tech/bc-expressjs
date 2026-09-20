// ============================================
// CONFIG — Rate limiting y CORS
// ============================================
// Dos limiters con umbrales distintos: uno global (todo el tráfico) y uno
// más estricto solo para login/register — son el blanco de fuerza bruta y
// credential stuffing, así que su límite es mucho más bajo.

import rateLimit from 'express-rate-limit';
import { CorsOptions } from 'cors';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7', // headers RateLimit-* en vez de los X-RateLimit-* obsoletos
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, intenta de nuevo más tarde' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación, intenta de nuevo más tarde' },
});

// Whitelist explícita — nunca `cors()` a secas (eso equivale a `origin: '*'`
// con credenciales, lo que la spec de CORS ni siquiera permite en la
// práctica). Un origen no listado no puede leer la respuesta aunque la
// petición SÍ le llegue al servidor.
const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:3000'];

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Sin header Origin (curl, Postman, servidor-a-servidor) → se permite:
    // no es una petición de navegador, CORS no aplica.
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS: origen "${origin}" no está autorizado`));
  },
  credentials: true, // necesario para que el navegador mande las cookies HttpOnly
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
};
