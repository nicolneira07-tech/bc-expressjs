// ============================================
// INTEGRATION TESTS — /api/v1/inventory-items
// ============================================
// App real + MongoDB en memoria. Cubre auth (401), RBAC (403 con operator,
// 204 con admin en DELETE), CRUD completo y las traducciones de error de
// Mongo que ya prueba curl en docs/capturas/, pero ahora como test
// reproducible en CI.

import request from 'supertest';
import app from '../app';
import { connectTestDB, clearTestDB, disconnectTestDB } from './helpers/db';
import { createAuthenticatedAgent } from './helpers/auth';
import { Warehouse } from '../models/warehouse.model';

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

async function seedWarehouse(): Promise<string> {
  const warehouse = await Warehouse.create({ code: 'BOG-01', name: 'Centro de distribución Bogotá', city: 'Bogotá' });
  return String(warehouse._id);
}

const validItem = (warehouseId: string) => ({
  sku: 'PKG-0001',
  name: 'Pallet de cartón corrugado',
  category: 'packaging',
  price: 8.5,
  stock: 500,
  location: 'A-01',
  warehouse: warehouseId,
});

describe('GET /api/v1/inventory-items', () => {
  it('401 — sin cookie de sesión', async () => {
    const res = await request(app).get('/api/v1/inventory-items');
    expect(res.status).toBe(401);
  });

  it('200 — lista paginada con la bodega populada, estando autenticado', async () => {
    const warehouseId = await seedWarehouse();
    const { agent } = await createAuthenticatedAgent(app);
    await agent.post('/api/v1/inventory-items').send(validItem(warehouseId));

    const res = await agent.get('/api/v1/inventory-items?page=1&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].warehouse.code).toBe('BOG-01');
    expect(res.body.total).toBe(1);
  });

  it('400 — limit fuera de rango (Zod)', async () => {
    const { agent } = await createAuthenticatedAgent(app);

    const res = await agent.get('/api/v1/inventory-items?limit=1000');

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/inventory-items', () => {
  it('201 — crea el ítem con datos válidos', async () => {
    const warehouseId = await seedWarehouse();
    const { agent } = await createAuthenticatedAgent(app);

    const res = await agent.post('/api/v1/inventory-items').send(validItem(warehouseId));

    expect(res.status).toBe(201);
    expect(res.body.data.sku).toBe('PKG-0001');
  });

  it('400 — datos inválidos (Zod)', async () => {
    const { agent } = await createAuthenticatedAgent(app);

    const res = await agent.post('/api/v1/inventory-items').send({ sku: 'xx' });

    expect(res.status).toBe(400);
    expect(res.body.issues.length).toBeGreaterThan(0);
  });

  it('404 — la bodega referenciada no existe (aunque el ObjectId sea válido)', async () => {
    const { agent } = await createAuthenticatedAgent(app);

    const res = await agent
      .post('/api/v1/inventory-items')
      .send(validItem('64b000000000000000000000'));

    expect(res.status).toBe(404);
  });

  it('409 — sku duplicado (índice único 11000 traducido)', async () => {
    const warehouseId = await seedWarehouse();
    const { agent } = await createAuthenticatedAgent(app);
    await agent.post('/api/v1/inventory-items').send(validItem(warehouseId));

    const res = await agent.post('/api/v1/inventory-items').send(validItem(warehouseId));

    expect(res.status).toBe(409);
  });
});

describe('GET /api/v1/inventory-items/:id', () => {
  it('200 — devuelve el ítem existente', async () => {
    const warehouseId = await seedWarehouse();
    const { agent } = await createAuthenticatedAgent(app);
    const created = await agent.post('/api/v1/inventory-items').send(validItem(warehouseId));

    const res = await agent.get(`/api/v1/inventory-items/${created.body.data.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(created.body.data.id);
  });

  it('400 — id que no es un ObjectId válido', async () => {
    const { agent } = await createAuthenticatedAgent(app);

    const res = await agent.get('/api/v1/inventory-items/no-es-un-id');

    expect(res.status).toBe(400);
  });

  it('404 — ObjectId válido pero inexistente', async () => {
    const { agent } = await createAuthenticatedAgent(app);

    const res = await agent.get('/api/v1/inventory-items/64b000000000000000000000');

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/inventory-items/:id', () => {
  it('200 — actualización parcial', async () => {
    const warehouseId = await seedWarehouse();
    const { agent } = await createAuthenticatedAgent(app);
    const created = await agent.post('/api/v1/inventory-items').send(validItem(warehouseId));

    const res = await agent.put(`/api/v1/inventory-items/${created.body.data.id}`).send({ stock: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data.stock).toBe(10);
  });

  it('404 — id inexistente', async () => {
    const { agent } = await createAuthenticatedAgent(app);

    const res = await agent.put('/api/v1/inventory-items/64b000000000000000000000').send({ stock: 1 });

    expect(res.status).toBe(404);
  });

  it('400 — id inválido', async () => {
    const { agent } = await createAuthenticatedAgent(app);

    const res = await agent.put('/api/v1/inventory-items/no-es-un-id').send({ stock: 1 });

    expect(res.status).toBe(400);
  });

  it('400 — body inválido (category fuera del enum)', async () => {
    const warehouseId = await seedWarehouse();
    const { agent } = await createAuthenticatedAgent(app);
    const created = await agent.post('/api/v1/inventory-items').send(validItem(warehouseId));

    const res = await agent
      .put(`/api/v1/inventory-items/${created.body.data.id}`)
      .send({ category: 'no-existe' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/inventory-items/:id — RBAC', () => {
  it('400 — id inválido (con sesión de admin)', async () => {
    const { agent } = await createAuthenticatedAgent(app, 'admin');

    const res = await agent.delete('/api/v1/inventory-items/no-es-un-id');

    expect(res.status).toBe(400);
  });

  it('403 — un operator no puede eliminar', async () => {
    const warehouseId = await seedWarehouse();
    const { agent } = await createAuthenticatedAgent(app, 'operator');
    const created = await agent.post('/api/v1/inventory-items').send(validItem(warehouseId));

    const res = await agent.delete(`/api/v1/inventory-items/${created.body.data.id}`);

    expect(res.status).toBe(403);
  });

  it('204 — un admin sí puede eliminar', async () => {
    const warehouseId = await seedWarehouse();
    const { agent: operatorAgent } = await createAuthenticatedAgent(app, 'operator');
    const created = await operatorAgent.post('/api/v1/inventory-items').send(validItem(warehouseId));

    const { agent: adminAgent } = await createAuthenticatedAgent(app, 'admin');
    const res = await adminAgent.delete(`/api/v1/inventory-items/${created.body.data.id}`);

    expect(res.status).toBe(204);

    const getRes = await adminAgent.get(`/api/v1/inventory-items/${created.body.data.id}`);
    expect(getRes.status).toBe(404);
  });

  it('401 — sin sesión', async () => {
    const warehouseId = await seedWarehouse();
    const { agent } = await createAuthenticatedAgent(app);
    const created = await agent.post('/api/v1/inventory-items').send(validItem(warehouseId));

    const res = await request(app).delete(`/api/v1/inventory-items/${created.body.data.id}`);

    expect(res.status).toBe(401);
  });
});
