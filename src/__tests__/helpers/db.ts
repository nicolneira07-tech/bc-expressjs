// ============================================
// TEST HELPER — MongoDB en memoria (mongodb-memory-server)
// ============================================
// Cada archivo de integración levanta SU PROPIO mongod en memoria — nada de
// Docker, nada de estado compartido entre archivos (Jest corre cada .test.ts
// en un proceso worker aparte). `clearDatabase()` entre tests evita que un
// `it()` vea datos que dejó el anterior sin tener que reiniciar el server
// completo cada vez.

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export async function connectTestDB(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

export async function clearTestDB(): Promise<void> {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}

export async function disconnectTestDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}
