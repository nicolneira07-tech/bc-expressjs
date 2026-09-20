// ============================================
// TEST HELPER — Agente autenticado (Supertest + cookies)
// ============================================
// `request.agent(app)` (a diferencia de `request(app)`) guarda las cookies
// que recibe y las reenvía en cada petición siguiente — el mismo
// comportamiento del navegador, sin tener que leer/pasar el header
// `Set-Cookie` a mano en cada test.
//
// El registro público SIEMPRE crea un `operator` (semana 07, a propósito —
// evita que cualquiera se autoasigne `admin`). Para probar RBAC como
// `admin` hace falta subir el rol directo en la base — un atajo válido en
// tests de infraestructura, nunca algo que la API permita hacer sola.

import request, { Agent } from 'supertest';
import { Application } from 'express';
import { User } from '../../models/user.model';

let counter = 0;

export interface TestUser {
  agent: Agent;
  email: string;
  password: string;
}

export async function createAuthenticatedAgent(
  app: Application,
  role: 'operator' | 'admin' = 'operator',
): Promise<TestUser> {
  counter += 1;
  const email = `test.user.${Date.now()}.${counter}@almacen.com`;
  const password = 'Clave1234';

  await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password, name: 'Usuario de prueba' })
    .expect(201);

  if (role === 'admin') {
    await User.findOneAndUpdate({ email }, { role: 'admin' });
  }

  const agent = request.agent(app);
  await agent.post('/api/v1/auth/login').send({ email, password }).expect(200);

  return { agent, email, password };
}
