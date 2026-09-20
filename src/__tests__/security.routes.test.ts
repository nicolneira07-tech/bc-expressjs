// ============================================
// INTEGRATION TESTS — Cabeceras de seguridad, CORS, 404
// ============================================

import request from 'supertest';
import app from '../app';
import { connectTestDB, disconnectTestDB } from './helpers/db';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('Cabeceras de seguridad (Helmet)', () => {
  it('GET /health incluye las cabeceras de Helmet', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['content-security-policy']).toEqual(expect.any(String));
  });
});

describe('CORS', () => {
  it('permite un origen de la whitelist', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('bloquea un origen fuera de la whitelist', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://evil-site.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('permite peticiones sin header Origin (no son de navegador)', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
  });
});

describe('Rutas no registradas', () => {
  it('404 en formato JSON, no HTML', async () => {
    const res = await request(app).get('/api/v1/no-existe');

    expect(res.status).toBe(404);
    expect(res.body.error).toEqual(expect.any(String));
  });
});
