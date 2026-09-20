// ============================================
// SEED — Datos iniciales del dominio Logística / Almacén
// Ejecutar con: pnpm db:seed
// ============================================
// Idempotente: borra y vuelve a insertar, así se puede correr las veces que
// haga falta sin duplicar registros. El orden importa por la relación 1:N —
// primero se borran los ítems (los hijos) y después las bodegas (los
// padres), y al insertar es al revés: no se puede crear un ítem que apunte a
// una bodega que todavía no existe.
//
// A diferencia del `RESTART IDENTITY` de PostgreSQL (semana 05), los ids de
// Mongo (`ObjectId`) no son correlativos — no hay secuencia que reiniciar.
// Por eso las capturas de esta semana no fijan ids concretos, sino que
// resuelven el id real con un GET previo (ver docs/capturas/README.md).

import 'dotenv/config';
import bcrypt from 'bcrypt';
import { connectDB, disconnectDB } from './lib/mongoose';
import { logger } from './config/logger';
import { Warehouse } from './models/warehouse.model';
import { InventoryItem } from './models/inventory-item.model';
import { User } from './models/user.model';

const SALT_ROUNDS = 10;

async function main(): Promise<void> {
  await connectDB();
  logger.info('Iniciando seed...');

  await InventoryItem.deleteMany({});
  await Warehouse.deleteMany({});
  await User.deleteMany({});

  const [operatorPassword, adminPassword] = await Promise.all([
    bcrypt.hash('Operador123', SALT_ROUNDS),
    bcrypt.hash('Admin1234', SALT_ROUNDS),
  ]);

  const [operator, admin] = await User.insertMany([
    { email: 'operador@almacen.com', password: operatorPassword, name: 'Operador de bodega', role: 'operator' },
    { email: 'admin@almacen.com', password: adminPassword, name: 'Administrador', role: 'admin' },
  ]);

  logger.info(`  2 usuarios creados: ${operator!.email} (operator), ${admin!.email} (admin)`);

  const [bogota, medellin] = await Warehouse.insertMany([
    { code: 'BOG-01', name: 'Centro de distribución Bogotá', city: 'Bogotá' },
    { code: 'MED-01', name: 'Bodega regional Medellín', city: 'Medellín' },
  ]);

  logger.info(`  2 bodegas creadas: ${bogota.code}, ${medellin.code}`);

  const items = await InventoryItem.insertMany([
    {
      sku: 'PKG-0001',
      name: 'Pallet de cartón corrugado',
      category: 'packaging',
      price: 8.5,
      stock: 500,
      location: 'A-01',
      warehouse: bogota._id,
    },
    {
      sku: 'ELE-0001',
      name: 'Escáner de código de barras',
      category: 'electronics',
      price: 189.99,
      stock: 15,
      location: 'B-05',
      warehouse: bogota._id,
    },
    {
      sku: 'SPA-0001',
      name: 'Rodamiento industrial 6205',
      category: 'spare-parts',
      price: 12.75,
      stock: 200,
      location: 'C-10',
      warehouse: bogota._id,
    },
    {
      sku: 'SAF-0001',
      name: 'Casco de seguridad',
      category: 'safety-equipment',
      price: 15.5,
      stock: 80,
      location: 'D-01',
      warehouse: medellin._id,
    },
    {
      sku: 'RAW-0001',
      name: 'Bobina de acero laminado',
      category: 'raw-materials',
      price: 890.0,
      stock: 6,
      location: 'E-01',
      warehouse: medellin._id,
    },
    {
      sku: 'PKG-0002',
      name: 'Film stretch industrial',
      category: 'packaging',
      price: 24.9,
      stock: 120,
      location: 'A-04',
      warehouse: medellin._id,
    },
  ]);

  logger.info(`  ${items.length} ítems de inventario creados`);
  logger.info('Seed completado.');
  await disconnectDB();
}

main().catch((err: unknown) => {
  logger.error(`Error en seed: ${(err as Error).message}`);
  process.exit(1);
});
