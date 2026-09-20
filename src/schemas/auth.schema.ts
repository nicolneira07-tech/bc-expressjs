// ============================================
// SCHEMAS — Validación con Zod del recurso Auth
// ============================================

import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string({ error: 'email es obligatorio' }).trim().toLowerCase().email('email no es válido'),

  password: z
    .string({ error: 'password es obligatorio' })
    .min(8, 'password debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'password debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'password debe contener al menos un número'),

  name: z
    .string({ error: 'name es obligatorio' })
    .trim()
    .min(2, 'name debe tener al menos 2 caracteres')
    .max(100, 'name no puede superar los 100 caracteres'),

  // Sin `role`: si el registro público aceptara el rol, cualquiera podría
  // auto-asignarse 'admin' (escalación de privilegios). Todo el que se
  // registra entra como 'operator'; los 'admin' se crean por seed/DB.
});

export const loginSchema = z.object({
  email: z.string({ error: 'email es obligatorio' }).trim().toLowerCase().email('email no es válido'),
  password: z.string({ error: 'password es obligatorio' }).min(1, 'password es obligatorio'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
