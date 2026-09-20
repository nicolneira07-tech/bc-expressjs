# Capturas — Semana 08

Evidencias pedidas por la rúbrica de la semana 08 (RBAC + capas de
seguridad). Todas se tomaron contra `http://localhost:3000` con MongoDB
levantado, la base sembrada (`pnpm db:seed`) y el servidor corriendo
(`pnpm dev`). La salida completa de cada `curl -i` está en el `.txt`
correspondiente.

| # | Archivo | Caso | Esperado |
|---|---|---|---|
| 01 | `01-health-headers-helmet.txt` | `GET /health` | `200` + cabeceras de Helmet (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`, etc.) y `RateLimit-*` |
| 02 | `02-register-201.txt` | `POST /auth/register` | `201` |
| 03 | `03-register-duplicado-409.txt` | `POST /auth/register` con email repetido | `409` |
| 04 | `04-nosql-injection-login-400.txt` | `POST /auth/login` con `{"email":{"$gt":""},"password":{"$gt":""}}` | `400` — `sanitizeBody` limpia los operadores `$gt`, y Zod rechaza lo que queda |
| 05 | `05-login-operator-200.txt` | Login con `operador@almacen.com` | `200` + cookie de sesión con `role: "operator"` |
| 06 | `06-login-admin-200.txt` | Login con `admin@almacen.com` | `200` + cookie de sesión con `role: "admin"` |
| 07 | `07-inventory-sin-token-401.txt` | `GET /api/v1/inventory-items` sin cookie | `401` |
| 08 | `08-inventory-delete-operator-403.txt` | `DELETE /inventory-items/:id` con sesión de `operator` | `403` — RBAC: borrar es solo de `admin` |
| 09 | `09-inventory-delete-admin-204.txt` | Mismo `DELETE` con sesión de `admin` | `204` |
| 10 | `10-warehouse-post-operator-403.txt` | `POST /api/v1/warehouses` con sesión de `operator` | `403` |
| 11 | `11-warehouse-post-admin-201.txt` | Mismo `POST` con sesión de `admin` | `201` |
| 12 | `12-cors-origen-no-permitido.txt` | Request con `Origin: http://evil-site.com` | Bloqueado — el paquete `cors` corta la petición antes del handler |
| 13 | `13-cors-origen-permitido.txt` | Request con `Origin: http://localhost:5173` (en la whitelist) | `Access-Control-Allow-Origin` presente en la respuesta |
| 14 | `14-ruta-inexistente-404.txt` | `GET /api/v1/no-existe` | `404` JSON |
| 15 | `15-build.txt` | `pnpm build` | Sin errores de TypeScript |
| 16 | `16-auth-rate-limit-429.txt` | 6º intento de login en la ventana de 15 min (`authLimiter`, `limit: 5`) | `429` + header `Retry-After` |
| 17 | `17-seed.txt` | `pnpm db:seed` | 2 usuarios + 2 bodegas + 6 ítems, sin errores |

## Dos decisiones que no salieron del starter tal cual

**`express-mongo-sanitize` no funciona con Express 5.** Es la librería que
recomienda el material de la semana para mitigar NoSQL injection, pero
intenta reasignar `req.query` completo — y en Express 5 `req.query` es un
getter sin setter (se parsea on-demand). Con esa librería instalada,
**cualquier** petición (maliciosa o no) revienta con `500`
(`Cannot set property query of ... which has only a getter`), comprobado
localmente antes de descartarla. La solución fue un middleware propio,
`src/middlewares/sanitize.ts`, que solo muta `req.body` (sí es escribible en
Express 5) y elimina recursivamente cualquier clave que empiece con `$` o
contenga `.`. El caso **04** de esta tabla prueba que funciona: el operador
`$gt` desaparece y lo que le llega a Zod (`{}`) no pasa la validación de
`email`/`password` como string.

**`authLimiter` solo en `/register` y `/login`, no en todo `/auth`.** La
primera versión montaba el limiter sobre el router completo
(`app.use('/api/v1/auth', authLimiter, authRouter)`), lo que también
limitaba `/me`, `/refresh` y `/logout` a 5 peticiones cada 15 minutos —
demasiado agresivo para rutas que ya están detrás de una sesión válida y no
son el objetivo típico de fuerza bruta. Se movió el limiter a las dos rutas
públicas de `auth.routes.ts` (`authLimiter` como segundo argumento de
`.post('/register', ...)` y `.post('/login', ...)`), dejando el resto bajo
el límite global (100 req / 15 min).

## Reproducir las capturas

```bash
docker compose up -d
pnpm install
cp .env.example .env
pnpm db:seed     # 17 — operador@almacen.com/Operador123, admin@almacen.com/Admin1234
pnpm build       # 15
pnpm dev

curl -i http://localhost:3000/health                                            # 01

curl -i -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"nuevo.operador@almacen.com","password":"Clave1234","name":"Nuevo Operador"}'   # 02, repetir → 03

curl -i -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" -d '{"email":{"$gt":""},"password":{"$gt":""}}'          # 04

CJ_OP=cj-op.txt; CJ_ADMIN=cj-admin.txt
curl -i -c "$CJ_OP" -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" -d '{"email":"operador@almacen.com","password":"Operador123"}'   # 05
curl -i -c "$CJ_ADMIN" -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" -d '{"email":"admin@almacen.com","password":"Admin1234"}'        # 06

curl -i http://localhost:3000/api/v1/inventory-items                                            # 07

ITEM=$(curl -s -b "$CJ_OP" "http://localhost:3000/api/v1/inventory-items?limit=1" | jq -r '.data[0].id')
curl -i -b "$CJ_OP" -X DELETE "http://localhost:3000/api/v1/inventory-items/$ITEM"                # 08 → 403
curl -i -b "$CJ_ADMIN" -X DELETE "http://localhost:3000/api/v1/inventory-items/$ITEM"              # 09 → 204

curl -i -b "$CJ_OP" -X POST http://localhost:3000/api/v1/warehouses \
  -H "Content-Type: application/json" -d '{"code":"CAL-01","name":"Bodega Cali","city":"Cali"}'    # 10 → 403
curl -i -b "$CJ_ADMIN" -X POST http://localhost:3000/api/v1/warehouses \
  -H "Content-Type: application/json" -d '{"code":"CAL-01","name":"Bodega Cali","city":"Cali"}'    # 11 → 201

curl -i -H "Origin: http://evil-site.com" http://localhost:3000/health                            # 12
curl -i -H "Origin: http://localhost:5173" http://localhost:3000/health                           # 13

curl -i http://localhost:3000/api/v1/no-existe                                                    # 14

for i in 1 2 3 4 5 6; do
  curl -s -i -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" -d '{"email":"nadie@almacen.com","password":"x"}' | head -1
done   # el 6º es 429                                                                              # 16
```

> **En PowerShell**, `curl` es un alias de `Invoke-WebRequest` y rompe las
> comillas del JSON. Usa `curl.exe` y pasa el body desde un archivo:
> `curl.exe -i -X POST ... --data-binary "@body.json"`.
