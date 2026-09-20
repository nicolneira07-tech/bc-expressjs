// ============================================
// INTEGRATION TESTS — /api/v1/warehouses
// ============================================

import request from 'supertest';
import app from '../app';
import { connectTestDB, clearTestDB, disconnectTestDB } from './helpers/db';
import { createAuthenticatedAgent } from './helpers/auth';

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

const validWarehouse = { code: 'BOG-01', name: 'Centro de distribución Bogotá', city: 'Bogotá' };

describe('GET /api/v1/warehouses', () => {
  it('401 — sin sesión', async () => {
    const res = await request(app).get('/api/v1/warehouses');
    expect(res.status).toBe(401);
  });

  it('200 — cualquier sesión puede listar (operator incluido)', async () => {
    const { agent } = await createAuthenticatedAgent(app, 'admin');
    await agent.post('/api/v1/warehouses').send(validWarehouse);

    const { agent: operatorAgent } = await createAuthenticatedAgent(app, 'operator');
    const res = await operatorAgent.get('/api/v1/warehouses');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/v1/warehouses/:id', () => {
  it('200 — devuelve la bodega existente', async () => {
    const { agent } = await createAuthenticatedAgent(app, 'admin');
    const created = await agent.post('/api/v1/warehouses').send(validWarehouse);

    const res = await agent.get(`/api/v1/warehouses/${created.body.data.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.code).toBe('BOG-01');
  });

  it('400 — id que no es un ObjectId válido', async () => {
    const { agent } = await createAuthenticatedAgent(app);

    const res = await agent.get('/api/v1/warehouses/no-es-un-id');

    expect(res.status).toBe(400);
  });

  it('404 — ObjectId válido pero inexistente', async () => {
    const { agent } = await createAuthenticatedAgent(app);

    const res = await agent.get('/api/v1/warehouses/64b000000000000000000000');

    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/warehouses — RBAC', () => {
  it('403 — un operator no puede crear bodegas', async () => {
    const { agent } = await createAuthenticatedAgent(app, 'operator');

    const res = await agent.post('/api/v1/warehouses').send(validWarehouse);

    expect(res.status).toBe(403);
  });

  it('201 — un admin sí puede crear bodegas', async () => {
    const { agent } = await createAuthenticatedAgent(app, 'admin');

    const res = await agent.post('/api/v1/warehouses').send(validWarehouse);

    expect(res.status).toBe(201);
    expect(res.body.data.code).toBe('BOG-01');
  });

  it('409 — code duplicado', async () => {
    const { agent } = await createAuthenticatedAgent(app, 'admin');
    await agent.post('/api/v1/warehouses').send(validWarehouse);

    const res = await agent.post('/api/v1/warehouses').send(validWarehouse);

    expect(res.status).toBe(409);
  });

  it('400 — code con formato inválido (Zod)', async () => {
    const { agent } = await createAuthenticatedAgent(app, 'admin');

    const res = await agent.post('/api/v1/warehouses').send({ ...validWarehouse, code: 'x' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/v1/warehouses/:id', () => {
  it('200 — actualización parcial (solo admin)', async () => {
    const { agent } = await createAuthenticatedAgent(app, 'admin');
    const created = await agent.post('/api/v1/warehouses').send(validWarehouse);

    const res = await agent.put(`/api/v1/warehouses/${created.body.data.id}`).send({ city: 'Medellín' });

    expect(res.status).toBe(200);
    expect(res.body.data.city).toBe('Medellín');
  });

  it('400 — id inválido', async () => {
    const { agent } = await createAuthenticatedAgent(app, 'admin');

    const res = await agent.put('/api/v1/warehouses/no-es-un-id').send({ city: 'Medellín' });

    expect(res.status).toBe(400);
  });

  it('400 — body inválido', async () => {
    const { agent } = await createAuthenticatedAgent(app, 'admin');
    const created = await agent.post('/api/v1/warehouses').send(validWarehouse);

    const res = await agent.put(`/api/v1/warehouses/${created.body.data.id}`).send({ code: 'x' });

    expect(res.status).toBe(400);
  });

  it('404 — id inexistente', async () => {
    const { agent } = await createAuthenticatedAgent(app, 'admin');

    const res = await agent.put('/api/v1/warehouses/64b000000000000000000000').send({ city: 'Medellín' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/warehouses/:id', () => {
  it('400 — id inválido', async () => {
    const { agent } = await createAuthenticatedAgent(app, 'admin');

    const res = await agent.delete('/api/v1/warehouses/no-es-un-id');

    expect(res.status).toBe(400);
  });

  it('409 — no se puede eliminar una bodega con ítems asociados', async () => {
    const { agent } = await createAuthenticatedAgent(app, 'admin');
    const created = await agent.post('/api/v1/warehouses').send(validWarehouse);
    await agent.post('/api/v1/inventory-items').send({
      sku: 'PKG-0001',
      name: 'Pallet de cartón corrugado',
      category: 'packaging',
      price: 8.5,
      stock: 500,
      location: 'A-01',
      warehouse: created.body.data.id,
    });

    const res = await agent.delete(`/api/v1/warehouses/${created.body.data.id}`);

    expect(res.status).toBe(409);
  });

  it('204 — elimina una bodega sin ítems', async () => {
    const { agent } = await createAuthenticatedAgent(app, 'admin');
    const created = await agent.post('/api/v1/warehouses').send(validWarehouse);

    const res = await agent.delete(`/api/v1/warehouses/${created.body.data.id}`);

    expect(res.status).toBe(204);
  });

  it('403 — un operator no puede eliminar bodegas', async () => {
    const { agent: adminAgent } = await createAuthenticatedAgent(app, 'admin');
    const created = await adminAgent.post('/api/v1/warehouses').send(validWarehouse);

    const { agent: operatorAgent } = await createAuthenticatedAgent(app, 'operator');
    const res = await operatorAgent.delete(`/api/v1/warehouses/${created.body.data.id}`);

    expect(res.status).toBe(403);
  });
});
