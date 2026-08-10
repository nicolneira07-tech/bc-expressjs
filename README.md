# bc-expressjs — Entregas

Repositorio de entregas semanales del bootcamp [bc-expressjs](https://github.com/ergrato-dev/bc-expressjs) (SENA).

**Dominio asignado:** Logística / Almacén

Cada semana se entrega en su propia rama `week-<NN>`.

| Semana | Rama | Tema |
|---|---|---|
| 01 | [`week-01`](https://github.com/nicolneira07-tech/bc-expressjs-entrega/tree/week-01) | Node.js Fundamentals |
| 02 | [`week-02`](https://github.com/nicolneira07-tech/bc-expressjs-entrega/tree/week-02) | Express Intro |
| 03 | [`week-03`](https://github.com/nicolneira07-tech/bc-expressjs-entrega/tree/week-03) | REST API Arquitectura en Capas |
| 04 | [`week-04`](https://github.com/nicolneira07-tech/bc-expressjs-entrega/tree/week-04) | Validación, Errores y Logging |
| 05 | `week-05` | PostgreSQL + Prisma ORM |

---

## Semana 05 — API de inventario con PostgreSQL y Prisma ORM

La API de la semana 04 migrada del array en memoria a **PostgreSQL** con
**Prisma ORM**: migraciones versionadas, seed idempotente, relación 1:N y
traducción de los errores de Prisma a respuestas HTTP correctas.

Todo lo de la semana 04 sigue en pie (validación Zod, `AppError`, `errorHandler`
de 4 parámetros, Winston + Morgan). Lo que cambió es **solo la capa de
repositorio** — el controller y las rutas no se tocaron. Esa es exactamente la
ventaja que compra la arquitectura en capas.

### Modelo de datos

```
┌─────────────────────┐              ┌──────────────────────────┐
│ Warehouse (bodega)  │ 1          N │ InventoryItem (ítem)     │
├─────────────────────┤──────────────├──────────────────────────┤
│ id        Int  PK   │              │ id          Int  PK      │
│ code      String UQ │◄─────────────│ warehouseId Int  FK      │
│ name      String    │              │ sku         String UQ    │
│ city      String    │              │ name        String       │
│ active    Boolean   │              │ category    String       │
│ createdAt DateTime  │              │ price       Decimal(12,2)│
│ updatedAt DateTime  │              │ stock       Int          │
└─────────────────────┘              │ location    String       │
                                     │ active      Boolean      │
     tabla: warehouses               │ createdAt   DateTime     │
                                     │ updatedAt   DateTime     │
                                     └──────────────────────────┘
                                       tabla: inventory_items
```

Una **bodega** (centro de distribución de la empresa de logística) almacena
muchos **ítems de inventario**. Cada ítem pertenece a exactamente una bodega, y
su `location` (`A-01`) es la posición del estante dentro de esa bodega.

Los dos campos `@unique` (`warehouses.code` e `inventory_items.sku`) son los que
disparan el error `P2002` de Prisma cuando se intenta duplicar un valor.

### Campos y validaciones

**`InventoryItem`** (recurso principal)

| Campo | Tipo Prisma | Validación de entrada (Zod) |
|---|---|---|
| `id` | `Int @id @default(autoincrement())` | En la URL: `z.coerce.number().int().positive()` |
| `sku` | `String @unique` | Formato `AAA-0000` (ej. `PKG-0001`) |
| `name` | `String` | `trim()`, entre 3 y 100 caracteres |
| `category` | `String` | `z.enum` con las 5 categorías del almacén |
| `price` | `Decimal @db.Decimal(12,2)` | `.positive()` |
| `stock` | `Int @default(0)` | Entero, `.nonnegative()`, `.default(0)` |
| `location` | `String` | Regex `^[A-Z]-\d{2}$` (ej. `A-01`) |
| `active` | `Boolean @default(true)` | `.default(true)` |
| `warehouseId` | `Int` (FK) | Entero positivo; el service verifica que la bodega exista |
| `createdAt` / `updatedAt` | `DateTime` | Los gestiona Prisma |

**`Warehouse`** (recurso secundario)

| Campo | Tipo Prisma | Validación de entrada (Zod) |
|---|---|---|
| `code` | `String @unique` | Formato `AAA-00` (ej. `BOG-01`) |
| `name` | `String` | Entre 3 y 100 caracteres |
| `city` | `String` | Mínimo 3 caracteres |
| `active` | `Boolean @default(true)` | `.default(true)` |

### Endpoints

**Ítems de inventario** — `/api/v1/inventory-items`

| Método | Ruta | Descripción | Status |
|---|---|---|---|
| GET | `/?page&limit` | Listado paginado, con la bodega incluida | 200 / 400 |
| GET | `/:id` | Detalle con la bodega incluida | 200 / 400 / 404 |
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
| DELETE | `/:id` | Eliminar | 204 / 400 / 404 / 409 |

Más `GET /health` → 200.

```jsonc
// GET /api/v1/inventory-items?page=1&limit=2 → 200
{
  "data": [
    {
      "id": 1,
      "sku": "PKG-0001",
      "name": "Pallet de cartón corrugado",
      "category": "packaging",
      "price": 8.5,
      "stock": 500,
      "location": "A-01",
      "active": true,
      "warehouseId": 1,
      "warehouse": {
        "id": 1,
        "code": "BOG-01",
        "name": "Centro de distribución Bogotá",
        "city": "Bogotá",
        "active": true,
        "createdAt": "2026-08-09T23:32:11.943Z",
        "updatedAt": "2026-08-09T23:32:11.943Z"
      },
      "createdAt": "2026-08-09T23:32:11.953Z",
      "updatedAt": "2026-08-09T23:32:11.953Z"
    }
    // ...
  ],
  "total": 6,
  "page": 1,
  "limit": 2
}

// POST con un sku que ya existe → 409 (P2002)
{ "error": "Application Error", "message": "Ya existe un ítem de inventario con el sku \"PKG-0001\"" }

// PUT /api/v1/inventory-items/999 → 404 (P2025)
{ "error": "Application Error", "message": "El ítem de inventario 999 no existe" }

// POST con warehouseId: 999 → 404 (regla de negocio del service)
{ "error": "Application Error", "message": "La bodega 999 no existe" }
```

### Errores de Prisma traducidos

El repository es el único lugar que conoce los códigos de Prisma; los convierte
a `AppError` y a partir de ahí todo sigue el camino normal hacia el
`errorHandler`.

| Código Prisma | Significado | Respuesta |
|---|---|---|
| `P2002` | Violación de restricción `@unique` | `409` — "Ya existe un ítem con el sku ..." |
| `P2003` | Clave foránea inválida | `400` — "La bodega indicada en warehouseId no existe" |
| `P2025` | El registro a actualizar/eliminar no existe | `404` — "El ítem de inventario N no existe" |

### Cómo correr el proyecto

```bash
docker compose up -d                  # 1. PostgreSQL 16 en localhost:5432
pnpm install                          # 2. dependencias (+ prisma generate)
cp .env.example .env                  # 3. variables de entorno
pnpm db:migrate                       # 4. aplica prisma/migrations/
pnpm db:seed                          # 5. 2 bodegas + 6 ítems
pnpm dev                              # 6. servidor en localhost:3000
```

Otros scripts: `pnpm build` (compila a `dist/`), `pnpm start` (corre el build),
`pnpm db:studio` (explorador visual de la base en el navegador).

Variables de entorno (`.env.example`):

| Variable | Valor por defecto | Uso |
|---|---|---|
| `DATABASE_URL` | `postgresql://bootcamp:bootcamp123@localhost:5432/bootcamp_dev` | Conexión a PostgreSQL |
| `PORT` | `3000` | Puerto del servidor |
| `NODE_ENV` | `development` | Nivel/formato de logs, log de queries de Prisma, exposición del `stack` |

> Las credenciales de `docker-compose.yml` son de desarrollo local y coinciden
> con el starter del bootcamp. El `.env` real está en `.gitignore`.

### Probar con curl

```bash
curl -i "http://localhost:3000/api/v1/inventory-items?page=1&limit=2"
curl -i http://localhost:3000/api/v1/inventory-items/1
curl -i http://localhost:3000/api/v1/warehouses

# Crear (201)
curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"sku":"ELE-0002","name":"Montacargas electrico","category":"electronics","price":15000,"stock":2,"location":"F-01","warehouseId":1}'

# sku duplicado → 409 (P2002)
curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"sku":"PKG-0001","name":"Pallet duplicado","category":"packaging","price":9,"stock":10,"location":"A-02","warehouseId":1}'

# actualizar / eliminar un id inexistente → 404 (P2025)
curl -i -X PUT http://localhost:3000/api/v1/inventory-items/999 \
  -H "Content-Type: application/json" -d '{"stock":1}'
curl -i -X DELETE http://localhost:3000/api/v1/inventory-items/999
```

Salida completa de cada petición, del seed y de los logs:
[`docs/capturas/`](docs/capturas/).
