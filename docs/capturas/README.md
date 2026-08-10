# Capturas — Semana 05

Evidencias pedidas por la rúbrica de la semana 05 (PostgreSQL + Prisma ORM).
Todas se tomaron contra `http://localhost:3000` con el contenedor de PostgreSQL
levantado (`docker compose up -d`), la base migrada y sembrada, y el servidor
corriendo. La salida completa de cada `curl -i` está en el `.txt`
correspondiente.

| # | Archivo | Caso | Esperado |
|---|---|---|---|
| 01 | `01-get-all-paginado.txt` | `GET /api/v1/inventory-items?page=1&limit=2` | `200` + paginación + `warehouse` incluido |
| 02 | `02-get-by-id-con-relacion.txt` | `GET /api/v1/inventory-items/1` | `200` + `warehouse` como objeto anidado |
| 03 | `03-post-crear-201.txt` | `POST` con body válido | `201` + ítem creado |
| 04 | `04-post-validacion-400.txt` | `POST` con body inválido | `400` + `issues[]` (7 campos) |
| 05 | `05-post-sku-duplicado-409.txt` | `POST` con un `sku` que ya existe | `409` — **P2002** traducido |
| 06 | `06-post-bodega-inexistente-404.txt` | `POST` con `warehouseId: 999` | `404` (regla de negocio del service) |
| 07 | `07-get-id-no-numerico-400.txt` | `GET /api/v1/inventory-items/abc` | `400` |
| 08 | `08-get-inexistente-404.txt` | `GET /api/v1/inventory-items/999` | `404` |
| 09 | `09-put-actualizar-200.txt` | `PUT /api/v1/inventory-items/7` | `200` + `updatedAt` actualizado |
| 10 | `10-put-inexistente-404.txt` | `PUT /api/v1/inventory-items/999` | `404` — **P2025** traducido |
| 11 | `11-delete-204.txt` | `DELETE /api/v1/inventory-items/7` | `204` sin body |
| 12 | `12-delete-inexistente-404.txt` | `DELETE /api/v1/inventory-items/999` | `404` — **P2025** traducido |
| 13 | `13-get-warehouses.txt` | `GET /api/v1/warehouses` | `200` + las 2 bodegas |
| 14 | `14-seed.txt` | `pnpm db:seed` | 2 bodegas + 6 ítems, sin errores |
| 15 | `15-ruta-inexistente-404.txt` | `GET /api/v1/no-existe` | `404` JSON, no HTML |
| 16 | `16-health.txt` | `GET /health` | `200` |
| 17 | `17-logs-consola.txt` | Salida de consola | `info` de arranque + conexión, `http` de Morgan, `warn` por error, y el **log de queries SQL de Prisma** |
| 18 | `18-build-y-migraciones.txt` | `pnpm build` + `prisma migrate status` | Sin errores TS; 1 migración aplicada |

> Los `.txt` son el log literal de la terminal. La rúbrica acepta
> "screenshots **o logs**"; si prefieres imágenes, repite cada petición en
> Postman/Thunder Client y guarda el PNG con el mismo nombre.

## Ids de las capturas

El seed hace `TRUNCATE ... RESTART IDENTITY`, así que después de `pnpm db:seed`
los ids son siempre los mismos: bodegas `1` (BOG-01) y `2` (MED-01), ítems `1`
a `6`. El `POST` de la captura 03 crea el ítem `7`, que el `PUT` (09) modifica
y el `DELETE` (11) elimina. Ese orden importa: si corres las peticiones
sueltas, los ids no coincidirán.

## Reproducir las capturas

```bash
docker compose up -d          # PostgreSQL en localhost:5432
pnpm install
cp .env.example .env
pnpm db:migrate               # aplica prisma/migrations/
pnpm db:seed                  # 14
pnpm build                    # 18
pnpm dev                      # deja el servidor en otra terminal → 17

curl -i "http://localhost:3000/api/v1/inventory-items?page=1&limit=2"    # 01
curl -i http://localhost:3000/api/v1/inventory-items/1                   # 02

curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"sku":"ELE-0002","name":"Montacargas electrico","category":"electronics","price":15000,"stock":2,"location":"F-01","warehouseId":1}'   # 03

curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"sku":"xx","name":"AB","category":"herramientas","price":-5,"stock":1.5,"location":"pasillo 3","warehouseId":0}'                       # 04

# sku duplicado → P2002 → 409
curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"sku":"PKG-0001","name":"Pallet duplicado","category":"packaging","price":9,"stock":10,"location":"A-02","warehouseId":1}'             # 05

# bodega inexistente → 404
curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"sku":"PKG-0009","name":"Caja plastica apilable","category":"packaging","price":19.9,"stock":40,"location":"A-09","warehouseId":999}'  # 06

curl -i http://localhost:3000/api/v1/inventory-items/abc                 # 07
curl -i http://localhost:3000/api/v1/inventory-items/999                 # 08

curl -i -X PUT http://localhost:3000/api/v1/inventory-items/7 \
  -H "Content-Type: application/json" -d '{"stock":1,"location":"F-02"}'                                                                     # 09
curl -i -X PUT http://localhost:3000/api/v1/inventory-items/999 \
  -H "Content-Type: application/json" -d '{"stock":1,"location":"F-02"}'                                                                     # 10

curl -i -X DELETE http://localhost:3000/api/v1/inventory-items/7         # 11
curl -i -X DELETE http://localhost:3000/api/v1/inventory-items/999       # 12
curl -i http://localhost:3000/api/v1/warehouses                          # 13
curl -i http://localhost:3000/api/v1/no-existe                           # 15
curl -i http://localhost:3000/health                                     # 16
```

> **En PowerShell**, `curl` es un alias de `Invoke-WebRequest` y además rompe
> las comillas del JSON. Usa `curl.exe` y pasa el body desde un archivo:
> `curl.exe -i -X POST ... --data-binary "@body.json"`.
