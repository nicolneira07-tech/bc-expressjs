# Capturas — Semana 07

Evidencias pedidas por la rúbrica de la semana 07 (autenticación JWT). Todas
se tomaron contra `http://localhost:3000` con MongoDB levantado
(`docker compose up -d`), la base sembrada (`pnpm db:seed`) y el servidor
corriendo (`pnpm dev`). La salida completa de cada `curl -i` está en el
`.txt` correspondiente.

| # | Archivo | Caso | Esperado |
|---|---|---|---|
| 01 | `01-register-201.txt` | `POST /api/v1/auth/register` con datos válidos | `201` + usuario sin password en la respuesta |
| 02 | `02-register-email-duplicado-409.txt` | `POST /auth/register` con un email ya registrado | `409` |
| 03 | `03-register-validacion-400.txt` | `POST /auth/register` con email/password/name inválidos | `400` + `issues[]` de Zod |
| 04 | `04-login-200-cookies.txt` | `POST /api/v1/auth/login` con credenciales válidas | `200` + dos `Set-Cookie` **HttpOnly** (`accessToken`, `refreshToken`) |
| 05 | `05-login-credenciales-invalidas-401.txt` | `POST /auth/login` con password incorrecto | `401` — mismo mensaje que "usuario no existe" (previene user enumeration) |
| 06 | `06-me-sin-cookie-401.txt` | `GET /api/v1/auth/me` sin cookie | `401` |
| 07 | `07-me-con-cookie-200.txt` | `GET /auth/me` con la cookie de acceso | `200` + perfil del usuario autenticado |
| 08 | `08-inventory-sin-cookie-401.txt` | `GET /api/v1/inventory-items` sin cookie | `401` — el recurso de negocio ahora requiere sesión |
| 09 | `09-inventory-con-cookie-200.txt` | `GET /inventory-items` con cookie | `200` — paginado, igual que semana 06 |
| 10 | `10-warehouses-con-cookie-200.txt` | `GET /api/v1/warehouses` con cookie | `200` |
| 11 | `11-inventory-post-con-cookie-201.txt` | `POST /inventory-items` con cookie | `201` |
| 12 | `12-refresh-200-rotacion.txt` | `POST /api/v1/auth/refresh` con el refresh token vigente | `200` + par de cookies **nuevo** (rotación) |
| 13 | `13-refresh-token-rotado-401.txt` | Reintentar `/refresh` con el refresh token **anterior** (ya rotado) | `401` — la rotación de verdad invalida el token viejo |
| 14 | `14-logout-200.txt` | `POST /api/v1/auth/logout` | `200` + cookies limpiadas (`Set-Cookie` con `Expires` en 1970) |
| 15 | `15-refresh-tras-logout-401.txt` | `/refresh` después de logout | `401` — no queda refresh token activo |
| 16 | `16-inventory-tras-logout-401.txt` | `GET /inventory-items` después de logout | `401` — la cookie de acceso ya fue borrada |
| 17 | `17-ruta-inexistente-404.txt` | `GET /api/v1/no-existe` | `404` JSON |
| 18 | `18-health.txt` | `GET /health` | `200` |
| 19 | `19-build.txt` | `pnpm build` | Sin errores de TypeScript |
| 20 | `20-seed.txt` | `pnpm db:seed` | 2 usuarios + 2 bodegas + 6 ítems, sin errores |
| 21 | `21-server-startup-log.txt` | Salida de consola de `pnpm dev` | Conexión a Mongo + servidor escuchando |

## El bug que encontró esta batería de pruebas

El caso **13** no salió a la primera. La primera versión de
`auth.service.ts` guardaba el refresh token con
`bcrypt.hash(refreshToken, 10)`, calcado del starter del bootcamp. Al probar
la reutilización de un token ya rotado, el servidor lo aceptaba igual — la
rotación no invalidaba nada.

Causa: **bcrypt solo usa los primeros 72 bytes del input**. Dos JWT de
refresh del mismo usuario, firmados segundos aparte, son idénticos en esos
72 bytes: mismo header (`eyJhbGciOi...`) y mismo claim `sub` (el id de
usuario, fijo); lo único que cambia (`iat`/`exp`) va al final del payload,
más allá del byte 72. `bcrypt.compare(tokenViejo, hash(tokenNuevo))`
devolvía `true` sin importar cuál de los dos tokens del usuario se probara.

La corrección (`src/services/auth.service.ts`, funciones `hashRefreshToken`
/ `matchesRefreshHash`): un JWT ya es alta entropía — no es una contraseña
humana reutilizable que necesite el costo computacional de bcrypt — así que
se guarda un `SHA-256` de longitud fija (64 hex, muy por debajo del límite)
y se compara con `crypto.timingSafeEqual` para evitar timing attacks.
Repetir el caso 13 después del fix dio el `401` esperado.

## Reproducir las capturas

```bash
docker compose up -d
pnpm install
cp .env.example .env   # agrega JWT_ACCESS_SECRET y JWT_REFRESH_SECRET (openssl rand -base64 64)
pnpm db:seed            # 20 — operador@almacen.com / Operador123, admin@almacen.com / Admin1234
pnpm build               # 19
pnpm dev                 # 21 — deja el servidor corriendo en otra terminal

CJ=cookies.txt

curl -i -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"nuevo.operador@almacen.com","password":"Clave1234","name":"Nuevo Operador"}'   # 01, repetir para 02

curl -i -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"operador@almacen.com","password":"Operador123"}' -c "$CJ"   # 04

curl -i -b "$CJ" http://localhost:3000/api/v1/auth/me                                          # 07
curl -i -b "$CJ" "http://localhost:3000/api/v1/inventory-items?page=1&limit=2"                 # 09

OLD=$(grep refreshToken "$CJ" | tail -1 | awk -F'\t' '{print $7}')
curl -i -c "$CJ" -b "$CJ" -X POST http://localhost:3000/api/v1/auth/refresh                     # 12
curl -i -X POST http://localhost:3000/api/v1/auth/refresh -H "Cookie: refreshToken=$OLD"        # 13 → 401

curl -i -c "$CJ" -b "$CJ" -X POST http://localhost:3000/api/v1/auth/logout                      # 14
curl -i -b "$CJ" -X POST http://localhost:3000/api/v1/auth/refresh                              # 15 → 401
```

> **En PowerShell**, `curl` es un alias de `Invoke-WebRequest` y rompe las
> comillas del JSON. Usa `curl.exe` y pasa el body desde un archivo:
> `curl.exe -i -X POST ... --data-binary "@body.json"`.
