# Etapa 5 · Carrito y pedido

> Leé antes `CLAUDE.md`. Este archivo alcanza para ejecutar la etapa.

## Objetivo
El cliente arma un carrito con varios productos (guardado en el navegador, **sin precios**), confirma con nombre y teléfono, el pedido se guarda en la base con `crear_pedido` (que valida stock y precios reales), y recién después ve la pantalla de éxito con el botón que abre WhatsApp con el mensaje prearmado y el número de pedido.

## Rama
`feature/05-carrito-pedido` desde `develop`.

## Dependencias
- Etapa 1 (`crear_pedido` con el contrato `{ok, pedido | errores}` y D-24).
- Etapa 4 (catálogo, detalle, `SelectorCantidad`, `obtenerProductoPublico`).
- `VITE_WHATSAPP_NUMBER` en `.env.local` (para desarrollo se puede usar un número de prueba propio; pedir el real al usuario antes de producción).

## Pantallas del prototipo que implementa
Referencia: `prototype/src/main.html`, bloques `c.isDetail` (barra de agregar), `c.isCart`, `c.isCheckout`, `c.isSuccess`, y el contador del carrito en el header; lógica en `addToCart()`, `setLine()`, `removeLine()`, `stockIssues()`, `fixCart()`, `confirmOrder()`, `waText()`, `defaultTemplate()`.
- **Detalle**: stepper (−/+ limitado por `stock − enCarrito`), "Agregar al carrito", "Agotado" deshabilitado, "Ya tenés todo el stock · Ver carrito", nota "Ya tenés N en el carrito · Ver carrito". Toasts: "Agregaste 1 unidad al carrito.", "Agregaste N unidades al carrito.", "Solo quedaban N; agregamos esa cantidad."
- **Header**: badge con la cantidad de piezas; `aria-label` "Carrito, N piezas" / "Carrito vacío".
- **Barra del catálogo** (móvil, si hay carrito): "Ver carrito · N piezas" + total.
- **Carrito** `/carrito`: "Tu carrito", líneas (miniatura 76 × 94, nombre, subtotal, "$X c/u", stepper chico, "Quitar"), aviso de stock por línea en rojo, total grande, hint de WhatsApp, "Continuar" + total; vacío "Tu carrito está vacío" + "Ver catálogo". Toast "Quitaste {nombre} del carrito."
- **Confirmar** `/confirmar`: "Confirmar pedido", "N piezas · Total $X", alerta "Antes de confirmar, corregí tu carrito" con la lista y "Ajustar al stock disponible" / "Ir al carrito", campos Nombre ("Cómo te llamás") y Teléfono (`type="tel"`, "Ej. 351 555-1234", hint "Con código de área. Lo usamos solo para coordinar este pedido."), "Confirmar pedido", nota "No se cobra nada ahora: el pedido queda pendiente hasta que lo coordinemos."
- **Éxito** `/pedido/confirmado`: ícono ok, "Pedido #0007 · pendiente", "¡Gracias, {primer nombre}!", texto, "Vista previa del mensaje" en burbuja, botón verde "Enviar por WhatsApp", "Volver al catálogo", "Se abre un chat con L&S al {número formateado}."

## Tareas
1. **`src/services/carrito.ts`** (sin Supabase; es estado del navegador):
   - Formato en `localStorage` clave `ls:carrito:v1`: `[{ "productoId": "uuid", "cantidad": 2 }]`. **Nunca precios.** Validar al leer con Zod; si está corrupto, vaciar.
   - `leer()`, `agregar(id, cantidad, maxDisponible)` (devuelve la cantidad realmente agregada), `cambiarCantidad(id, cantidad)`, `quitar(id)`, `vaciar()`, `contarPiezas()`.
   - `src/lib/carrito.tsx`: `CarritoProvider` + `useCarrito()` que expone las acciones y escucha el evento `storage` (sincroniza entre pestañas).
2. **`src/services/productos.ts`**: `obtenerProductosPorIds(ids)` → precio, stock, activo, nombre y miniatura actuales (para Carrito y Confirmar; los precios **siempre** se leen de la base al mostrar).
3. **`src/lib/carritoReglas.ts`** (puras, con pruebas): `detectarProblemas(lineas, productos)` → `[{productoId, tipo: 'agotado' | 'inactivo' | 'excede', disponible}]` con los textos del prototipo ("{nombre}: se agotó. Quitalo del carrito para seguir." / "{nombre}: quedan N y pediste M. Bajá la cantidad."); `ajustarAlStock(lineas, productos)`; `calcularTotal(lineas, productos)`. Un producto que desapareció o se desactivó cuenta como agotado.
4. **`src/services/pedidos.ts` → `crearPedido({ items, cliente, telefono, totalEsperado })`** (D-07: **único** punto que conoce el transporte; hoy RPC directa, mañana función de Cloudflare):
   - Llama a `rpc('crear_pedido', { p_items, p_cliente, p_telefono, p_total_esperado })`.
   - `ok: true` → devuelve `PedidoCreado` `{ id, numero, total, cliente, items[{nombre, cantidad, precioUnitario, subtotal}] }`.
   - `ok: false` → lanza `ErrorServicio('pedido_rechazado', …)` con `detalle` = errores tipados (`stock_insuficiente`, `inactivo`, `inexistente`, `precio_cambiado` + precios actuales).
   - Error `22023` → `ErrorServicio('datos_invalidos', 'Revisá los datos marcados.')`; red → `ErrorServicio('red', …)`.
5. **Esquema Zod** del formulario de confirmación en `src/lib/esquemas.ts` (D-25): nombre 2–80 ("Escribí tu nombre así sabemos a quién le preparamos el pedido." / "El nombre es muy corto. Escribí al menos 2 letras."), teléfono 8–15 dígitos ("Necesitamos un teléfono para coordinar por WhatsApp." / "Revisá el número: tiene que tener entre 8 y 15 dígitos, con código de área (ej. 351 555-1234).").
6. **`ConfirmarPage`**:
   - Al entrar, relee los productos (`obtenerProductosPorIds`) y muestra el total con precios actuales; ese total es `totalEsperado`.
   - Al confirmar: valida Zod; si hay problemas de stock locales, toast "Hay piezas sin stock suficiente. Corregí el carrito para seguir." y no llama. Botón deshabilitado + "Confirmando…" mientras espera (evita doble envío).
   - Si la RPC rechaza por stock/inactivo: actualizar la alerta con lo que devolvió la base (sin vaciar el formulario). Si rechaza por `precio_cambiado`: releer productos, mostrar alerta "Cambió el precio de algunas piezas. Revisá el total antes de confirmar." con el total nuevo, y dejar confirmar de nuevo.
   - Si sale bien: guardar `PedidoCreado` en `sessionStorage` (`ls:ultimo-pedido`), **vaciar el carrito** y navegar a `/pedido/confirmado` con `replace: true`.
7. **`src/lib/whatsapp.ts`** (D-01): `armarMensaje(pedido)` con la plantilla fija del prototipo (`¡Hola! Te escribo por mi pedido {pedido} de L&S.` …, ítems `• {cant} × {nombre} — {subtotal}`), `enlaceWhatsApp(numero, mensaje)` → `https://wa.me/{solo dígitos}?text={encodeURIComponent}`, `formatearTelefonoTienda(digitos)` para mostrar (ej. `+54 9 11 0000-0000`, si no se puede, `+{dígitos}`).
8. **`PedidoConfirmadoPage`**: lee el pedido de `sessionStorage` (si no hay, redirige a `/`). El botón es un `<a href target="_blank" rel="noopener">`: el pedido **ya está guardado** antes de que el cliente lo toque (regla no negociable).
9. Conectar el detalle (etapa 4) al carrito: stepper y botón reales, notas de "ya tenés N".
10. **Puntos de extensión** (solo comentarios, sin implementar): en `crearPedido`, dónde iría el token de captcha; en `carrito.ts`, dónde iría un tope por pedido.

## Archivos que se espera tocar
`src/services/{carrito,pedidos,productos}.ts` (+ tests), `src/lib/{carrito.tsx,carritoReglas.ts,whatsapp.ts,esquemas.ts}` (+ tests), `src/pages/{ProductoPage,CarritoPage,ConfirmarPage,PedidoConfirmadoPage}.tsx` (+ tests), `src/components/{HeaderCliente,BarraCarrito,LineaCarrito,AlertaStock}.tsx`, `PLAN.md`.

## Criterios de aceptación
- [ ] El `localStorage` del carrito solo contiene `productoId` y `cantidad` (verificar en DevTools).
- [ ] No se puede agregar más que el stock disponible; el carrito sobrevive a recargar y se sincroniza entre pestañas.
- [ ] Pedido válido: aparece en `orders` como `pendiente` con `precio_unitario` y `costo_unitario` de la base; el stock **no** cambia; se ve la pantalla de éxito con `#NNNN`; el carrito queda vacío.
- [ ] El enlace abre `https://wa.me/<VITE_WHATSAPP_NUMBER>?text=…` con el mensaje correcto (número, ítems, total, nombre).
- [ ] Stock bajado desde el panel (u otra pestaña) entre agregar y confirmar → la base rechaza, se muestra la alerta y **no** se crea el pedido; "Ajustar al stock disponible" deja confirmar.
- [ ] Precio cambiado entre abrir Confirmar y confirmar → alerta con total nuevo y no se crea el pedido hasta reconfirmar.
- [ ] Nombre o teléfono inválidos → errores del prototipo (con el ajuste de D-25), sin llamar a la base.
- [ ] Doble clic en "Confirmar pedido" crea un solo pedido.
- [ ] Lint, typecheck, tests, build y pgTAP en verde.

## Pruebas requeridas
- `src/services/carrito.test.ts`: agregar con tope, cambiar, quitar, datos corruptos.
- `src/lib/carritoReglas.test.ts`: problemas, ajuste y total.
- `src/lib/whatsapp.test.ts`: mensaje exacto para un pedido de 2 ítems; enlace codificado; número con símbolos.
- `src/services/pedidos.test.ts`: mapeo de `ok: true`, `ok: false` (stock, precio) y error `22023`.
- `src/pages/ConfirmarPage.test.tsx`: validación, rechazo de stock, éxito → navega y vacía el carrito.

## Riesgos
- **Pedidos falsos o masivos**: fuera del MVP (captcha, límite por IP y topes en etapa 9). El stock no se bloquea porque se descuenta al vender.
- **Bloqueador de ventanas emergentes**: por eso WhatsApp se abre con un link que toca el cliente, no automáticamente.
- **Número de WhatsApp mal configurado**: validar `VITE_WHATSAPP_NUMBER` en `env.ts` (solo dígitos, 10 a 15) y no mostrar el botón si falta.

## Definición de terminado
Criterios cumplidos, PR con CI en verde, squash merge a `develop`, `develop` en verde, `PLAN.md` actualizado.
