// ============================================
// JEST — Setup global (corre antes de cada archivo de test)
// ============================================
// Sin esto, `utils/jwt.ts` lanza AppError(500) apenas algún test intenta
// firmar/verificar un token — `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` no
// existen en el entorno de test por defecto (no se carga `.env`).

process.env['NODE_ENV'] = 'test';
process.env['JWT_ACCESS_SECRET'] = 'test-access-secret-no-usar-en-produccion';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-no-usar-en-produccion';
