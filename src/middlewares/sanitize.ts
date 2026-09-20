// ============================================
// MIDDLEWARE — sanitizeBody (mitiga NoSQL injection)
// ============================================
// El paquete "de libro" para esto es `express-mongo-sanitize`, pero es
// incompatible con Express 5: intenta reasignar `req.query` por completo, y
// en Express 5 `req.query` es un getter sin setter (se parsea on-demand según
// el `query parser` configurado) — con ese paquete, CUALQUIER petición
// revienta con 500 ("Cannot set property query of ... which has only a
// getter"), no solo las maliciosas. Comprobado en este proyecto: ver
// APUNTES-SEMANA-08.md.
//
// Alternativa liviana: recorrer `req.body` a mano y eliminar cualquier clave
// que empiece con "$" (operador de Mongo: `$gt`, `$where`, `$ne`...) o que
// contenga "." (para no poder escribir en un sub-documento arbitrario como
// `"a.b": 1`). Solo se muta `req.body` — nunca `req.query` — así no choca
// con la limitación de Express 5. `req.body` ya lo puso `express.json()`
// como propiedad normal (sí se puede mutar), a diferencia de `req.query`.
//
// Es una SEGUNDA capa, no la única: los schemas de Zod (`z.string()`,
// `z.enum()`, etc.) ya rechazan un objeto donde se espera un string, que es
// como se ve un intento de inyección típico (`{"email": {"$gt": ""}}`).

import { Request, Response, NextFunction } from 'express';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stripMongoOperators(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripMongoOperators);
  }
  if (isPlainObject(value)) {
    const clean: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      clean[key] = stripMongoOperators(val);
    }
    return clean;
  }
  return value;
}

export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
  if (isPlainObject(req.body)) {
    req.body = stripMongoOperators(req.body);
  }
  next();
}
