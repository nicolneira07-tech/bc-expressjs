# bc-expressjs — Entregas

Repositorio de entregas semanales del bootcamp [bc-expressjs](https://github.com/ergrato-dev/bc-expressjs) (SENA).

**Dominio asignado:** Logística / Almacén

Cada semana se entrega en su propia rama `week-<NN>`.

| Semana | Rama | Tema |
|---|---|---|
| 01 | `week-01` | Node.js Fundamentals |

---

## Semana 01 — Procesador de Inventario de Almacén

Herramienta de línea de comandos que lee el inventario de un almacén desde
`data/inventory.json`, calcula un resumen (totales, activos/inactivos,
precio promedio, extremos, categorías), permite filtrar por categoría, y
escribe el resultado en `output/report.json`.

### Recurso: `InventoryItem`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Código del ítem en el almacén (ej. `WH-001`) |
| `name` | `string` | Nombre del ítem |
| `category` | `string` | `packaging`, `electronics`, `spare-parts`, `safety-equipment`, `raw-materials` |
| `price` | `number` | Costo unitario |
| `stock` | `number` | Cantidad disponible en el almacén |
| `location` | `string` | Ubicación física (pasillo-estante, ej. `A-01`) |
| `active` | `boolean` | Si el ítem sigue activo en el catálogo del almacén |

### Cómo correr el proyecto

```bash
pnpm install
pnpm dev                              # sin filtro — muestra todo el inventario
pnpm dev -- --category packaging      # filtrado por categoría
pnpm build                            # verifica que compila sin errores TypeScript
```

El reporte se genera en `output/report.json` en cada ejecución.

Capturas de las distintas ejecuciones: [`docs/capturas/`](docs/capturas/).
