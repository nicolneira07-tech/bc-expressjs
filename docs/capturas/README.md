# Capturas — Semana 02

La rúbrica pide "Screenshots de Postman o Thunder Client con las 5 operaciones funcionando". Guarda aquí las imágenes (o el log de la terminal en un `.txt`/`.md`) con estos casos, todos contra `http://localhost:3000/api/v1/inventory-items` (levanta el servidor antes con `pnpm dev`):

## 1. `01-get-all.png` — listar todos los ítems

```
GET /api/v1/inventory-items
```
Debe responder `200` con el array completo (12 ítems sembrados).

## 2. `02-get-by-id.png` — obtener un ítem existente

```
GET /api/v1/inventory-items/WH-001
```
Debe responder `200` con el ítem.

## 3. `03-get-404.png` — ítem inexistente

```
GET /api/v1/inventory-items/WH-999
```
Debe responder `404` con `{ "error": "..." }`.

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
Debe responder `201` con el ítem creado (id autogenerado `WH-013`).

## 5. `05-post-validacion-400.png` — validación de campos requeridos

```
POST /api/v1/inventory-items
Content-Type: application/json

{ "name": "Sin campos" }
```
Debe responder `400` con el detalle de los campos faltantes.

## 6. `06-put-actualizar.png` — actualizar un ítem

```
PUT /api/v1/inventory-items/WH-013
Content-Type: application/json

{
  "name": "Montacargas eléctrico",
  "category": "electronics",
  "price": 15500,
  "stock": 3,
  "location": "F-01",
  "active": true
}
```
Debe responder `200` con el ítem actualizado.

## 7. `07-delete.png` — eliminar un ítem

```
DELETE /api/v1/inventory-items/WH-013
```
Debe responder `204` sin body. Repetir la misma petición debe responder `404`.

## Cómo tomar la captura (Windows)

1. Con Postman o Thunder Client (extensión de VS Code) apuntando a `http://localhost:3000`, ejecuta cada petición.
2. Captura la ventana con **`Win + Shift + S`** → pega en Paint (`Ctrl+V`) → guarda como PNG en esta carpeta con el nombre indicado arriba.
3. Alternativa sin imágenes: guarda la salida de cada `curl -i ...` en un `.txt` con el mismo nombre — la rúbrica acepta "screenshots **o logs**".
