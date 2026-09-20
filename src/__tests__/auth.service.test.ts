// ============================================
// UNIT TESTS — auth.service.ts
// ============================================
// Se mockea SOLO el repository — bcrypt y la firma/verificación de JWT
// corren de verdad (son funciones puras, deterministas dado el mismo input,
// y son justo lo que este archivo quiere probar: que el hash de la
// contraseña, la comparación y la rotación del refresh token FUNCIONEN, no
// que alguien los haya llamado con los argumentos correctos).

jest.mock('../repositories/users.repository');

import bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import * as service from '../services/auth.service';
import * as usersRepository from '../repositories/users.repository';
import { signRefreshToken } from '../utils/jwt';
import { AppError } from '../errors/AppError';

const mockFindByEmail = usersRepository.findByEmail as jest.MockedFunction<
  typeof usersRepository.findByEmail
>;
const mockFindAuthByEmail = usersRepository.findAuthByEmail as jest.MockedFunction<
  typeof usersRepository.findAuthByEmail
>;
const mockFindAuthById = usersRepository.findAuthById as jest.MockedFunction<
  typeof usersRepository.findAuthById
>;
const mockFindById = usersRepository.findById as jest.MockedFunction<typeof usersRepository.findById>;
const mockCreate = usersRepository.create as jest.MockedFunction<typeof usersRepository.create>;
const mockUpdateRefreshToken = usersRepository.updateRefreshToken as jest.MockedFunction<
  typeof usersRepository.updateRefreshToken
>;

const USER_ID = '6aaf4c983b30bcaa6a6a0c55';
const EMAIL = 'operador@almacen.com';
const PASSWORD = 'Operador123';

describe('AuthService — Unit Tests', () => {
  describe('register()', () => {
    it('hashea la contraseña y crea el usuario cuando el email es nuevo', async () => {
      mockFindByEmail.mockResolvedValue(null);
      mockCreate.mockImplementation(async (dto) => ({
        id: USER_ID,
        email: dto.email,
        name: dto.name,
        role: 'operator',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const result = await service.register({ email: EMAIL, password: PASSWORD, name: 'Operador' });

      expect(result.email).toBe(EMAIL);
      const [dtoPasado] = mockCreate.mock.calls[0]!;
      expect(dtoPasado.password).not.toBe(PASSWORD); // nunca se guarda en claro
      await expect(bcrypt.compare(PASSWORD, dtoPasado.password)).resolves.toBe(true);
    });

    it('lanza AppError 409 si el email ya está registrado', async () => {
      mockFindByEmail.mockResolvedValue({
        id: USER_ID,
        email: EMAIL,
        name: 'Operador',
        role: 'operator',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.register({ email: EMAIL, password: PASSWORD, name: 'Operador' }),
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('login()', () => {
    it('devuelve un access y un refresh token con credenciales válidas', async () => {
      const hashedPassword = await bcrypt.hash(PASSWORD, 10);
      mockFindAuthByEmail.mockResolvedValue({
        _id: USER_ID,
        email: EMAIL,
        password: hashedPassword,
        name: 'Operador',
        role: 'operator',
      } as never);

      const tokens = await service.login({ email: EMAIL, password: PASSWORD });

      expect(tokens.accessToken).toEqual(expect.any(String));
      expect(tokens.refreshToken).toEqual(expect.any(String));
      // Se guarda el HASH del refresh token, nunca el token en claro.
      expect(mockUpdateRefreshToken).toHaveBeenCalledWith(USER_ID, expect.any(String));
      const [, storedHash] = mockUpdateRefreshToken.mock.calls[0]!;
      expect(storedHash).not.toBe(tokens.refreshToken);
    });

    it('lanza AppError 401 con el mismo mensaje si el usuario no existe', async () => {
      mockFindAuthByEmail.mockResolvedValue(null);

      await expect(service.login({ email: 'nadie@almacen.com', password: PASSWORD })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Credenciales inválidas',
      });
    });

    it('lanza AppError 401 con el mismo mensaje si el password no coincide', async () => {
      const hashedPassword = await bcrypt.hash(PASSWORD, 10);
      mockFindAuthByEmail.mockResolvedValue({
        _id: USER_ID,
        email: EMAIL,
        password: hashedPassword,
        name: 'Operador',
        role: 'operator',
      } as never);

      await expect(service.login({ email: EMAIL, password: 'clave-equivocada' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Credenciales inválidas',
      });
    });
  });

  describe('refresh() — rotación', () => {
    it('emite un par nuevo cuando el refresh token coincide con el hash guardado', async () => {
      // 1. login() real (con el repository mockeado) para obtener el par
      //    inicial y el hash que "quedó guardado".
      const hashedPassword = await bcrypt.hash(PASSWORD, 10);
      mockFindAuthByEmail.mockResolvedValue({
        _id: USER_ID,
        email: EMAIL,
        password: hashedPassword,
        name: 'Operador',
        role: 'operator',
      } as never);
      const { refreshToken } = await service.login({ email: EMAIL, password: PASSWORD });
      const [, storedHash] = mockUpdateRefreshToken.mock.calls[0]!;

      // 2. refresh() simula leer ESE hash de vuelta desde la base.
      mockFindAuthById.mockResolvedValue({
        _id: USER_ID,
        email: EMAIL,
        role: 'operator',
        refreshToken: storedHash,
      } as never);

      const rotated = await service.refresh(refreshToken);

      expect(rotated.refreshToken).not.toBe(refreshToken); // token nuevo, no el mismo
      expect(mockUpdateRefreshToken).toHaveBeenCalledTimes(2); // 1 en login, 1 en refresh
    });

    it('lanza AppError 401 al reusar un refresh token ya rotado (no coincide con el hash vigente)', async () => {
      const viejo = signRefreshToken({ sub: USER_ID });
      // El hash guardado corresponde a OTRO token (ya rotado) — el bug real
      // que encontramos en la semana 07 era justo que esta comparación daba
      // `true` cuando no debía (bcrypt truncaba a 72 bytes).
      const hashDeOtroToken = createHash('sha256')
        .update(signRefreshToken({ sub: USER_ID }))
        .digest('hex');

      mockFindAuthById.mockResolvedValue({
        _id: USER_ID,
        email: EMAIL,
        role: 'operator',
        refreshToken: hashDeOtroToken,
      } as never);

      await expect(service.refresh(viejo)).rejects.toMatchObject({ statusCode: 401 });
      // Medida de contención: la sesión completa se invalida.
      expect(mockUpdateRefreshToken).toHaveBeenCalledWith(USER_ID, null);
    });

    it('lanza AppError 401 si el token no verifica (firma inválida)', async () => {
      await expect(service.refresh('esto-no-es-un-jwt')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('lanza AppError 401 si el usuario no tiene sesión activa (sin refreshToken guardado)', async () => {
      const token = signRefreshToken({ sub: USER_ID });
      mockFindAuthById.mockResolvedValue({
        _id: USER_ID,
        email: EMAIL,
        role: 'operator',
        refreshToken: null,
      } as never);

      await expect(service.refresh(token)).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('logout()', () => {
    it('invalida el refresh token del usuario', async () => {
      await service.logout(USER_ID);

      expect(mockUpdateRefreshToken).toHaveBeenCalledWith(USER_ID, null);
    });
  });

  describe('getMe()', () => {
    it('devuelve el perfil cuando el usuario existe', async () => {
      mockFindById.mockResolvedValue({
        id: USER_ID,
        email: EMAIL,
        name: 'Operador',
        role: 'operator',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getMe(USER_ID);

      expect(result.email).toBe(EMAIL);
    });

    it('lanza AppError 404 si el usuario ya no existe', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(service.getMe(USER_ID)).rejects.toBeInstanceOf(AppError);
      await expect(service.getMe(USER_ID)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
