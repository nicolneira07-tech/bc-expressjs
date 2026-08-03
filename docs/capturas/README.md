# Capturas — Semana 03

La rúbrica pide "Screenshot de Thunder Client con los 5 endpoints funcionando" + "Screenshot de `pnpm build` sin errores". Guarda aquí las imágenes (o el log de la terminal en un `.txt`/`.md`) con estos casos, todos contra `http://localhost:3000/api/v1/inventory-items` (levanta el servidor antes con `pnpm dev`):

## 1. `01-get-all-paginado.png` — listar con paginación

```
GET /api/v1/inventory-items?page=1&limit=2
```
Debe responder `200` con `{ "data": [...], "total": 5, "page": 1, "limit": 2 }`.

## 2. `02-get-by-id.png` — obtener un ítem existente

```
GET /api/v1/inventory-items/1
```
Debe responder `200` con `{ "data": { "id": 1, ... } }`.

## 3. `03-get-404.png` — ítem inexistente

```
GET /api/v1/inventory-items/999
```
Debe responder `404` con `{ "error": "Not Found", "message": "Item 999 not found" }`.

## 4. `04-post-crear.png` — crear un ítem

```
POST /api/v1/inventory-items
Content-Type: application/json

{
  "name": "Montacargas eléctrico",
  "category": "electronics",
  "price": 15000,
  "stock": 2,
  "location": "F-01",
  "active": true
}
```
Debe responder `201` con `{ "data": { "id": 6, ... } }`.

## 5. `05-put-actualizar.png` — actualizar un ítem

```
PUT /api/v1/inventory-items/6
Content-Type: application/json

{ "stock": 1 }
```
Debe responder `200` con el ítem actualizado.

## 6. `06-delete.png` — eliminar un ítem

```
DELETE /api/v1/inventory-items/6
```
Debe responder `204` sin body. Repetir la misma petición debe responder `404`.

## 7. `07-build.png` — compilación sin errores

```bash
pnpm build
```
Sin salida = éxito (`tsc` sin `--noEmit`, genera `dist/`).

## Cómo tomar la captura (Windows)

1. Con Postman, Thunder Client o `curl` apuntando a `http://localhost:3000`, ejecuta cada petición.
2. Captura la ventana con **`Win + Shift + S`** → pega en Paint (`Ctrl+V`) → guarda como PNG en esta carpeta con el nombre indicado arriba.
3. Alternativa sin imágenes: guarda la salida de cada `curl -i ...` en un `.txt` con el mismo nombre — la rúbrica acepta "screenshots **o logs**".
