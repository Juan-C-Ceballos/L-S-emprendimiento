# Etapa 7 · Resumen y Ajustes

> Leé antes `CLAUDE.md`. Este archivo alcanza para ejecutar la etapa.

## Objetivo
La pantalla de inicio del panel muestra lo que hay que atender hoy: pedidos pendientes (cantidad y monto), stock bajo, y ventas y ganancia del mes. Ajustes permite gestionar las etiquetas globalmente (crear, renombrar con unión, eliminar) y muestra el número de WhatsApp configurado (solo lectura, D-01).

## Rama
`feature/07-resumen-ajustes` desde `develop`.

## Dependencias
- Etapas 1, 2, 3 (productos y etiquetas) y 6 (pedidos y navegación a sus filtros).

## Pantallas del prototipo que implementa
Referencia: `prototype/src/main.html`, bloques `a.isHome` y `a.isSettings`; lógica en `renderVals()` bloques `sum` y `st`, y en `renameTag()`, `deleteTag()`, `addGlobalTag()`.
- **Resumen** `/admin`: eyebrow con la fecha ("Miércoles 15 de octubre"), "Hola. Esto es lo que hay hoy.", tres stats (móvil: 2 + 1 ancha oscura; escritorio: 3 en fila):
  - "Pedidos pendientes" · N · "Por $X" o "Nada por atender" → `/admin/pedidos?estado=pendiente`.
  - "Stock bajo" · N · "N agotados · 3 u. o menos" o "3 unidades o menos" → `/admin/productos?filtro=stock-bajo`.
  - "Ventas de {mes}" · $X · "N pedidos vendidos · ganancia $Y" → `/admin/pedidos?estado=vendido`.
  - "Para atender" (3 pendientes más recientes, filas como en Pedidos) + "Ver pedidos"; vacío "Todo al día".
  - "Para reponer" (activos con stock ≤ 3, ordenados por stock ascendente, con miniatura y pill) + "Ver productos"; vacío "Todos los productos activos tienen más de 3 unidades." Tocar uno abre su edición (`/admin/productos/:id?desde=resumen`).
- **Ajustes** `/admin/ajustes`:
  - Sección "WhatsApp de la tienda" **en modo lectura**: el número formateado y el texto "Se cambia en la configuración del sitio (variable `VITE_WHATSAPP_NUMBER`)." y la vista previa del mensaje con el último pedido (o uno de ejemplo). No hay edición de plantilla (D-01).
  - Sección "Etiquetas": "Renombrá o eliminá etiquetas: el cambio se aplica a todos los productos que la usan.", "Nueva etiqueta" + "Agregar" (errores "Escribí el nombre de la etiqueta.", "«x» ya existe."; toast "Creaste «x». Asignala desde cada producto."), lista ordenada alfabéticamente con "N productos", lápiz (renombrar inline, Enter guarda, Escape cancela, hint "Ya existe «x»: al guardar se unen las dos."), tacho (confirmación "¿Eliminar «x»?" con "Se va a quitar de N productos. Los productos no se borran." o "Ningún producto la usa.", "No" / "Sí, eliminar"). Toasts del prototipo.

## Tareas
1. **Migración `…_resumen_y_etiquetas.sql`**:
   - `resumen_panel() returns jsonb`, `security invoker`, `set search_path = ''`, `grant execute` solo a `authenticated`, chequeo `es_admin()`. Devuelve:
     ```json
     {"pendientes": {"cantidad": 2, "monto": 67700},
      "stock_bajo": {"cantidad": 3, "agotados": 1},
      "ventas_mes": {"mes": "2026-10", "cantidad": 2, "total": 61200, "ganancia": 38000}}
     ```
     Mes calendario actual en `America/Argentina/Buenos_Aires` (D-23) sobre `vendido_at` de pedidos con estado `vendido` (D-04). Ganancia = Σ cantidad × (precio_unitario − costo_unitario). Stock bajo: activos con `stock <= 3` (D-22).
   - `renombrar_etiqueta(p_id uuid, p_nombre text) returns jsonb`, `security invoker`, chequeo `es_admin()`, en una transacción: normalizar; si el nombre es el mismo, no hacer nada; si ya existe otra etiqueta con ese nombre, **unir**: mover las relaciones de `p_id` a la existente sin duplicar (`insert … select … on conflict do nothing`) y borrar `p_id`; si no, `update tags set nombre`. Devuelve `{"resultado": "renombrada" | "unida" | "sin_cambios", "id": "<id final>"}`.
   - Pruebas pgTAP `08_resumen_y_etiquetas.test.sql`: solo admin; resumen con las semillas (calcular los valores esperados a partir de `seed.sql`, teniendo en cuenta que las fechas son relativas a `now()`); renombrar simple; unir sin duplicar relaciones; eliminar etiqueta borra sus `product_tags` y no toca productos.
2. **Servicios**: `src/services/resumen.ts` → `obtenerResumen()` + listas ("Para atender": `listarPedidosAdmin()` + `filtrarPedidos(lista, { estado: 'pendiente' })` de la etapa 6, los 3 primeros; "Para reponer": productos activos con stock ≤ 3). `src/services/etiquetas.ts` → `crearEtiqueta`, `renombrarEtiqueta`, `eliminarEtiqueta`, `listarEtiquetasConUso` (ya existe desde la etapa 3).
3. **Páginas**: `ResumenPage`, `AjustesPage`; componentes `Stat`, `FilaEtiqueta` (estados normal/editando/eliminando).
4. Fecha del resumen con `Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })`, con la primera letra en mayúscula.

## Archivos que se espera tocar
`supabase/migrations/*_resumen_y_etiquetas.sql`, `supabase/tests/08_resumen_y_etiquetas.test.sql`, `src/types/database.ts` (regenerado), `src/services/{resumen,etiquetas}.ts` (+ tests), `src/pages/{ResumenPage,AjustesPage}.tsx` (+ tests), `src/components/panel/{Stat,FilaEtiqueta}.tsx`, `PLAN.md`.

## Criterios de aceptación
- [ ] Con las semillas recién cargadas: pendientes = 2; stock bajo incluye "Aros gota martillada" (agotado) y "Pulsera eslabón fino" (2) y no incluye el inactivo; las ventas del mes coinciden con los pedidos vendidos cuyo `vendido_at` cae en el mes actual.
- [ ] Vender un pedido desde la etapa 6 actualiza las ventas del mes al volver al Resumen.
- [ ] Cada stat lleva a la lista filtrada correspondiente.
- [ ] Renombrar "acero" a "dorado" une las etiquetas: los productos que tenían ambas quedan con una sola y el catálogo público refleja el cambio.
- [ ] Eliminar una etiqueta la quita de todos los productos sin borrar productos.
- [ ] Ajustes muestra el número de WhatsApp configurado y no permite editarlo.
- [ ] Lint, typecheck, tests, build y pgTAP en verde.

## Pruebas requeridas
- pgTAP `08_…`.
- `src/services/etiquetas.test.ts`: mapeo de `renombrar_etiqueta` (renombrada/unida).
- `src/pages/ResumenPage.test.tsx`: textos con y sin pendientes, singular/plural ("1 agotado", "2 agotados").
- `src/pages/AjustesPage.test.tsx`: flujo de renombrar con aviso de unión y de eliminar con confirmación.

## Riesgos
- **Zona horaria**: un pedido vendido el último día del mes a las 22 h (Argentina) es del mes en curso aunque en UTC ya sea el siguiente. Probarlo en pgTAP con fechas fijas.
- **Semillas con fechas relativas**: cerca del cambio de mes, los valores esperados de "ventas del mes" varían. En las pruebas, insertar pedidos con `vendido_at` fijo en lugar de depender de las semillas.

## Definición de terminado
Criterios cumplidos, PR con CI en verde, squash merge a `develop`, `develop` en verde, `PLAN.md` actualizado. Con esta etapa, el MVP queda funcionalmente completo en `develop`.
