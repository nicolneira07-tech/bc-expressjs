// ============================================
// JEST — Configuración
// ============================================
// `ts-jest` compila cada `.test.ts` on-the-fly (mismo `tsconfig.json` que
// `pnpm build`, sin paso de compilación aparte). `setupFiles` inyecta los
// secretos de JWT ANTES de que se importe cualquier módulo — `utils/jwt.ts`
// los lee de `process.env` al firmar/verificar, y algunos `describe` de
// nivel superior ya llaman `signAccessToken` fuera de un `beforeEach`.

import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testTimeout: 30000, // mongodb-memory-server descarga/arranca mongod la primera vez
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts', // entry point — arranca el proceso real, no tiene "lógica" que testear
    '!src/seed.ts', // script de datos, se corre a mano
    '!src/lib/mongoose.ts', // connectDB/disconnectDB — los tests conectan directo a mongodb-memory-server
    '!src/config/logger.ts', // configuración de Winston/Morgan, no lógica de negocio
    '!src/types.ts',
    '!src/types/**',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
};

export default config;
