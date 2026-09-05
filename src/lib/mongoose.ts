// ============================================
// LIB — Conexión a MongoDB vía Mongoose
// ============================================
// A diferencia del singleton de PrismaClient (semana 05), Mongoose ya
// mantiene internamente una única conexión por proceso: `mongoose.connect()`
// reutiliza la conexión existente si ya hay una abierta, así que no hace
// falta guardar nada en `global` para sobrevivir al recargo de `tsx watch`.

import mongoose from 'mongoose';
import { logger } from '../config/logger';

export async function connectDB(): Promise<void> {
  const uri = process.env['MONGODB_URI'];
  if (!uri) {
    throw new Error('MONGODB_URI no está definida');
  }
  await mongoose.connect(uri);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

mongoose.connection.on('error', (err: Error) => {
  logger.error(`Error de conexión a MongoDB: ${err.message}`);
});
