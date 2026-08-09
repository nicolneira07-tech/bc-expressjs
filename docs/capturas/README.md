# Capturas — Semana 04

Evidencias pedidas por la rúbrica de la semana 04 (validación con Zod, errores
estructurados y logging). Todas se tomaron contra `http://localhost:3000` con el
servidor levantado (`pnpm dev`), y la salida completa de cada `curl -i` está
guardada en el `.txt` correspondiente.

| # | Archivo | Caso | Esperado |
|---|---|---|---|
| 01 | `01-get-all-paginado.txt` | `GET /api/v1/inventory-items?page=1&limit=2` | `200` + `{ data, total, page, limit }` |
| 02 | `02-get-by-id.txt` | `GET /api/v1/inventory-items/1` | `200` + `{ data: {...} }` |
| 03 | `03-post-crear-201.txt` | `POST` con body válido | `201` + ítem creado |
| 04 | `04-post-validacion-400.txt` | `POST` con body inválido | `400` + `issues[]` (5 campos) |
| 05 | `05-get-id-no-numerico-400.txt` | `GET /api/v1/inventory-items/abc` | `400` + `issues[{ field: "id" }]` |
| 06 | `06-get-inexistente-404.txt` | `GET /api/v1/inventory-items/999` | `404` (AppError del service) |
| 07 | `07-put-actualizar-200.txt` | `PUT /api/v1/inventory-items/6` | `200` + ítem actualizado |
| 08 | `08-post-duplicado-409.txt` | `POST` con `name` ya existente | `409` (regla de negocio) |
| 09 | `09-delete-204.txt` | `DELETE /api/v1/inventory-items/6` | `204` sin body |
| 10 | `10-ruta-inexistente-404.txt` | `GET /api/v1/no-existe` | `404` **JSON**, no HTML (middleware `notFound`) |
| 11 | `11-health.txt` | `GET /health` | `200` |
| 12 | `12-logs-consola.txt` | Salida de consola durante todas las peticiones | `info` de arranque, `http` de Morgan, `warn` de cada error |
| 13 | `13-build.txt` | `pnpm build` | Sin errores de TypeScript |

> Los `.txt` son el log literal de la terminal. La rúbrica acepta
> "screenshots **o logs**"; si prefieres imágenes, repite cada petición en
> Postman/Thunder Client y guarda el PNG con el mismo nombre.

## Orden de ejecución

Las capturas 03 → 09 son una secuencia: el `POST` crea el ítem `id: 6`, el `PUT`
lo modifica y el `DELETE` lo elimina. Si repites las peticiones sueltas sobre un
servidor recién levantado, los ids no coincidirán (el store es en memoria y se
reinicia con el proceso).

## Reproducir las capturas

```bash
pnpm install
pnpm build            # 13
pnpm dev              # deja el servidor corriendo en otra terminal → 12

curl -i "http://localhost:3000/api/v1/inventory-items?page=1&limit=2"    # 01
curl -i http://localhost:3000/api/v1/inventory-items/1                   # 02

curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"name":"Montacargas electrico","category":"electronics","price":15000,"stock":2,"location":"F-01"}'   # 03

curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"name":"AB","category":"herramientas","price":-5,"stock":1.5,"location":"pasillo 3"}'                 # 04

curl -i http://localhost:3000/api/v1/inventory-items/abc                 # 05
curl -i http://localhost:3000/api/v1/inventory-items/999                 # 06

curl -i -X PUT http://localhost:3000/api/v1/inventory-items/6 \
  -H "Content-Type: application/json" -d '{"stock":1,"location":"F-02"}'                                     # 07

curl -i -X POST http://localhost:3000/api/v1/inventory-items \
  -H "Content-Type: application/json" \
  -d '{"name":"Casco de seguridad","category":"safety-equipment","price":15.5,"stock":10,"location":"D-02"}' # 08

curl -i -X DELETE http://localhost:3000/api/v1/inventory-items/6         # 09
curl -i http://localhost:3000/api/v1/no-existe                           # 10
curl -i http://localhost:3000/health                                     # 11
```

> **En PowerShell**, `curl` es un alias de `Invoke-WebRequest` y además rompe las
> comillas del JSON. Usa `curl.exe` y pasa el body desde un archivo:
> `curl.exe -i -X POST ... --data-binary "@body.json"`.
