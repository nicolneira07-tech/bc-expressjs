// ============================================
// MODELO — User (empleado que opera la API del almacén)
// ============================================
// `password` y `refreshToken` llevan `select: false`: por defecto ninguna
// consulta los devuelve — hay que pedirlos explícitamente con `.select('+password')`,
// igual que el starter del bootcamp. Así un `find()` normal nunca filtra un
// hash por accidente.
//
// Rol de dominio: 'operator' (da de alta/edita inventario y bodegas del día
// a día) vs 'admin' (además puede eliminar — semana 08 lo usa con RBAC).

import { Schema, model } from 'mongoose';

export interface IUser {
  email: string;
  password: string;
  name: string;
  role: 'operator' | 'admin';
  refreshToken?: string | null;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'email es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'password es requerido'],
      select: false,
    },
    name: {
      type: String,
      required: [true, 'name es requerido'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['operator', 'admin'],
      default: 'operator',
    },
    refreshToken: {
      type: String,
      select: false,
      default: null,
    },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', userSchema);
