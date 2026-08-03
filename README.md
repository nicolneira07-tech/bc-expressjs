# bc-expressjs — Entregas

Repositorio de entregas semanales del bootcamp [bc-expressjs](https://github.com/ergrato-dev/bc-expressjs) (SENA).

**Dominio asignado:** Logística / Almacén

Cada semana se entrega en su propia rama `week-<NN>`.

| Semana | Rama | Tema |
|---|---|---|
| 01 | [`week-01`](https://github.com/nicolneira07-tech/bc-expressjs-entrega/tree/week-01) | Node.js Fundamentals |
| 02 | [`week-02`](https://github.com/nicolneira07-tech/bc-expressjs-entrega/tree/week-02) | Express Intro |
| 03 | `week-03` | REST API Arquitectura en Capas |

---

## Semana 03 — API REST de Inventario de Almacén (arquitectura en capas)

Misma API de la semana 02 (mismo dominio, mismo recurso), refactorizada a
una arquitectura de 4 capas: `routes → controllers → services →
repositories`. Sin base de datos todavía — el repository guarda los datos en
un array en memoria, sembrado con 5 ítems del inventario del dominio.

### Recurso: `InventoryItem`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `number` | Identificador autoincremental |
| `name` | `string` | Nombre del ítem |
| `category` | `string` | `packaging`, `electronics`, `spare-parts`, `safety-equipment`, `raw-materials` |
| `price` | `number` | Costo unitario |
| `stock` | `number` | Cantidad disponible en el almacén |
| `location` | `string` | Ubicación física (pasillo-estante, ej. `A-01`) |
| `active` | `boolean` | Si el ítem sigue activo en el catálogo del almacén |
| `createdAt` | `string` | Fecha ISO de creación, autogenerada |

### Arquitectura

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Routes | `src/routes/inventory-items.routes.ts` | Solo mapea URL + método → función del controller |
| Controllers | `src/controllers/inventory-items.controller.ts` | 3 pasos: extraer → llamar service → responder. Sin lógica de negocio |
| Services | `src/services/inventory-items.service.ts` | Lógica de negocio y paginación. Cero imports de Express |
| Repositories | `src/repositories/inventory-items.repository.ts` | Único punto de acceso al store, siempre `async`, retorna copias defensivas |

### Endpoints y contratos

| Método | Ruta | Descripción | Status |
|---|---|---|---|
| GET | `/api/v1/inventory-items?page&limit` | Listar paginado | 200 |
| GET | `/api/v1/inventory-items/:id` | Obtener por ID | 200 / 404 |
| POST | `/api/v1/inventory-items` | Crear | 201 |
| PUT | `/api/v1/inventory-items/:id` | Actualizar | 200 / 404 |
| DELETE | `/api/v1/inventory-items/:id` | Eliminar | 204 / 404 |
| GET | `/health` | Health check | 200 |

```jsonc
// GET /inventory-items?page=1&limit=5 → 200
{ "data": [ /* ... */ ], "total": 5, "page": 1, "limit": 5 }

// GET /inventory-items/1 → 200
{ "data": { "id": 1, /* ... */ } }

// GET /inventory-items/999 → 404
{ "error": "Not Found", "message": "Item 999 not found" }
```

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
curl "http://localhost:3000/api/v1/inventory-items?page=1&limit=2"
curl http://localhost:3000/api/v1/inventory-items/1

curl -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"name":"Montacargas eléctrico","category":"electronics","price":15000,"stock":2,"location":"F-01","active":true}'

curl -X PUT http://localhost:3000/api/v1/inventory-items/6 \
  -H "Content-Type: application/json" \
  -d '{"stock":1}'

curl -X DELETE http://localhost:3000/api/v1/inventory-items/6
# Esperar: 204 sin body
```

Capturas de las distintas peticiones: [`docs/capturas/`](docs/capturas/).
