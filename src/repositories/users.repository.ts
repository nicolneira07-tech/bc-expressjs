// ============================================
// REPOSITORY — Users (capa de acceso a datos)
// ============================================
// `findByEmail`/`findById` devuelven la vista pública (sin password ni
// refreshToken — Mongoose ya los excluye por el `select: false` del schema).
// `findByEmailWithPassword`/`findByIdWithTokens` los piden explícitos con
// `.select('+password')`: son los únicos dos lugares del proyecto que ven un
// hash de contraseña o de refresh token.

import mongoose from 'mongoose';
import { User, IUser } from '../models/user.model';
import { AppError } from '../errors/AppError';
import { UserView } from '../types';
import { RegisterDto } from '../schemas/auth.schema';

type UserDoc = IUser & { _id: mongoose.Types.ObjectId; createdAt: Date; updatedAt: Date };

function toView(doc: UserDoc): UserView {
  return {
    id: String(doc._id),
    email: doc.email,
    name: doc.name,
    role: doc.role,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function findByEmail(email: string): Promise<UserView | null> {
  const doc = await User.findOne({ email }).lean<UserDoc | null>();
  return doc ? toView(doc) : null;
}

export async function findById(id: string): Promise<UserView | null> {
  const doc = await User.findById(id).lean<UserDoc | null>();
  return doc ? toView(doc) : null;
}

// Solo para login: trae el hash de password junto al resto del documento.
export async function findAuthByEmail(email: string): Promise<UserDoc | null> {
  return User.findOne({ email }).select('+password').lean<UserDoc | null>();
}

// Solo para refresh: trae el hash del refresh token guardado.
export async function findAuthById(id: string): Promise<UserDoc | null> {
  return User.findById(id).select('+refreshToken').lean<UserDoc | null>();
}

export async function create(dto: Omit<RegisterDto, 'password'> & { password: string }): Promise<UserView> {
  try {
    const doc = await User.create(dto);
    return toView(doc.toObject() as unknown as UserDoc);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new AppError(409, `Ya existe un usuario registrado con el email "${dto.email}"`);
    }
    throw err;
  }
}

export async function updateRefreshToken(id: string, hashedToken: string | null): Promise<void> {
  await User.findByIdAndUpdate(id, { refreshToken: hashedToken });
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}
