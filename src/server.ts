// ============================================
// SERVER — Entry point
// ============================================
// Desde la semana 05 el arranque verifica primero la conexión a PostgreSQL:
// es preferible fallar de inmediato con un mensaje claro que quedar aceptando
// peticiones que van a reventar todas con un 500.

import app from './app';
import { logger } from './config/logger';
import { prisma } from './lib/prisma';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Conectado a PostgreSQL');
  } catch (err) {
    logger.error(`No se pudo conectar a PostgreSQL: ${(err as Error).message}`);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(`Servidor escuchando en http://localhost:${PORT}`);
    logger.info(`Health:      http://localhost:${PORT}/health`);
    logger.info(`Bodegas:     http://localhost:${PORT}/api/v1/warehouses`);
    logger.info(`Inventario:  http://localhost:${PORT}/api/v1/inventory-items`);
  });

  // Cierre ordenado: soltar el pool de conexiones antes de morir.
  const shutdown = (signal: string): void => {
    logger.info(`${signal} recibido, cerrando servidor...`);
    server.close(() => {
      void prisma.$disconnect().then(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

void bootstrap();
