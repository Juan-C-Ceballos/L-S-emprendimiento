# Etapa 10 · Scroll del catálogo (MVP 2)

> Leé antes `CLAUDE.md`. Este archivo alcanza para ejecutar la etapa.

## Objetivo
Al volver de un producto al catálogo (con "Volver" o con el botón atrás del navegador), la grilla queda en la misma posición, con los mismos filtros. Hoy vuelve casi arriba y el cliente pierde el lugar.

## Rama
`feature/10-scroll-catalogo` desde `develop`.

## Dependencias
- Etapa 4 (catálogo, `ScrollRestoration` en `LayoutCliente`, D-36).

## Causa
- `ScrollRestoration` (`src/components/LayoutCliente.tsx`) guarda la posición y la restaura al volver.
- `CatalogoPage` se monta de nuevo y `useAsync(listarCatalogo)` arranca en "cargando", sin caché. Mientras llega la vidriera se ven 6 esqueletos.
- La página es más corta que la posición guardada, así que el navegador la recorta y queda arriba. Medido contra `ls-dev` con 1,5 s de demora: de 2161 px a 568 px.

## Tareas
1. Reproducir en el navegador contra `ls-dev` (390 px, red lenta): bajar, entrar a un producto, volver con "Volver" y con atrás.
2. `src/services/productos.ts`: `listarCatalogo` guarda la última `Vidriera` en una variable del módulo (solo en memoria) y `ultimaVidriera()` la devuelve.
3. `CatalogoPage`: `datos = vidriera.estado === 'listo' ? vidriera.datos : ultimaVidriera()`.
   - Grilla, etiquetas, contadores, `quitarEtiquetasDesconocidas`, el texto del resultado y el total de `BarraCarrito` usan `datos` desde el primer render.
   - Esqueletos y "Cargando la vidriera…" solo sin datos.
   - Si el refresco falla y hay datos en memoria, se siguen mostrando.
4. D-42 en `docs/decisions.md`.

## Fuera de alcance
"Visto recientemente", producto en modal, caché persistente (sessionStorage), librería de datos (React Query o similar).

## Archivos que se espera tocar
`src/services/productos.ts` (+ test), `src/pages/CatalogoPage.tsx` (+ test), `docs/decisions.md`, `PLAN.md`.

## Criterios de aceptación
- [ ] Con red lenta, volver de un producto (con "Volver" y con atrás) deja la grilla en la misma posición, sin esqueletos.
- [ ] Cuando llegan los datos nuevos, la posición se mantiene y se ven los cambios (por ejemplo, una pieza que se agotó).
- [ ] Primera visita o recarga: esqueletos como antes. Error sin datos: "No pudimos cargar la vidriera." + "Reintentar".
- [ ] Lint, typecheck, tests y build en verde.

## Pruebas requeridas
- `src/services/productos.test.ts`: la memoria arranca vacía, se llena con `listarCatalogo` y un error no la borra.
- `src/pages/CatalogoPage.test.tsx`: con memoria, el primer render ya muestra las tarjetas; un error al refrescar no tapa los datos.

## Definición de terminado
Criterios cumplidos, verificado en el navegador contra `ls-dev`, PR con CI en verde, squash merge a `develop`, `PLAN.md` actualizado.
