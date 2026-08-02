# Capturas — Semana 01

La rúbrica pide "Screenshots o logs de la herramienta ejecutándose con distintos argumentos". Guarda aquí las imágenes (o pega el log de la terminal en un `.txt`/`.md`) con estos 4 casos:

## 1. `01-sin-filtro.png` — ejecución sin filtro

Comando:
```bash
pnpm dev
```
Debe mostrarse el resumen completo: total, activos/inactivos, precio promedio, más caro/barato, categorías.

## 2. `02-con-filtro.png` — ejecución con `--category`

Comando:
```bash
pnpm dev -- --category packaging
```
Debe mostrarse el resumen filtrado solo a esa categoría.

## 3. `03-categoria-inexistente.png` — manejo de error de categoría

Comando:
```bash
pnpm dev -- --category no-existe
```
Debe mostrarse el mensaje de error listando las categorías disponibles, y el proceso debe terminar con código de salida 1 (no crashea con un stack trace sin manejar).

## 4. `04-build.png` — compilación sin errores

Comando:
```bash
pnpm build
```
Debe terminar sin errores de TypeScript (sin salida = éxito, ya que `build` usa `tsc --noEmit`).

## Cómo tomar la captura (Windows)

1. Abre una terminal en la carpeta del proyecto y corre el comando.
2. Con la ventana de la terminal activa, presiona **`Win + Shift + S`** → selecciona el recorte → se copia al portapapeles.
3. Pega la imagen (`Ctrl+V`) en Paint (o cualquier editor) y guárdala como PNG en esta carpeta con el nombre indicado arriba.
4. Alternativa sin imágenes: copia el texto de la terminal y pégalo en un archivo `.txt` con el mismo nombre (ej. `01-sin-filtro.txt`) — la rúbrica acepta "screenshots **o logs**".

No olvides también dejar el archivo `output/report.json` generado (se crea solo al correr `pnpm dev`) — ese si va en la raíz del proyecto, no aquí.
