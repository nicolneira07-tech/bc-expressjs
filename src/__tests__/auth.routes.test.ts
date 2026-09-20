// ============================================
// INTEGRATION TESTS — /api/v1/auth
// ============================================
// App real + MongoDB en memoria (mongodb-memory-server) — sin mocks. Cubre
// lo que un unit test de auth.service.ts no puede: los cookies HttpOnly que
// arma el controller, el middleware de auth leyéndolos de vuelta, y la ruta
// completa register → login → recurso protegido → refresh → logout.

import request from 'supertest';
import app from '../app';
import { connectTestDB, clearTestDB, disconnectTestDB } from './helpers/db';
import { User } from '../models/user.model';

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

const credentials = { email: 'operador@almacen.com', password: 'Operador123', name: 'Operador de bodega' };

describe('POST /api/v1/auth/register', () => {
  it('201 — crea la cuenta y nunca devuelve el password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe(credentials.email);
    expect(res.body.data.role).toBe('operator'); // el registro público nunca crea admin
    expect(res.body.data.password).toBeUndefined();
  });

  it('409 — email ya registrado', async () => {
    await request(app).post('/api/v1/auth/register').send(credentials);

    const res = await request(app).post('/api/v1/auth/register').send(credentials);

    expect(res.status).toBe(409);
  });

  it('400 — password sin mayúscula ni número', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...credentials, password: 'minuscula' });

    expect(res.status).toBe(400);
    expect(res.body.issues).toEqual(expect.any(Array));
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(credentials);
  });

  it('200 — credenciales válidas, cookies HttpOnly en la respuesta', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('accessToken='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
    expect(cookies.every((c) => c.includes('HttpOnly'))).toBe(true);
  });

  it('401 — password incorrecto', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: 'clave-mala' });

    expect(res.status).toBe(401);
  });

  it('401 — email no existe, mismo mensaje que password incorrecto (previene user enumeration)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nadie@almacen.com', password: credentials.password });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas');
  });

  it('400 — body inválido (sin password)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: credentials.email });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('401 — sin cookie', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('200 — con la cookie de sesión', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/register').send(credentials);
    await agent.post('/api/v1/auth/login').send({ email: credentials.email, password: credentials.password });

    const res = await agent.get('/api/v1/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(credentials.email);
  });

  it('404 — el token es válido pero el usuario ya no existe en la base', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/register').send(credentials);
    await agent.post('/api/v1/auth/login').send({ email: credentials.email, password: credentials.password });
    await User.deleteOne({ email: credentials.email });

    const res = await agent.get('/api/v1/auth/me');

    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('200 — rota el par de tokens', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/register').send(credentials);
    await agent.post('/api/v1/auth/login').send({ email: credentials.email, password: credentials.password });

    const res = await agent.post('/api/v1/auth/refresh');

    expect(res.status).toBe(200);
  });

  it('401 — reusar un refresh token ya rotado invalida la sesión', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/register').send(credentials);
    const loginRes = await agent
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    const oldRefreshCookie = (loginRes.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.startsWith('refreshToken='),
    )!;

    await agent.post('/api/v1/auth/refresh'); // rota el token — el de arriba queda obsoleto

    const reuse = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', oldRefreshCookie.split(';')[0]!);

    expect(reuse.status).toBe(401);
  });

  it('401 — sin refresh token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('200 — invalida la sesión; un refresh posterior da 401', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/register').send(credentials);
    await agent.post('/api/v1/auth/login').send({ email: credentials.email, password: credentials.password });

    const logoutRes = await agent.post('/api/v1/auth/logout');
    expect(logoutRes.status).toBe(200);

    const refreshRes = await agent.post('/api/v1/auth/refresh');
    expect(refreshRes.status).toBe(401);
  });
});
