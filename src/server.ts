// ============================================
// SERVER — Entry point
// ============================================
// Igual que en la semana 05: la conexión a la base se verifica ANTES de
// `app.listen()`. Si MongoDB no está disponible, el proceso muere de una con
// un mensaje claro, en lugar de quedar aceptando peticiones que van a
// reventar todas con un 500.

import 'dotenv/config';
import app from './app';
import { logger } from './config/logger';
import { connectDB, disconnectDB } from './lib/mongoose';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

async function bootstrap(): Promise<void> {
  try {
    await connectDB();
    logger.info('Conectado a MongoDB');
  } catch (err) {
    logger.error(`No se pudo conectar a MongoDB: ${(err as Error).message}`);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(`Servidor escuchando en http://localhost:${PORT}`);
    logger.info(`Health:      http://localhost:${PORT}/health`);
    logger.info(`Bodegas:     http://localhost:${PORT}/api/v1/warehouses`);
    logger.info(`Inventario:  http://localhost:${PORT}/api/v1/inventory-items`);
  });

  // Cierre ordenado: soltar la conexión antes de morir.
  const shutdown = (signal: string): void => {
    logger.info(`${signal} recibido, cerrando servidor...`);
    server.close(() => {
      void disconnectDB().then(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

void bootstrap();
