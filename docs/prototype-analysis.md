# Análisis del prototipo

Fuente: [`prototype/src/main.html`](../prototype/src/main.html) (componente `Main`) y [`prototype/src/placeholder.html`](../prototype/src/placeholder.html) (componente `Ph`).
Las referencias `main.html:NNN` son líneas de ese archivo.

## 1. Estructura general

- **Un único componente** con dos modos: `client` y `admin`. La barra superior "Prototipo · Vista cliente / Vista administradora" es solo del prototipo y **no se implementa**.
- **Dos tamaños**: móvil (390 px, base) y escritorio (1280 px, clase `.desk`). En la app real: diseño mobile-first con breakpoint `lg` (≥ 1024 px) para el diseño de escritorio. Ver D-12 en `decisions.md`.
- **Navegación por estado** (`cScreen`, `aScreen`). En la app real cada pantalla es una ruta de React Router.
- **Toasts** (`flash()`): mensaje abajo, 2,8 s. En escritorio, abajo a la derecha, 380 px.
- **Búsquedas con espera**: el input se actualiza al instante y el filtro se aplica 350 ms después de la última tecla (`typeSearch`). Mientras tanto el contador dice "Buscando…".

## 2. Mapa pantalla → ruta → componentes → servicio

Convenciones: páginas en `src/pages/`, componentes en `src/components/`, servicios en `src/services/`.

### Cliente (público, anónimo)

| Pantalla (prototipo) | Ruta | Página / componentes principales | Servicio |
|---|---|---|---|
| Catálogo / "Vidriera" (`isCatalog`, main.html: hero, `.fl`, `.grid`) | `/` con `?q=&tags=a,b&modo=todas\|alguna` | `CatalogoPage`; `HeaderCliente` (logo + carrito con contador), `Hero`, `FiltrosCatalogo` (búsqueda por nombre, selector "Que tenga todas / alguna", chips seleccionadas, buscador de etiquetas, chips con contador, "Limpiar filtros"), `GrillaProductos`, `TarjetaProducto` (badge "Agotado"), `EstadoVacio`, `BarraCarrito` (móvil) | `productos.listarCatalogo()` (activos + portada + etiquetas, una sola carga); filtrado puro en `src/lib/filtros.ts` |
| Detalle (`isDetail`) | `/producto/:id` | `ProductoPage`; `Galeria` (scroll-snap, contador "1 / 3", puntos), `EtiquetasProducto` (cada etiqueta lleva a `/?tags=x&modo=todas`), `NotaStock` ("Últimas N unidades", "Última unidad disponible", "agotada"), `SelectorCantidad`, botón "Agregar al carrito" / "Agotado" / "Ya tenés todo el stock · Ver carrito" | `productos.obtenerProductoPublico(id)`; carrito en `carrito.ts` |
| Carrito (`isCart`) | `/carrito` | `CarritoPage`; `LineaCarrito` (miniatura, nombre, subtotal, precio c/u, stepper, "Quitar", aviso de stock), total, "Continuar", vacío "Tu carrito está vacío" | `carrito.ts` (localStorage, sin precios) + `productos.obtenerProductosPorIds(ids)` para precios y stock actuales |
| Confirmar pedido (`isCheckout`) | `/confirmar` | `ConfirmarPage`; resumen "N piezas · Total $X", `AlertaStock` ("Antes de confirmar, corregí tu carrito" + "Ajustar al stock disponible"), campos Nombre y Teléfono con validación, "Confirmar pedido" | `pedidos.crearPedido({items, cliente, telefono, totalEsperado})` → RPC `crear_pedido` |
| Éxito (`isSuccess`) | `/pedido/confirmado` | `PedidoConfirmadoPage`; ícono ok, "Pedido #0007 · pendiente", "¡Gracias, {nombre}!", vista previa del mensaje (burbuja), "Enviar por WhatsApp" (verde), "Volver al catálogo", "Se abre un chat con L&S al {número}" | `src/lib/whatsapp.ts` (`armarMensaje`, `enlaceWhatsApp`) con `VITE_WHATSAPP_NUMBER` |

### Administradora (privado)

| Pantalla (prototipo) | Ruta | Página / componentes principales | Servicio |
|---|---|---|---|
| Login (`notLogged`) | `/admin/ingresar` | `IngresarPage`; logo grande, "Panel de la tienda", Email, Contraseña, error, "Ingresar" | `auth.ingresar(email, pass)`, `auth.salir()`, `auth.sesionActual()` |
| Layout del panel | `/admin/*` | `PanelLayout`; `HeaderPanel` (volver, título centrado, acción derecha: salir en Resumen, "+" en Productos), `NavPanel` (tabs abajo en móvil / barra lateral 220 px en escritorio: Resumen, Productos, Pedidos con badge de pendientes, Ajustes), `RutaProtegida` | `auth.ts` |
| Resumen (`isHome`) | `/admin` | `ResumenPage`; fecha ("Miércoles 15 de octubre"), "Hola. Esto es lo que hay hoy.", `Stat` ×3 (Pedidos pendientes · Por $X; Stock bajo · N agotados · 3 u. o menos; Ventas de {mes} · N pedidos vendidos · ganancia $X), "Para atender" (3 pendientes más recientes), "Para reponer" (stock ≤ 3) | `resumen.obtenerResumen()` → RPC `resumen_panel` |
| Productos (`isProducts`) | `/admin/productos?filtro=todos\|activos\|inactivos\|stock-bajo&q=` | `ProductosPage`; búsqueda "Nombre o etiqueta", chips de filtro con contador, `FilaProducto` (miniatura, nombre, "precio · costo", etiquetas, pill de stock, pill "Inactivo"), "Nuevo producto" | `productos.listarProductosAdmin()` (incluye costo) |
| Formulario de producto (`isForm`) | `/admin/productos/nuevo` y `/admin/productos/:id` | `ProductoFormPage`; secciones: Nombre/Descripción; Precio y stock (Precio, Costo, `MargenGanancia`, Stock); Imágenes (`EditorImagenes`: portada, mover, quitar, "Agregar imagen"); Etiquetas (`EditorEtiquetas` con autocompletado y "Crear «x»"); `InterruptorActivo`; barra inferior "Cancelar" + "Crear producto"/"Guardar cambios" | `productos.guardarProducto()` → RPC `guardar_producto`; `imagenes.subirImagen()`; `etiquetas.listarEtiquetas()` |
| Pedidos (`isOrders`) | `/admin/pedidos?estado=pendiente\|vendido\|cancelado\|todos&q=` | `PedidosPage`; búsqueda "Cliente o nº de pedido" (acepta `7` o `#0007`), chips de estado con contador, `FilaPedido` (número · cliente, teléfono, fecha, total, pill de estado), vacíos por estado | `pedidos.listarPedidos({estado, q})`, `pedidos.contarPorEstado()` |
| Detalle de pedido (`isOrder`) | `/admin/pedidos/:numero` | `PedidoDetallePage`; número grande + pill, "Recibido el…", Cliente/Teléfono, ítems (cantidad × nombre, precio c/u al momento del pedido, "Precio actual: $X" si cambió, "Stock actual: N" en rojo si no alcanza), total, ganancia estimada, `AvisoDelta` ("Listo: se descontó/repuso el stock" con desde → hasta), alerta "No alcanza el stock", "Marcar como vendido" (deshabilitado si no alcanza), "Cancelar pedido" + confirmación inline | `pedidos.obtenerPedido(numero)`, `pedidos.marcarVendido(id)` → RPC `marcar_vendido`, `pedidos.cancelarPedido(id)` → RPC `cancelar_pedido` |
| Ajustes (`isSettings`) | `/admin/ajustes` | `AjustesPage`; **solo la sección Etiquetas** (nueva etiqueta, renombrar con unión, eliminar con confirmación). El número de WhatsApp se muestra en modo lectura. Ver D-01 | `etiquetas.crear()`, `etiquetas.renombrar()` → RPC `renombrar_etiqueta`, `etiquetas.eliminar()` |

## 3. Tokens de diseño (extraídos del CSS del prototipo)

### Tipografías
- **Títulos / marca / números grandes**: `Bricolage Grotesque` 400, 600, 700 (fallback Georgia, serif). Marca "L&S": 27 px (móvil), 32 px (escritorio), 52 px (login), `letter-spacing: -.03em`, el `&` en bronce y peso 400.
- **Texto**: `Hanken Grotesk` 400, 500, 600, 700 (fallback system-ui). Base 15 px / 1.45. Inputs 16 px (evita zoom en iOS).
- Números con `font-variant-numeric: tabular-nums` en precios, totales y contadores.

### Colores
> **Paleta actualizada (D-33)**: la tienda adoptó la paleta bronce/champán de su logo (`docs/marca/`, `public/logo.webp`). Los valores de abajo son los vigentes en `src/index.css`; entre paréntesis, el valor original del prototipo. `vino` pasó a llamarse `bronce` y `rosa*` a `champan*`.

| Token sugerido | Valor | Uso |
|---|---|---|
| `crema` | `#FAF6F0` (`#FBF4F1`) | Fondo de la app, header, barra inferior |
| `tinta` | `#3A2E26` (`#3A2C2C`) | Texto principal, botón primario, chip activo |
| `tinta-hover` | `#56463A` (`#56403F`) | Hover del botón primario |
| `bronce` | `#8C5E22` (vino `#9A4E5E`) | Acento: links, `&` del logo, contador del carrito, foco (`outline 2px`) |
| `bronce-hover` | `#6E4917` (`#7A3747`) | Hover de links |
| `champan` | `#F2E7D8` (rosa `#F6E3DD`) | Fondo del hero |
| `champan-suave` | `#F1E7DA` (`#F4E4DF`) | Hover de íconos y botones fantasma, tab activa en escritorio |
| `champan-seg` | `#EEE2D2` (`#F3E2DC`) | Fondo del control segmentado |
| `borde` | `#ECE2D5` (`#EFDFD9`) | Bordes de header, tarjetas y listas |
| `borde-fuerte` | `#DCCAB4` (`#E0C8C1`) | Bordes de inputs, botones fantasma, stepper |
| `borde-chip` | `#E3D3BF` (`#E6CEC7`) | Bordes de chips y selects |
| `divisor` | `#F3ECE2` (`#F6E9E5`) | Separadores entre filas |
| `texto-suave` | `#76664F` (`#7D6762`) | Textos secundarios, contadores, hints |
| `texto-medio` | `#4F4B45` | Descripción del producto |
| `img-fondo` | `#E4E1DB` | Fondo de imágenes mientras cargan |
| `wa` / `wa-hover` | `#1E6343` / `#174F35` | Botón "Enviar por WhatsApp", interruptor activo |
| `peligro` / `peligro-hover` | `#9E2A1F` / `#7F2017` | Errores, botón de cancelar |
| `peligro-fondo` / `peligro-borde` / `peligro-texto` | `#FBEDEA` / `#F0C9C2` / `#6E1A12` | Alertas |
| `ok-fondo` / `ok-borde` / `ok-texto` | `#E8F2EB` / `#C3DCCB` / `#1F4A33` | Caja de éxito, margen positivo |
| `aviso` | `#7A4F0A` | Nota "Últimas N unidades" |
| Pills | pendiente/bajo `#F6EBD3`/`#6A4C0A`; vendido `#E1EEE5`/`#245038`; cancelado/inactivo `#ECEAE6`/`#57534D`; agotado `#FBEDEA`/`#8A2219`; ok `#F0EFEC`/`#4A4741` | Estados |

### Formas y espaciados
- Radios: imágenes de tarjeta 3 px; inputs 10 px; alertas 12 px; tarjetas/listas/stats 14 px; botones, chips, pills y stepper 999 px.
- Alturas táctiles: mínimo 44 px (íconos, links, chips 40 px), botón principal 52 px, input 50 px.
- Header 60 px (móvil) / 72 px (escritorio). Barra inferior 80 px. Tabs del panel 68 px.
- Grilla del catálogo: 2 columnas, gap 26 × 12 px, padding 16 px (móvil); 4 columnas, gap 40 × 20 px, filtros en columna fija de 288 px y sticky (escritorio).
- Imágenes de tarjeta con proporción 4:5; galería 1:1.1 (móvil) / 1:1 (escritorio).
- Producto agotado en la grilla: imagen con `grayscale(.7)` y `opacity .55`, precio en gris, badge "AGOTADO" arriba a la izquierda.
- Eyebrow (`.eb`): 11 px, mayúsculas, `letter-spacing .16em`, peso 600.

## 4. Textos clave (copiar tal cual)

- Hero: eyebrow "Vidriera", título "Accesorios para usar todos los días."
- Contador: "{n} piezas en la vidriera" / "{n} de {total} piezas" / "Buscando…".
- Vacío del catálogo: "No encontramos piezas" + pista dinámica + botones "Que tenga alguna" y "Limpiar filtros".
- Carrito: "Tu carrito", "Después de confirmar vas a poder enviarnos el pedido por WhatsApp para coordinar.", "Tu carrito está vacío", "Mirá la vidriera y tocá una pieza para agregarla."
- Confirmación: "No se cobra nada ahora: el pedido queda pendiente hasta que lo coordinemos." Hint del teléfono: "Con código de área. Lo usamos solo para coordinar este pedido."
- Errores del pedido: "Escribí tu nombre así sabemos a quién le preparamos el pedido.", "El nombre es muy corto. Escribí al menos 2 letras.", "Necesitamos un teléfono para coordinar por WhatsApp.", "Revisá el número: tiene que tener entre 8 y 13 dígitos, con código de área (ej. 351 555-1234)."
- Stock en el carrito: "{nombre}: se agotó. Quitalo del carrito para seguir.", "{nombre}: quedan {n} y pediste {m}. Bajá la cantidad."
- Mensaje de WhatsApp por defecto: `¡Hola! Te escribo por mi pedido {pedido} de L&S.\n\n{items}\n\nTotal: {total}\nNombre: {nombre}\n\n¡Gracias!` con ítems `• {cant} × {nombre} — {subtotal}`.
- Formulario de producto: errores "Poné un nombre: es lo que ve el cliente en la vidriera.", "Ingresá un precio mayor a $0, solo con números.", "Ingresá el costo (puede ser 0). Solo lo ves vos.", "Ingresá cuántas unidades tenés (0 si está agotado).", "Agregá al menos una imagen: la primera va a ser la portada." Hint "El costo solo se ve en el panel, nunca en el catálogo." Margen: "Ganancia por unidad", "{p}% del precio" u "Ojo: el precio está por debajo del costo".
- Pedido: confirmación de cancelación "Ya estaba vendido: se van a reponer {n} unidades al stock. Después no se puede volver a vender." / "Todavía no se vendió, así que el stock no cambia. Un pedido cancelado no se puede volver a vender."

El resto de los textos está en `main.html`; buscar por la cadena visible.

## 5. Formatos
- Dinero: `'$' + Math.round(n).toLocaleString('es-AR')` → `$14.500`. Sin centavos.
- Número de pedido: `'#' + String(n).padStart(4, '0')` → `#0007`.
- Fecha corta: `15 oct, 09:12`. Fecha del resumen: `Miércoles 15 de octubre`.
- Normalización para búsquedas: minúsculas, sin tildes (`NFD` y quitar diacríticos), sin espacios a los costados.
- Normalización de etiquetas: `trim`, minúsculas, espacios múltiples → uno.

## 6. Reglas de negocio que muestra el prototipo

1. Catálogo: solo productos activos. Los agotados se muestran **al final** de la grilla.
2. Filtro "todas" (Y) y "alguna" (O). Chips disponibles: etiquetas usadas por algún producto activo y no seleccionadas. **Contadores**: en modo "todas" con selección, cuentan sobre los resultados actuales; si no, sobre los activos que pasan la búsqueda por nombre. Chip con contador 0 se ve atenuada (`opacity .36`).
3. Enter en el buscador de etiquetas agrega la coincidencia exacta o la primera.
4. Desde el detalle, tocar una etiqueta lleva al catálogo filtrado solo por esa etiqueta en modo "todas".
5. Carrito: no se puede pasar del stock. Si se pide más, se agrega lo que queda con aviso "Solo quedaban N; agregamos esa cantidad."
6. Confirmar: valida nombre (≥ 2 letras) y teléfono (8 a 13 dígitos). Si hay problemas de stock, no deja confirmar y ofrece "Ajustar al stock disponible".
7. El pedido guarda precio y costo unitario del momento. Queda **pendiente**.
8. Marcar vendido: solo desde pendiente; si algún ítem no tiene stock, el botón se deshabilita y aparece "No alcanza el stock". Descuenta todo en una acción y muestra el delta.
9. Cancelar: desde pendiente (stock sin cambios) o desde vendido (repone stock y muestra el delta). Cancelado es final.
10. Stock bajo: activo y stock ≤ 3. Pills: "Agotado", "Quedan N", "N en stock".
11. Ventas del mes: pedidos **vendidos** cuya fecha de venta cae en el mes actual; total y ganancia (Σ cantidad × (precio − costo)).
12. Producto: precio > 0, costo ≥ 0 (obligatorio), stock ≥ 0 (obligatorio), al menos una imagen. La primera imagen es la portada. Los productos no se borran, se desactivan.
13. Etiquetas en Ajustes: renombrar a una existente **une** ambas; eliminar la quita de todos los productos.

## 7. Lo que el prototipo simula en memoria y hay que reemplazar por Supabase

| Simulación en el prototipo | Dónde (main.html) | Reemplazo real |
|---|---|---|
| `seed()`: 14 productos, 10 etiquetas, 6 pedidos | `seed()` | `supabase/seed.sql` (solo desarrollo), alineado con estos datos |
| Imágenes = ilustraciones `Ph` con tono y tipo | `ph()`, `tone()`, `metal()`, `addImg()` | Fotos reales en Storage (detalle 1600 px + miniatura 400 px). Para las semillas: SVG estáticos generados a partir de `Ph` en `public/seed/` |
| Login que acepta cualquier dato | `doLogin()` | Supabase Auth (email + contraseña), una sola cuenta con `app_metadata.role = 'admin'` |
| Carrito en el estado del componente | `cart` | `localStorage` con `[{productoId, cantidad}]`, sin precios |
| Validación de stock del carrito contra el estado | `stockIssues()` | Relectura de productos desde la base en Carrito/Confirmar + validación final en `crear_pedido` |
| Crear pedido con `nextNo` y precios del estado | `confirmOrder()` | RPC `crear_pedido` (security definer): precios y costos reales, número correlativo de la base |
| Mensaje y enlace de WhatsApp con número editable | `waText()`, `settings.phone` | `src/lib/whatsapp.ts` con plantilla fija y `VITE_WHATSAPP_NUMBER` |
| Marcar vendido / cancelar mutando arrays | `sell()`, `cancelOrder()` | RPC `marcar_vendido` y `cancelar_pedido` (una transacción, con bloqueo de filas) |
| Guardar producto mutando arrays | `saveProduct()` | Subida de imágenes a Storage + RPC `guardar_producto` (producto, costo, etiquetas e imágenes en una transacción) |
| Ajustes de número y plantilla | `saveSettings()` | **No se implementa** (D-01). Número por variable de entorno, plantilla en código |
| Renombrar/unir/eliminar etiquetas | `renameTag()`, `deleteTag()`, `addGlobalTag()` | RPC `renombrar_etiqueta` (une si existe), `delete` sobre `tags` (cascada en `product_tags`), `insert` en `tags` |
| Resumen calculado con todo el estado | `renderVals()` (bloque `sum`) | RPC `resumen_panel` (security invoker, solo admin) |
| Fechas `ts` / `soldTs` | `O()` en `seed()` | `orders.created_at`, `orders.vendido_at`, `orders.cancelado_at` |
| Búsqueda/filtros de admin sobre el estado | bloques `pl`, `ol` | Consultas con filtros en los servicios (estado en la URL) |
| Toast | `flash()` | Componente `Toast` propio en `src/components/` (D-09) |
