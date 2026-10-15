# Prototipo de L&S (Claude Design)

Fuente de verdad **visual**: pantallas, textos, tokens de diseño y datos de ejemplo.
En lo **funcional** manda [`docs/ls-mvp.html`](../docs/ls-mvp.html). Las diferencias están en [`docs/decisions.md`](../docs/decisions.md).
El análisis completo (pantalla → ruta → componentes → servicio) está en [`docs/prototype-analysis.md`](../docs/prototype-analysis.md).

## Archivos

| Archivo | Qué es |
|---|---|
| `bundle-original.html` | Export original tal como salió de Claude Design (un único HTML empaquetado, ~1,2 MB). Se abre en el navegador y muestra las tres pizarras. |
| `src/main.html` | **Código fuente legible del prototipo**: componente `Main` con la vista cliente y la vista administradora. Arriba: CSS (todos los tokens). Medio: plantilla con `sc-if`/`sc-for`. Abajo: `class Component` con el estado en memoria, los datos semilla (`seed()`) y toda la lógica. |
| `src/placeholder.html` | Componente `Ph`: ilustraciones SVG de joyas (aro, pulsera, collar…) que ocupan el lugar de las fotos. |
| `tools/unpack.cjs` | Script para volver a desempaquetar el bundle si llega un export nuevo. |

## Cómo está armado

- El bundle tiene tres pizarras: **móvil 390×844** (`Main` con `desk=false`), **escritorio 1280×800** (`Main` con `desk=true`, misma lógica, CSS con prefijo `.desk`) y el **placeholder** de producto.
- La barra oscura de arriba ("Vista cliente / Vista administradora") es solo del prototipo: en la app real son dos zonas con rutas distintas (`/` y `/admin`).
- Todo el estado vive en memoria (`this.state`): productos, pedidos, carrito, sesión, ajustes. La lista de lo que hay que reemplazar por Supabase está en `docs/prototype-analysis.md`.

## Cómo leerlo rápido

```bash
# CSS y tokens
grep -n "^\.app\|^\.btn\|^\.chip\|^\.pill" prototype/src/main.html
# Lógica y datos semilla
grep -n "seed()\|confirmOrder\|sell()\|cancelOrder\|saveProduct" prototype/src/main.html
```

Para regenerar desde un export nuevo:

```bash
node prototype/tools/unpack.cjs <carpeta-con-el-html> <salida>
```
