# bc-expressjs — Entregas

Repositorio de entregas semanales del bootcamp [bc-expressjs](https://github.com/ergrato-dev/bc-expressjs) (SENA).

**Dominio asignado:** Logística / Almacén

Cada semana se entrega en su propia rama `week-<NN>`.

| Semana | Rama | Tema |
|---|---|---|
| 01 | [`week-01`](https://github.com/nicolneira07-tech/bc-expressjs-entrega/tree/week-01) | Node.js Fundamentals |
| 02 | [`week-02`](https://github.com/nicolneira07-tech/bc-expressjs-entrega/tree/week-02) | Express Intro |
| 03 | [`week-03`](https://github.com/nicolneira07-tech/bc-expressjs-entrega/tree/week-03) | REST API Arquitectura en Capas |
| 04 | `week-04` | Validación, Errores y Logging |

---

## Semana 04 — Validación con Zod, errores estructurados y logging

Misma API de inventario de almacén de la semana 03 (mismo dominio, mismo
recurso, misma arquitectura en 4 capas), ahora con:

- **Validación de entrada con Zod** — schemas de creación y actualización, tipos
  inferidos con `z.infer<>`, validación del parámetro `:id`.
- **Errores estructurados** — clase `AppError`, middleware `notFound` y un
  `errorHandler` global de 4 parámetros que distingue `ZodError` (400),
  `AppError` (su propio status) y errores no controlados (500).
- **Logging profesional** — Winston (`info`/`http`/`warn`/`error`) + Morgan
  redirigido a Winston. Ya no queda ningún `console.log` en el proyecto.

### Recurso: `InventoryItem`

| Campo | Tipo | Validación (Zod) |
|---|---|---|
| `id` | `number` | Autogenerado. En la URL: `z.coerce.number().int().positive()` |
| `name` | `string` | Obligatorio, `trim()`, entre 3 y 100 caracteres |
| `category` | `enum` | Una de: `packaging`, `electronics`, `spare-parts`, `safety-equipment`, `raw-materials` |
| `price` | `number` | Obligatorio, `.positive()` (mayor a 0) |
| `stock` | `number` | Entero, `.nonnegative()`, `.default(0)` |
| `location` | `string` | Obligatorio, formato `PASILLO-ESTANTE` — regex `^[A-Z]-\d{2}$` (ej. `A-01`) |
| `active` | `boolean` | `.default(true)` |
| `createdAt` | `Date` | Autogenerado por el repository |

El schema de actualización es `createInventoryItemSchema.partial()` — reutiliza
las mismas reglas sin duplicarlas.

### Arquitectura

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Routes | `src/routes/inventory-items.routes.ts` | Mapea URL + método → función del controller |
| Controllers | `src/controllers/inventory-items.controller.ts` | Valida con `safeParse`, llama al service, responde. Sin lógica de negocio |
| Services | `src/services/inventory-items.service.ts` | Paginación y reglas de negocio. Lanza `AppError`. Cero imports de Express |
| Repositories | `src/repositories/inventory-items.repository.ts` | Único acceso al store en memoria, siempre `async`, copias defensivas |
| Schemas | `src/schemas/inventory-item.schema.ts` | Schemas Zod + tipos inferidos (única fuente de verdad) |
| Errors | `src/errors/AppError.ts` | Errores operacionales con `statusCode` e `isOperational` |
| Middlewares | `src/middlewares/notFound.ts`, `errorHandler.ts` | 404 de ruta y manejo global de errores (4 parámetros) |
| Config | `src/config/logger.ts` | Winston + stream de Morgan |

### Endpoints y contratos

| Método | Ruta | Descripción | Status |
|---|---|---|---|
| GET | `/api/v1/inventory-items?page&limit` | Listar paginado | 200 |
| GET | `/api/v1/inventory-items/:id` | Obtener por ID | 200 / 400 / 404 |
| POST | `/api/v1/inventory-items` | Crear (validado con Zod) | 201 / 400 / 409 |
| PUT | `/api/v1/inventory-items/:id` | Actualizar parcialmente | 200 / 400 / 404 / 409 |
| DELETE | `/api/v1/inventory-items/:id` | Eliminar | 204 / 400 / 404 |
| GET | `/health` | Health check | 200 |

```jsonc
// GET /inventory-items?page=1&limit=2 → 200
{ "data": [ /* ... */ ], "total": 5, "page": 1, "limit": 2 }

// GET /inventory-items/1 → 200
{ "data": { "id": 1, "name": "Pallet de cartón corrugado", /* ... */ } }

// POST con body inválido → 400
{
  "error": "Validation Error",
  "message": "Los datos enviados no son válidos",
  "issues": [
    { "field": "name",     "message": "name debe tener al menos 3 caracteres" },
    { "field": "price",    "message": "price debe ser mayor a 0" },
    { "field": "location", "message": "location debe seguir el formato PASILLO-ESTANTE (ej. A-01)" }
  ]
}

// GET /inventory-items/999 → 404
{ "error": "Application Error", "message": "El ítem de inventario 999 no existe" }

// POST con un name que ya existe → 409
{ "error": "Application Error", "message": "Ya existe un ítem de inventario llamado \"Casco de seguridad\"" }

// GET /api/v1/no-existe → 404 (JSON, no HTML)
{ "error": "Application Error", "message": "Ruta GET /api/v1/no-existe no encontrada" }
```

### Manejo de errores

| Tipo de error | Origen | Status | Log |
|---|---|---|---|
| `ZodError` | `safeParse` del body o del `:id` | 400 | `logger.warn` |
| `AppError` | Lanzado por el service o por `notFound` | `err.statusCode` (404, 409) | `logger.warn` |
| `Error` genérico | Bug no controlado | 500 | `logger.error` + stack |

El `stack` solo se incluye en la respuesta cuando `NODE_ENV !== 'production'`.

### Logging

- `logger.info` — arranque del servidor (`server.ts`).
- `logger.http` — cada petición HTTP, vía Morgan → `morganStream`.
- `logger.warn` — errores operacionales (validación, 404, 409).
- `logger.error` — errores no controlados (500), con stack.

Nivel `http` en desarrollo y `warn` en producción. Formato coloreado en
desarrollo, JSON en producción, más un transport de archivo `logs/error.log`
que solo se activa en producción.

### Cómo correr el proyecto

```bash
pnpm install
cp .env.example .env
pnpm dev                              # levanta con recarga en localhost:3000
pnpm build                            # verifica que compila sin errores TypeScript
pnpm start                            # corre el build compilado (dist/server.js)
```

Variables de entorno (`.env.example`):

| Variable | Valor por defecto | Uso |
|---|---|---|
| `PORT` | `3000` | Puerto del servidor |
| `NODE_ENV` | `development` | Controla nivel y formato de logs, y si se expone el `stack` |

### Probar con curl

```bash
curl -i "http://localhost:3000/api/v1/inventory-items?page=1&limit=2"
curl -i http://localhost:3000/api/v1/inventory-items/1

# Crear (201)
curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"name":"Montacargas electrico","category":"electronics","price":15000,"stock":2,"location":"F-01"}'

# Body inválido (400 con issues[])
curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"name":"AB","category":"herramientas","price":-5,"stock":1.5,"location":"pasillo 3"}'

curl -i http://localhost:3000/api/v1/inventory-items/abc     # 400 (id no numérico)
curl -i http://localhost:3000/api/v1/inventory-items/999     # 404
curl -i http://localhost:3000/api/v1/no-existe               # 404 JSON

curl -i -X PUT http://localhost:3000/api/v1/inventory-items/6 \
  -H "Content-Type: application/json" -d '{"stock":1,"location":"F-02"}'

curl -i -X DELETE http://localhost:3000/api/v1/inventory-items/6   # 204 sin body
```

Salida completa de cada petición y de los logs: [`docs/capturas/`](docs/capturas/).
