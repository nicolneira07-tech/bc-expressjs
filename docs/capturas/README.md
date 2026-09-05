# Capturas — Semana 06

Evidencias pedidas por la rúbrica de la semana 06 (MongoDB + Mongoose). Todas
se tomaron contra `http://localhost:3000` con el contenedor de MongoDB
levantado (`docker compose up -d`), la base sembrada y el servidor corriendo.
La salida completa de cada `curl -i` está en el `.txt` correspondiente.

| # | Archivo | Caso | Esperado |
|---|---|---|---|
| 01 | `01-get-all-paginado.txt` | `GET /api/v1/inventory-items?page=1&limit=2` | `200` + paginación + `warehouse` populado |
| 02 | `02-get-by-id-con-relacion.txt` | `GET /api/v1/inventory-items/:id` | `200` + `warehouse` como objeto anidado |
| 03 | `03-post-crear-201.txt` | `POST` con body válido | `201` + ítem creado, `warehouse` ya populado |
| 04 | `04-post-validacion-400.txt` | `POST` con body inválido (7 campos) | `400` + `issues[]` de Zod |
| 05 | `05-post-warehouse-malformado-400.txt` | `POST` con `warehouse` que no es un ObjectId | `400` — id de la secundaria inválido |
| 06 | `06-post-sku-duplicado-409.txt` | `POST` con un `sku` que ya existe | `409` — índice único **11000** traducido |
| 07 | `07-post-bodega-inexistente-404.txt` | `POST` con un `warehouse` bien formado pero que no existe | `404` (regla de negocio del service) |
| 08 | `08-get-id-no-objectid-400.txt` | `GET /api/v1/inventory-items/abc` | `400` — **CastError** traducido |
| 09 | `09-get-inexistente-404.txt` | `GET` con un ObjectId válido que no existe | `404` |
| 10 | `10-put-actualizar-200.txt` | `PUT /api/v1/inventory-items/:id` | `200` + `updatedAt` actualizado |
| 11 | `11-put-inexistente-404.txt` | `PUT` con id inexistente | `404` |
| 12 | `12-delete-204.txt` | `DELETE /api/v1/inventory-items/:id` | `204` sin body |
| 13 | `13-delete-inexistente-404.txt` | `DELETE` con id inexistente | `404` |
| 14 | `14-get-warehouses.txt` | `GET /api/v1/warehouses` | `200` + las 2 bodegas |
| 15 | `15-post-warehouse-code-duplicado-409.txt` | `POST /api/v1/warehouses` con `code` duplicado | `409` — **11000** traducido |
| 16 | `16-delete-warehouse-con-items-409.txt` | `DELETE` de una bodega que todavía tiene ítems | `409` — regla de negocio (sin FK real en Mongo) |
| 17 | `17-ruta-inexistente-404.txt` | `GET /api/v1/no-existe` | `404` JSON, no HTML |
| 18 | `18-health.txt` | `GET /health` | `200` |
| 19 | `19-seed.txt` | `pnpm db:seed` | 2 bodegas + 6 ítems, sin errores |
| 20 | `20-logs-consola.txt` | Salida de consola de `pnpm dev` | `info` de arranque + conexión, `http` de Morgan por cada request |
| 21 | `21-build-y-docker.txt` | `pnpm build` + contenedor Mongo | Sin errores TS; `bootcamp-mongo` `Up` |

> A diferencia de la semana 05 (PostgreSQL con ids autoincrementales), los
> `_id` de MongoDB son `ObjectId` generados al insertar — no son
> predecibles ni reproducibles entre corridas del seed. Por eso el número de
> caso ya no fija qué id concreto usar: cada captura resuelve el id real con
> un `GET` previo (ver el bloque de reproducción abajo), igual que hace
> `capture.sh`.

## Reproducir las capturas

```bash
docker compose up -d              # MongoDB en localhost:27017
pnpm install
cp .env.example .env
pnpm db:seed                      # 19 — 2 bodegas + 6 ítems
pnpm build                        # 21
pnpm dev                          # deja el servidor en otra terminal → 20

# Resuelve los ids reales antes de usarlos en las peticiones:
WH_BOG=$(curl -s http://localhost:3000/api/v1/warehouses | jq -r '.data[] | select(.code=="BOG-01") | .id')
ITEM1=$(curl -s "http://localhost:3000/api/v1/inventory-items?page=1&limit=1" | jq -r '.data[0].id')

curl -i "http://localhost:3000/api/v1/inventory-items?page=1&limit=2"     # 01
curl -i "http://localhost:3000/api/v1/inventory-items/$ITEM1"             # 02

curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d "{\"sku\":\"ELE-0002\",\"name\":\"Montacargas electrico\",\"category\":\"electronics\",\"price\":15000,\"stock\":2,\"location\":\"F-01\",\"warehouse\":\"$WH_BOG\"}"   # 03

curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"sku":"xx","name":"AB","category":"herramientas","price":-5,"stock":1.5,"location":"pasillo 3","warehouse":"abc"}'   # 04

curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"sku":"PKG-0009","name":"Caja plastica apilable","category":"packaging","price":19.9,"stock":40,"location":"A-09","warehouse":"no-es-un-objectid"}'   # 05

# sku duplicado → 11000 → 409
curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d "{\"sku\":\"PKG-0001\",\"name\":\"Pallet duplicado\",\"category\":\"packaging\",\"price\":9,\"stock\":10,\"location\":\"A-02\",\"warehouse\":\"$WH_BOG\"}"   # 06

# ObjectId válido pero de una bodega que no existe → 404
curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"sku":"PKG-0010","name":"Caja plastica apilable","category":"packaging","price":19.9,"stock":40,"location":"A-10","warehouse":"64b000000000000000000000"}'   # 07

curl -i http://localhost:3000/api/v1/inventory-items/abc                          # 08
curl -i http://localhost:3000/api/v1/inventory-items/64b000000000000000000000     # 09

NEWID=$(curl -s "http://localhost:3000/api/v1/inventory-items?limit=10" | jq -r '.data[] | select(.sku=="ELE-0002") | .id')
curl -i -X PUT "http://localhost:3000/api/v1/inventory-items/$NEWID" \
  -H "Content-Type: application/json" -d '{"stock":1,"location":"F-02"}'          # 10
curl -i -X PUT http://localhost:3000/api/v1/inventory-items/64b000000000000000000000 \
  -H "Content-Type: application/json" -d '{"stock":1}'                            # 11

curl -i -X DELETE "http://localhost:3000/api/v1/inventory-items/$NEWID"           # 12
curl -i -X DELETE http://localhost:3000/api/v1/inventory-items/64b000000000000000000000   # 13

curl -i http://localhost:3000/api/v1/warehouses                                   # 14

curl -i -X POST http://localhost:3000/api/v1/warehouses \
  -H "Content-Type: application/json" -d '{"code":"BOG-01","name":"Otra bodega","city":"Bogota"}'   # 15

curl -i -X DELETE "http://localhost:3000/api/v1/warehouses/$WH_BOG"               # 16 (falla con 409: BOG-01 tiene items)

curl -i http://localhost:3000/api/v1/no-existe                                    # 17
curl -i http://localhost:3000/health                                              # 18
```

> **En PowerShell**, `curl` es un alias de `Invoke-WebRequest` y además rompe
> las comillas del JSON. Usa `curl.exe` y pasa el body desde un archivo:
> `curl.exe -i -X POST ... --data-binary "@body.json"`.
