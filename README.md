# bc-expressjs — Entregas

Repositorio de entregas semanales del bootcamp [bc-expressjs](https://github.com/ergrato-dev/bc-expressjs) (SENA).

**Dominio asignado:** Logística / Almacén

Cada semana se entrega en su propia rama `week-<NN>`.

| Semana | Rama | Tema |
|---|---|---|
| 01 | [`week-01`](https://github.com/nicolneira07-tech/bc-expressjs-entrega/tree/week-01) | Node.js Fundamentals |
| 02 | `week-02` | Express Intro |

---

## Semana 02 — API REST de Inventario de Almacén

API CRUD en memoria con Express 5 + TypeScript sobre el mismo dominio de la
semana 01 (Logística / Almacén), ahora expuesto vía HTTP en vez de un CLI.
Sin base de datos todavía — el store vive en un array en memoria
(`src/store.ts`), sembrado con los mismos 12 ítems de
`week-01/data/inventory.json` para tener datos realistas desde el arranque.

### Recurso: `InventoryItem`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Código del ítem en el almacén (ej. `WH-001`), autogenerado al crear |
| `name` | `string` | Nombre del ítem |
| `category` | `string` | `packaging`, `electronics`, `spare-parts`, `safety-equipment`, `raw-materials` |
| `price` | `number` | Costo unitario |
| `stock` | `number` | Cantidad disponible en el almacén |
| `location` | `string` | Ubicación física (pasillo-estante, ej. `A-01`) |
| `active` | `boolean` | Si el ítem sigue activo en el catálogo del almacén |

### Endpoints

| Método | Ruta | Descripción | Status |
|---|---|---|---|
| GET | `/api/v1/inventory-items` | Listar todos los ítems | 200 |
| GET | `/api/v1/inventory-items/:id` | Obtener un ítem por ID | 200 / 404 |
| POST | `/api/v1/inventory-items` | Crear un ítem | 201 / 400 |
| PUT | `/api/v1/inventory-items/:id` | Actualizar un ítem completo | 200 / 400 / 404 |
| DELETE | `/api/v1/inventory-items/:id` | Eliminar un ítem | 204 / 404 |
| GET | `/health` | Health check | 200 |

Middlewares registrados en orden: `express.json()` → logger personalizado
(`src/middlewares/logger.ts`) → rutas → handler 404 → error handler global
de 4 parámetros (`src/middlewares/errorHandler.ts`). POST y PUT validan que
los campos requeridos estén presentes y con el tipo correcto antes de tocar
el store.

### Cómo correr el proyecto

```bash
pnpm install
cp .env.example .env
pnpm dev                              # levanta con recarga en localhost:3000
pnpm build                            # verifica que compila sin errores TypeScript
pnpm start                            # corre el build compilado (dist/server.js)
```

### Probar con curl

```bash
curl http://localhost:3000/api/v1/inventory-items
curl http://localhost:3000/api/v1/inventory-items/WH-001

curl -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"name":"Montacargas eléctrico","category":"electronics","price":15000,"stock":2,"location":"F-01","active":true}'

curl -X PUT http://localhost:3000/api/v1/inventory-items/WH-013 \
  -H "Content-Type: application/json" \
  -d '{"name":"Montacargas eléctrico","category":"electronics","price":15500,"stock":3,"location":"F-01","active":true}'

curl -X DELETE http://localhost:3000/api/v1/inventory-items/WH-013
# Esperar: 204 sin body
```

Capturas de las distintas peticiones: [`docs/capturas/`](docs/capturas/).
