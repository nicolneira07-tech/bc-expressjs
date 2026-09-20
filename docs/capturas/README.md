# Capturas — Semana 09

Evidencia pedida por la rúbrica de la semana 09 (testing con Jest +
Supertest). A diferencia de semanas anteriores, acá lo que se "captura" no
son peticiones `curl` sino la salida de los comandos de test — es la
evidencia que de verdad importa para esta semana.

| # | Archivo | Comando | Qué muestra |
|---|---|---|---|
| 01 | `01-test-run.txt` | `pnpm test --verbose` | Los 94 tests, uno por uno, con su nombre y el tiempo — 9 suites, todas en verde |
| 02 | `02-coverage-summary.txt` | `pnpm test:coverage` | Tabla de cobertura por archivo — el resumen que compara contra el umbral de `jest.config.ts` |
| 03 | `03-build.txt` | `pnpm build` | `tsc` sin errores — los `.test.ts` quedan excluidos del build de producción (`tsconfig.json`) |

## Resultado

```
Test Suites: 9 passed, 9 total
Tests:       94 passed, 94 total
```

Cobertura (umbral configurado: statements 80 / branches 70 / functions 80 / lines 80):

```
All files   |   95.29 |    83.52 |   97.59 |   95.27
```

Los cuatro números están por encima del umbral — `pnpm test:coverage` termina
con código de salida `0`.

## Qué se testeó y cómo

| Archivo | Tipo | Qué cubre |
|---|---|---|
| `inventory-items.service.test.ts` | Unit (repository mockeado) | Reglas de negocio: `assertWarehouseExists`, propagación de `AppError` |
| `warehouses.service.test.ts` | Unit (repository mockeado) | Regla "no borrar bodega con ítems" (`countByWarehouse`) |
| `auth.service.test.ts` | Unit (repository mockeado, bcrypt/JWT reales) | Hash de password, comparación de credenciales, **rotación real del refresh token** |
| `requireRole.test.ts` | Unit (middleware puro) | 401 sin `req.user`, 403 con rol incorrecto, `next()` sin argumentos con el rol correcto |
| `sanitize.test.ts` | Unit (middleware puro) | Limpieza de operadores `$` y claves con `.`, objetos anidados y arrays |
| `auth.routes.test.ts` | Integración (Supertest + Mongo en memoria) | Ciclo completo register → login → me → refresh (con rotación) → logout, cookies HttpOnly reales |
| `inventory-items.routes.test.ts` | Integración | CRUD completo, validaciones Zod, traducción de errores Mongo (`11000`/`CastError`), RBAC |
| `warehouses.routes.test.ts` | Integración | CRUD completo, RBAC, regla de negocio "bodega con ítems" de punta a punta |
| `security.routes.test.ts` | Integración | Cabeceras de Helmet, CORS (origen permitido/bloqueado), 404 en JSON |

**Por qué "unit" mockea el repository y no la base de datos entera:** un
test unitario prueba una unidad aislada — la lógica de negocio del
`service`, no si Mongoose sabe conectarse a Mongo (eso ya lo prueba Mongoose
en sus propios tests). Mockear el repository dice: "si el repository
devuelve esto, el service debe decidir aquello" — rápido (no hay I/O real) y
determinista.

**Por qué "integración" sí usa una base de datos real (en memoria):**
prueba lo que un mock no puede — que las rutas, el `errorHandler`, los
middlewares de auth/RBAC y el repository (con las traducciones de error de
Mongo de verdad) encajan entre sí. `mongodb-memory-server` descarga un
`mongod` real y lo corre en un puerto libre — sin Docker, sin estado
compartido entre archivos (cada `.test.ts` levanta el suyo).

## Dos bugs reales que esta semana sacó a la luz

Escribir estos tests no fue solo "confirmar que el código de las semanas
07-08 estaba bien" — encontró dos bugs de verdad, ambos por la misma causa
raíz: **firmar dos JWT con contenido idéntico da la MISMA firma** (HMAC es
determinista) si no hay algo que los diferencie.

1. **La rotación de refresh tokens ya se había roto una vez** (documentado
   en `APUNTES-SEMANA-07.md`: bcrypt trunca a 72 bytes) y se arregló con
   SHA-256. Al escribir el test unitario de rotación (`auth.service.test.ts`),
   apareció una VARIANTE del mismo problema: dos refresh tokens del mismo
   usuario, firmados dentro del mismo segundo (`iat` con resolución de
   segundos), son **el mismo string** — no hay nada que los distinga. Eso
   rompía tanto el test (no podía comprobar "el token nuevo es distinto del
   viejo") como, en teoría, la rotación real bajo carga (dos refresh casi
   simultáneos). Se corrigió agregando un `jti` (JWT ID) aleatorio a cada
   refresh token (`src/utils/jwt.ts`) — mismo espíritu que la corrección de
   la semana 07, encontrado por escribir el test, no por inspección.
2. **`authLimiter` bloqueaba la propia suite de tests.** Los tests de
   integración registran y loguean decenas de usuarios por archivo
   (`createAuthenticatedAgent`); con el límite de producción activo
   (5 login/register cada 15 min), el segundo `describe` de cada archivo ya
   recibía `429` en vez de las respuestas que el test quería verificar. Se
   agregó `skip: () => process.env.NODE_ENV === 'test'` a los dos limiters
   (`src/config/security.ts`) — el comportamiento en dev/producción no
   cambia; el rate limiting en sí ya tiene su propia evidencia con reloj
   real en `docs/capturas/16-auth-rate-limit-429.txt` de la semana 08.

## Reproducir

```bash
pnpm install
pnpm test                # 01 — no necesita Docker ni MongoDB corriendo
pnpm test:coverage        # 02 — abre coverage/index.html para el reporte visual
pnpm build                 # 03
```

`pnpm test` (y `test:coverage`) no tocan la base de datos real del
`docker-compose.yml` — cada suite de integración levanta su propio Mongo en
memoria y lo apaga al terminar. `jest.setup.ts` fija
`JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` de prueba antes de correr nada.
