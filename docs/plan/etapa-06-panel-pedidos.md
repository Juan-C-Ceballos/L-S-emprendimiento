# Etapa 6 · Panel de pedidos

> Leé antes `CLAUDE.md`. Este archivo alcanza para ejecutar la etapa.

## Objetivo
La administradora ve los pedidos filtrados por estado, busca por cliente o número, abre el detalle con ítems, precios del momento, precio actual si cambió, stock actual y ganancia estimada, y marca como **vendido** (descuenta stock) o **cancela** (repone si estaba vendido) con las funciones atómicas de la base.

## Rama
`feature/06-panel-pedidos` desde `develop`.

## Dependencias
- Etapa 1 (`orders`, `order_items`, `marcar_vendido`, `cancelar_pedido`, semillas con 6 pedidos).
- Etapa 2 (panel y sesión). La etapa 5 permite crear pedidos reales, pero las semillas alcanzan para trabajar.

## Pantallas del prototipo que implementa
Referencia: `prototype/src/main.html`, bloques `a.isOrders` y `a.isOrder`; lógica en `openOrder()`, `sell()`, `cancelOrder()`, y en `renderVals()` los bloques `ol` y `od`.
- **Pedidos** `/admin/pedidos?estado=pendiente|vendido|cancelado|todos&q=` (por defecto `pendiente`): buscador "Cliente o nº de pedido" (acepta `7`, `0007` o `#0007`; un número busca por prefijo del número), chips Pendientes/Vendidos/Cancelados/Todos con contador (los contadores respetan la búsqueda), "N pedidos [para «q»]", `FilaPedido` (`#0006 · Julieta Ortiz`, teléfono, fecha corta, total, pill de estado), vacíos por estado con los textos del prototipo (incluido "Mejor así." para cancelados).
- **Detalle** `/admin/pedidos/:numero`: número grande + pill, "Recibido el {fecha}", tarjeta Cliente/Teléfono (el teléfono como link `tel:` y un link "Escribir por WhatsApp" a `wa.me/{dígitos}` — agregado simple, anotarlo en `docs/decisions.md`), "Ítems" con miniatura, "N × nombre", "$X c/u al momento del pedido", "Precio actual: $Y" si cambió, "Stock actual: N" (en rojo si no alcanza y está pendiente), subtotal, total, "Ganancia estimada". Acciones:
  - Pendiente: alerta "No alcanza el stock" con los nombres si falta; "Marcar como vendido" (deshabilitado si falta stock); hint "Descuenta N unidades del stock en una sola acción."
  - Vendido: "Vendido el {fecha}. Si lo cancelás, el stock se repone."
  - Pendiente o vendido: "Cancelar pedido" (borde rojo) → confirmación inline "¿Cancelar el pedido #NNNN?" con el texto según el estado, "No, volver" / "Sí, cancelar".
  - Cancelado: "Este pedido está cancelado. Un pedido cancelado no se puede volver a vender."
  - Después de vender o cancelar un vendido: caja verde "Listo: se descontó el stock" / "Listo: se repuso el stock" con `nombre  desde → hasta`. Toasts "Pedido #NNNN vendido. Stock actualizado." / "Pedido #NNNN cancelado. [Stock repuesto.]"
- **Badge** de pendientes en la tab Pedidos (`NavPanel`, etapa 2).

## Tareas
1. **`src/services/pedidos.ts`** (parte admin):
   - `listarPedidosAdmin()`: trae los pedidos (`id, numero, estado, cliente, telefono, total, created_at`) ordenados por `created_at desc`, límite 500. **La búsqueda y el filtro por estado se hacen en el navegador** con funciones puras de `src/lib/pedidos.ts` (igual que el prototipo): así la búsqueda ignora tildes ("lucia" encuentra "Lucía") sin extensiones de Postgres, y los cuatro contadores salen de la misma lista. Punto de extensión: cuando haya más de 500 pedidos, paginar y mover el filtro a la base (con `unaccent`). Anotarlo en `docs/decisions.md`.
   - `filtrarPedidos(lista, { estado, q })` y `contarPorEstado(lista, q)` en `src/lib/pedidos.ts`: `q` numérico (tras quitar `#` y ceros a la izquierda) busca por prefijo del número; si no, por nombre del cliente normalizado.
   - `obtenerPedido(numero)`: pedido + ítems + datos actuales de cada producto (nombre, precio, stock, miniatura) + ganancia estimada (Σ cantidad × (precio_unitario − costo_unitario)).
   - `marcarVendido(id)` / `cancelarPedido(id)`: RPC; mapear errores `stock_insuficiente` (con el `detail` JSON), `estado_invalido`, `no_autorizado`, `pedido_inexistente` a `ErrorServicio` con mensajes en español; devolver los `cambios` para el aviso.
   - `contarPendientes()` para el badge (se refresca al vender/cancelar y al entrar al panel).
2. **`src/lib/pedidos.ts`** (puras, con pruebas): `normalizarBusquedaPedido(q)`, `calcularGanancia(items)`, `faltantesDeStock(items)`, `textoConfirmacionCancelar(estado, unidades)`.
3. **Páginas y componentes**: `PedidosPage`, `PedidoDetallePage`, `FilaPedido`, `PillEstado`, `AvisoDelta`, `ConfirmacionInline`. Estado y búsqueda en la URL. Después de una acción, recargar el pedido desde la base (no mutar a mano).
4. **Concurrencia**: si la RPC falla por `estado_invalido` (otra pestaña ya lo vendió/canceló) o `stock_insuficiente`, mostrar el error y recargar el pedido.

## Archivos que se espera tocar
`src/services/pedidos.ts` (+ test), `src/lib/pedidos.ts` (+ test), `src/pages/{PedidosPage,PedidoDetallePage}.tsx` (+ tests), `src/components/panel/{FilaPedido,PillEstado,AvisoDelta,ConfirmacionInline,NavPanel}.tsx`, `docs/decisions.md`, `PLAN.md`.

## Criterios de aceptación
- [ ] Con las semillas: Pendientes muestra #0006 y #0005; Vendidos #0004, #0003, #0001; Cancelados #0002; contadores correctos.
- [ ] Buscar "6", "#0006" o "0006" encuentra el pedido 6; buscar "lucia" (sin tilde) encuentra a "Lucía Benítez".
- [ ] El detalle de #0001 muestra "Precio actual: $14.500" en "Argollas clásicas doradas" (pedido a $13.900).
- [ ] Vender #0005: el stock de cada producto baja en la cantidad pedida, el estado pasa a vendido, se ve el delta y el badge baja.
- [ ] Un pendiente con un ítem sin stock suficiente muestra la alerta y el botón deshabilitado; si se fuerza la llamada, la base rechaza y nada cambia.
- [ ] Cancelar un vendido repone el stock y muestra el delta; un cancelado no ofrece acciones.
- [ ] Lint, typecheck, tests, build y pgTAP en verde.

## Pruebas requeridas
- `src/lib/pedidos.test.ts`: búsqueda normalizada, ganancia, faltantes, textos.
- `src/services/pedidos.test.ts`: mapeo de errores de `marcar_vendido` (incluido el `detail` JSON de stock).
- `src/pages/PedidoDetallePage.test.tsx`: estados pendiente/vendido/cancelado; confirmación de cancelar.

## Riesgos
- **Búsqueda por número en PostgREST**: si el filtro por prefijo numérico se complica, filtrar en el navegador (aceptable con < 200 pedidos por estado) y anotarlo.
- **Pedidos acumulados**: el filtro "pendientes de más de 7 días" es posterior (etapa 9).

## Definición de terminado
Criterios cumplidos, PR con CI en verde, squash merge a `develop`, `develop` en verde, `PLAN.md` actualizado.
