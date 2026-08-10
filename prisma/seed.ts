// ============================================
// SEED — Datos iniciales del dominio Logística / Almacén
// Ejecutar con: pnpm db:seed
// ============================================
// Idempotente: borra y vuelve a insertar, así se puede correr las veces que
// haga falta sin duplicar registros. El orden importa por la clave foránea —
// primero se borran los ítems (los hijos) y después las bodegas (los padres),
// y al insertar es al revés.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Iniciando seed...');

  // TRUNCATE ... RESTART IDENTITY reinicia además las secuencias de los `id`,
  // cosa que `deleteMany()` no hace: sin esto, cada corrida del seed dejaría
  // los ids corridos (1..6, luego 7..12...) y los ejemplos del README dejarían
  // de coincidir. CASCADE se encarga de los ítems que apuntan a las bodegas.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "inventory_items", "warehouses" RESTART IDENTITY CASCADE'
  );

  const bogota = await prisma.warehouse.create({
    data: { code: 'BOG-01', name: 'Centro de distribución Bogotá', city: 'Bogotá' },
  });

  const medellin = await prisma.warehouse.create({
    data: { code: 'MED-01', name: 'Bodega regional Medellín', city: 'Medellín' },
  });

  console.log(`  ${2} bodegas creadas: ${bogota.code}, ${medellin.code}`);

  const items = await prisma.inventoryItem.createMany({
    data: [
      { sku: 'PKG-0001', name: 'Pallet de cartón corrugado', category: 'packaging', price: 8.5, stock: 500, location: 'A-01', warehouseId: bogota.id },
      { sku: 'ELE-0001', name: 'Escáner de código de barras', category: 'electronics', price: 189.99, stock: 15, location: 'B-05', warehouseId: bogota.id },
      { sku: 'SPA-0001', name: 'Rodamiento industrial 6205', category: 'spare-parts', price: 12.75, stock: 200, location: 'C-10', warehouseId: bogota.id },
      { sku: 'SAF-0001', name: 'Casco de seguridad', category: 'safety-equipment', price: 15.5, stock: 80, location: 'D-01', warehouseId: medellin.id },
      { sku: 'RAW-0001', name: 'Bobina de acero laminado', category: 'raw-materials', price: 890.0, stock: 6, location: 'E-01', warehouseId: medellin.id },
      { sku: 'PKG-0002', name: 'Film stretch industrial', category: 'packaging', price: 24.9, stock: 120, location: 'A-04', warehouseId: medellin.id },
    ],
  });

  console.log(`  ${items.count} ítems de inventario creados`);
  console.log('Seed completado.');
}

main()
  .catch((err: unknown) => {
    console.error('Error en seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
