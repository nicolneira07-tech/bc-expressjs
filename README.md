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
| 06 | `week-06` | MongoDB + Mongoose |

---

## Semana 06 — API de inventario con MongoDB y Mongoose

La misma API de inventario, ahora sobre **MongoDB** con **Mongoose**:
esquemas con validación embebida, `populate()` para la relación bodega-ítem,
y traducción de los errores propios de Mongo (`11000`, `CastError`) a
respuestas HTTP correctas.

Todo lo de la semana 04 sigue en pie (validación Zod, `AppError`,
`errorHandler` de 4 parámetros, Winston + Morgan). Lo que cambió es **la capa
de acceso a datos y el service** — el controller y las rutas no se tocaron.
La diferencia frente a la semana 05 es que MongoDB no tiene claves foráneas:
la regla "no crear un ítem en una bodega inexistente" y "no borrar una
bodega con ítems" ya no las impone la base de datos — las impone el service.

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

### Cómo correr el proyecto

```bash
docker compose up -d                  # 1. MongoDB 7 en localhost:27017
pnpm install                          # 2. dependencias
cp .env.example .env                  # 3. variables de entorno
pnpm db:seed                          # 4. 2 bodegas + 6 ítems
pnpm dev                              # 5. servidor en localhost:3000
```

Otro script: `pnpm build` (compila a `dist/`), `pnpm start` (corre el build).

Variables de entorno (`.env.example`):

| Variable | Valor por defecto | Uso |
|---|---|---|
| `MONGODB_URI` | `mongodb://bootcamp:bootcamp123@localhost:27017/bootcamp_dev?authSource=admin` | Conexión a MongoDB |
| `PORT` | `3000` | Puerto del servidor |
| `NODE_ENV` | `development` | Nivel/formato de logs, exposición del `stack` |

> Las credenciales de `docker-compose.yml` son de desarrollo local y coinciden
> con el starter del bootcamp. El `.env` real está en `.gitignore`.

### Probar con curl

Los `_id` de MongoDB son `ObjectId` generados al insertar (no correlativos
como el `id` autoincremental de PostgreSQL), así que primero se resuelve el
id real con un `GET`:

```bash
WH_BOG=$(curl -s http://localhost:3000/api/v1/warehouses | jq -r '.data[] | select(.code=="BOG-01") | .id')

curl -i "http://localhost:3000/api/v1/inventory-items?page=1&limit=2"
curl -i http://localhost:3000/api/v1/warehouses

# Crear (201)
curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d "{\"sku\":\"ELE-0002\",\"name\":\"Montacargas electrico\",\"category\":\"electronics\",\"price\":15000,\"stock\":2,\"location\":\"F-01\",\"warehouse\":\"$WH_BOG\"}"

# sku duplicado → 409 (11000)
curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d "{\"sku\":\"PKG-0001\",\"name\":\"Pallet duplicado\",\"category\":\"packaging\",\"price\":9,\"stock\":10,\"location\":\"A-02\",\"warehouse\":\"$WH_BOG\"}"

# id que no es un ObjectId → 400
curl -i http://localhost:3000/api/v1/inventory-items/abc

# ObjectId válido pero inexistente → 404
curl -i -X PUT http://localhost:3000/api/v1/inventory-items/64b000000000000000000000 \
  -H "Content-Type: application/json" -d '{"stock":1}'
curl -i -X DELETE http://localhost:3000/api/v1/inventory-items/64b000000000000000000000
```

> **En PowerShell**, `curl` es un alias de `Invoke-WebRequest` y además rompe
> las comillas del JSON. Usa `curl.exe` y pasa el body desde un archivo:
> `curl.exe -i -X POST ... --data-binary "@body.json"`.

Salida completa de cada petición, del seed y de los logs:
[`docs/capturas/`](docs/capturas/).
