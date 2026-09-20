# bc-expressjs — Entregas

Repositorio de entregas semanales del bootcamp [bc-expressjs](https://github.com/ergrato-dev/bc-expressjs) (SENA).

**Dominio asignado:** Logística / Almacén

Cada semana se entrega en su propia rama `week-<NN>`.

| Semana | Rama | Tema |
|---|---|---|
| 01 | [`week-01`](https://github.com/nicolneira07-tech/bc-expressjs/tree/week-01) | Node.js Fundamentals |
| 02 | [`week-02`](https://github.com/nicolneira07-tech/bc-expressjs/tree/week-02) | Express Intro |
| 03 | [`week-03`](https://github.com/nicolneira07-tech/bc-expressjs/tree/week-03) | REST API Arquitectura en Capas |
| 04 | [`week-04`](https://github.com/nicolneira07-tech/bc-expressjs/tree/week-04) | Validación, Errores y Logging |
| 05 | [`week-05`](https://github.com/nicolneira07-tech/bc-expressjs/tree/week-05) | PostgreSQL + Prisma ORM |
| 06 | [`week-06`](https://github.com/nicolneira07-tech/bc-expressjs/tree/week-06) | MongoDB + Mongoose |
| 07 | `week-07` | Autenticación JWT |

---

## Semana 07 — Autenticación JWT sobre la API de inventario

Se agrega un tercer recurso, `User` (empleados de la empresa de logística),
con registro, login y sesiones basadas en **JWT + cookies HttpOnly**. Todo lo
de la semana 06 sigue intacto (`Warehouse`, `InventoryItem`, Mongoose,
Winston/Morgan) — lo único que cambia es que **ya no se puede usar la API sin
haber iniciado sesión**: `warehousesRouter` e `inventoryItemsRouter` ganan un
`router.use(authMiddleware)` al principio.

### Por qué JWT + cookies HttpOnly (y no `localStorage`)

Un token en `localStorage` es legible por cualquier script que corra en la
página — un XSS lo roba con una línea de JavaScript. Una cookie `HttpOnly` no
la puede leer `document.cookie`; el navegador la adjunta solo. Dos tokens,
cada uno con su propio secreto y su propio ciclo de vida:

| Token | Duración | Dónde vive | Se manda en |
|---|---|---|---|
| `accessToken` | 15 min | Cookie `HttpOnly`, `Path=/` | Todas las peticiones a la API |
| `refreshToken` | 7 días | Cookie `HttpOnly`, `Path=/api/v1/auth` | Solo `/auth/refresh` y `/auth/logout` |

El `refreshToken` nunca se guarda en claro en la base: se guarda su
**hash** (`User.refreshToken`), y cada `/refresh` genera un par nuevo e
invalida el anterior (rotación) — si alguien roba un refresh token viejo, ya
no sirve.

### Endpoints — Auth (`/api/v1/auth`)

| Método | Ruta | Descripción | Auth | Status |
|---|---|---|---|---|
| POST | `/register` | Crear cuenta (rol `operator` fijo) | Pública | 201 / 400 / 409 |
| POST | `/login` | Emite `accessToken` + `refreshToken` en cookies | Pública | 200 / 401 |
| GET | `/me` | Perfil del usuario autenticado | Cookie `accessToken` | 200 / 401 |
| POST | `/refresh` | Rota el par de tokens | Cookie `refreshToken` | 200 / 401 |
| POST | `/logout` | Invalida la sesión y limpia las cookies | Cookie `accessToken` | 200 / 401 |

`warehouses` e `inventory-items` (ver tablas de la semana 06 más abajo) ahora
requieren la cookie `accessToken` en **todas** sus rutas — sin sesión, `401`.

```jsonc
// POST /api/v1/auth/register → 201 (nunca devuelve el password/hash)
{ "data": { "id": "...", "email": "nuevo.operador@almacen.com", "name": "Nuevo Operador", "role": "operator", "createdAt": "...", "updatedAt": "..." } }

// POST /api/v1/auth/login → 200 + Set-Cookie: accessToken=...; HttpOnly; SameSite=Lax
//                                Set-Cookie: refreshToken=...; Path=/api/v1/auth; HttpOnly; SameSite=Lax
{ "message": "Login exitoso" }

// GET /api/v1/inventory-items sin cookie → 401
{ "error": "Application Error", "message": "No autenticado: falta el token de acceso" }

// POST /api/v1/auth/refresh reusando un refresh token ya rotado → 401
{ "error": "Application Error", "message": "Refresh token no coincide con la sesión activa" }
```

### Usuarios de prueba (creados por `pnpm db:seed`)

| Email | Password | Rol |
|---|---|---|
| `operador@almacen.com` | `Operador123` | `operator` |
| `admin@almacen.com` | `Admin1234` | `admin` (aún sin uso — llega en la semana 08 con RBAC) |

### Seguridad aplicada

- Passwords con `bcrypt` (10 salt rounds); nunca se devuelven (`select: false`
  en el modelo).
- `JWT_ACCESS_SECRET` ≠ `JWT_REFRESH_SECRET` — secretos independientes.
- El registro público **no acepta `role`** en el body: si lo aceptara,
  cualquiera podría auto-asignarse `admin`. Todo el que se registra entra
  como `operator`.
- Mismo mensaje de error para "email no existe" y "password incorrecto" en
  login — evita user enumeration.
- Refresh token: se guarda su hash (no el token en claro) y rota en cada uso;
  reusar uno viejo invalida la sesión completa (posible token robado).

### Cómo correr el proyecto

```bash
docker compose up -d                  # 1. MongoDB 7 en localhost:27017
pnpm install                          # 2. dependencias
cp .env.example .env                  # 3. variables de entorno + genera los dos JWT secrets
pnpm db:seed                          # 4. 2 usuarios + 2 bodegas + 6 ítems
pnpm dev                              # 5. servidor en localhost:3000
```

Variables nuevas en `.env.example`: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
— generar cada una con `openssl rand -base64 64`, deben ser distintas.

Flujo completo probado con `curl` (login → cookie → recurso protegido →
refresh con rotación → logout): [`docs/capturas/`](docs/capturas/).

---

## Bodegas e ítems de inventario (desde la semana 06, sin cambios de negocio)

La API de inventario sobre **MongoDB** con **Mongoose**: esquemas con
validación embebida, `populate()` para la relación bodega-ítem, y traducción
de los errores propios de Mongo (`11000`, `CastError`) a respuestas HTTP
correctas. La única diferencia introducida en la semana 07 es que ahora
**requieren sesión** (ver arriba) — el modelo, las validaciones y las reglas
de negocio de estos dos recursos no cambiaron.

### Modelo de datos

```
┌──────────────────────┐              ┌───────────────────────────┐
│ Warehouse (bodega)   │ 1          N │ InventoryItem (ítem)      │
├──────────────────────┤──────────────├───────────────────────────┤
│ _id       ObjectId   │              │ _id       ObjectId        │
│ code      String UQ  │◄─────────────│ warehouse ObjectId (ref)  │
│ name      String     │              │ sku       String UQ       │
│ city      String     │              │ name      String          │
│ active    Boolean    │              │ category  String          │
│ createdAt Date       │              │ price     Number          │
│ updatedAt Date       │              │ stock     Number          │
└──────────────────────┘              │ location  String          │
                                      │ active    Boolean         │
     colección: warehouses            │ createdAt Date            │
                                      │ updatedAt Date            │
                                      └───────────────────────────┘
                                        colección: inventoryitems
```

Una **bodega** (centro de distribución de la empresa de logística) almacena
muchos **ítems de inventario**. Cada ítem referencia a su bodega vía
`warehouse` (`ObjectId`), y `populate('warehouse')` lo resuelve al objeto
completo. Su `location` (`A-01`) es la posición del estante dentro de esa
bodega.

Los dos índices `unique` (`warehouses.code` e `inventoryitems.sku`) son los
que disparan el error `11000` de MongoDB cuando se intenta duplicar un valor.

### Campos y validaciones

**`InventoryItem`** (recurso principal)

| Campo | Tipo Mongoose | Validación de entrada (Zod) |
|---|---|---|
| `_id` | `ObjectId` (autogenerado) | En la URL: 24 caracteres hexadecimales |
| `sku` | `String, unique` | Formato `AAA-0000` (ej. `PKG-0001`) |
| `name` | `String` | `trim()`, entre 3 y 100 caracteres |
| `category` | `String` | `z.enum` con las 5 categorías del almacén |
| `price` | `Number, min: 0.01` | `.positive()` |
| `stock` | `Number, min: 0, default: 0` | Entero, `.nonnegative()`, `.default(0)` |
| `location` | `String, match` | Regex `^[A-Z]-\d{2}$` (ej. `A-01`) |
| `active` | `Boolean, default: true` | `.default(true)` |
| `warehouse` | `ObjectId, ref: 'Warehouse'` | 24 hex; el service verifica que la bodega exista |
| `createdAt` / `updatedAt` | `Date` (`timestamps: true`) | Los gestiona Mongoose |

**`Warehouse`** (recurso secundario)

| Campo | Tipo Mongoose | Validación de entrada (Zod) |
|---|---|---|
| `code` | `String, unique` | Formato `AAA-00` (ej. `BOG-01`) |
| `name` | `String` | Entre 3 y 100 caracteres |
| `city` | `String` | Mínimo 3 caracteres |
| `active` | `Boolean, default: true` | `.default(true)` |

### Endpoints

**Ítems de inventario** — `/api/v1/inventory-items`

| Método | Ruta | Descripción | Status |
|---|---|---|---|
| GET | `/?page&limit` | Listado paginado, con la bodega populada | 200 / 400 |
| GET | `/:id` | Detalle con la bodega populada | 200 / 400 / 404 |
| POST | `/` | Crear | 201 / 400 / 404 / 409 |
| PUT | `/:id` | Actualizar parcialmente | 200 / 400 / 404 / 409 |
| DELETE | `/:id` | Eliminar | 204 / 400 / 404 |

**Bodegas** — `/api/v1/warehouses`

| Método | Ruta | Descripción | Status |
|---|---|---|---|
| GET | `/` | Listar todas | 200 |
| GET | `/:id` | Obtener por id | 200 / 400 / 404 |
| POST | `/` | Crear | 201 / 400 / 409 |
| PUT | `/:id` | Actualizar | 200 / 400 / 404 / 409 |
| DELETE | `/:id` | Eliminar (409 si aún tiene ítems) | 204 / 400 / 404 / 409 |

Más `GET /health` → 200.

```jsonc
// GET /api/v1/inventory-items?page=1&limit=2 → 200
{
  "data": [
    {
      "id": "6a9c9150d5b626d6d654ba24",
      "sku": "PKG-0001",
      "name": "Pallet de cartón corrugado",
      "category": "packaging",
      "price": 8.5,
      "stock": 500,
      "location": "A-01",
      "active": true,
      "warehouse": {
        "id": "6a9c9150d5b626d6d654ba22",
        "code": "BOG-01",
        "name": "Centro de distribución Bogotá",
        "city": "Bogotá",
        "active": true,
        "createdAt": "2026-09-05T22:01:52.622Z",
        "updatedAt": "2026-09-05T22:01:52.622Z"
      },
      "createdAt": "2026-09-05T22:01:52.634Z",
      "updatedAt": "2026-09-05T22:01:52.634Z"
    }
    // ...
  ],
  "total": 6,
  "page": 1,
  "limit": 2
}

// POST con un sku que ya existe → 409 (índice único 11000)
{ "error": "Application Error", "message": "Ya existe un ítem de inventario con el sku \"PKG-0001\"" }

// GET /api/v1/inventory-items/abc → 400 (CastError, no es un ObjectId)
{ "error": "Application Error", "message": "\"abc\" no es un ObjectId válido" }

// POST con warehouse bien formado pero inexistente → 404 (regla de negocio del service)
{ "error": "Application Error", "message": "La bodega 64b000000000000000000000 no existe" }

// DELETE de una bodega con ítems asociados → 409 (regla de negocio, sin FK real)
{ "error": "Application Error", "message": "No se puede eliminar la bodega: todavía tiene ítems de inventario asociados" }
```

### Errores de Mongo/Mongoose traducidos

El repository es el único lugar que conoce los errores de Mongo; los
convierte a `AppError` y a partir de ahí todo sigue el camino normal hacia el
`errorHandler`. Las reglas que en PostgreSQL resolvía una restricción `FK`
(P2003) las verifica ahora el **service**, porque MongoDB no las tiene:

| Origen | Cuándo | Respuesta |
|---|---|---|
| `11000` (índice único) | `sku` o `code` duplicado | `409` — "Ya existe ... con el sku/código ..." |
| `CastError` | El `:id` de la URL no es un `ObjectId` válido | `400` — "... no es un ObjectId válido" |
| `null` devuelto por `findByIdAndUpdate`/`findByIdAndDelete` | El registro no existe | `404` |
| Regla de negocio (`assertWarehouseExists`) | `warehouse` no existe (aunque el ObjectId sea válido) | `404` |
| Regla de negocio (`countByWarehouse`) | Se intenta borrar una bodega con ítems | `409` |

> Todas las peticiones de ejemplo de esta sección ahora necesitan la cookie
> `accessToken` (ver "Cómo correr el proyecto" y `docs/capturas/` arriba) —
> sin ella, cualquiera de estas rutas responde `401`.
