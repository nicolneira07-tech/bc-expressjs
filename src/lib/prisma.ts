// ============================================
// LIB — Singleton de PrismaClient
// ============================================
// Cada `new PrismaClient()` abre su propio pool de conexiones. En desarrollo,
// `tsx watch` recarga el módulo en cada guardado y sin este patrón se irían
// acumulando pools hasta agotar las conexiones de PostgreSQL. Guardar la
// instancia en el objeto global (que sobrevive a la recarga) lo evita.

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const isDev = process.env['NODE_ENV'] !== 'production';

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (isDev) {
  globalForPrisma.prisma = prisma;
}
