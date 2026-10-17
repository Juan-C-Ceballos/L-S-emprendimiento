# Etapa 9 · Posterior al MVP (solo documentación)

> **No se implementa nada de esta etapa** sin un pedido explícito del usuario. Cada ítem describe el punto de extensión que el MVP dejó previsto, para que cuando llegue el momento sea "agregar una pieza, no rediseñar" (`docs/ls-mvp.html`). Cuando se decida implementar uno, se crea su propio archivo `docs/plan/etapa-NN-*.md` con el formato habitual y una rama `feature/NN-…`.

## 1. Topes por pedido
- **Qué**: máximo de productos distintos y de unidades por producto en un pedido.
- **Dónde**: validación en `crear_pedido` (fuente de verdad) + mensaje amable en `src/services/carrito.ts` (punto marcado con comentario en la etapa 5). Valores en una constante SQL o en una tabla `settings`.
- **Pruebas**: pgTAP rechazando pedidos sobre el tope.

## 2. Captcha invisible y límite por IP
- **Qué**: Cloudflare Turnstile + máximo de pedidos por IP (ej. 3 por hora) guardando un **hash** de la IP, nunca la IP.
- **Cómo** (diseño del documento): una función chica de Cloudflare (`/api/pedidos`) recibe el pedido y el token de Turnstile, valida el token con la API de Turnstile, cuenta pedidos recientes por hash de IP (tabla `pedidos_ip (hash, created_at)` con RLS solo para `service_role`, o un KV de Cloudflare), y recién ahí llama a `crear_pedido` con una clave de servidor. Después: `revoke execute on function public.crear_pedido from anon;`.
- **Punto de extensión ya listo**: `src/services/pedidos.ts → crearPedido()` es el único lugar que conoce el transporte (D-07).
- **Cuidado**: la clave que use la función de Cloudflare va en sus *secrets*, nunca en el repo ni en variables `VITE_`.

## 3. Vistas previas por producto
- **Qué**: al compartir `/producto/:id` por WhatsApp o Instagram, mostrar foto, nombre y precio.
- **Cómo**: una función de Cloudflare solo para `/producto/*` que, si el `User-Agent` es un rastreador (o siempre), inyecta metatags Open Graph en el `index.html` leyendo el producto con la clave anon. Sumar un slug legible (D-20) en ese momento.

## 4. Reportes
- Ventas por período, más vendidos, ventas por etiqueta, stock bajo histórico, y ganancia (precio − costo) por producto y por período.
- **Base**: `order_items` ya guarda `precio_unitario` y `costo_unitario` del momento, así que los reportes son consultas o RPC `security invoker` con chequeo `es_admin()`. Sin tablas nuevas.
- **Pantalla**: sección "Reportes" en el panel; evaluar si hace falta una librería de gráficos (justificar en `docs/decisions.md`).

## 5. PWA del panel
- `manifest.webmanifest` con íconos de L&S y `start_url: /admin`, y un service worker mínimo (o `vite-plugin-pwa`, justificado). Sin caché offline de datos al principio: solo instalable.

## 6. Otros ítems del documento
- **Filtro "pendientes de más de 7 días"** en Pedidos: filtro en `src/lib/pedidos.ts` + chip nueva. Muy chico.
- **Aviso de WhatsApp sin configurar** en el Resumen: si `settings.whatsapp_numero` está vacío, una tarjeta "Cargá el número de WhatsApp en Ajustes" (los clientes igual pueden pedir, pero no ven el botón; D-37, D-39). Muy chico.
- **Colecciones o sets**: tabla `collections` + `collection_products`, con RLS como `products`.
- **Pagos online y variantes** (talle, color): tablas nuevas (`product_variants`, `payments`) sin tocar las existentes; `order_items` sumaría `variant_id` nullable.
- ~~**Ajustes editables**~~: adelantado al MVP (D-34).
- **Dominio propio**: comprarlo, configurarlo en Cloudflare, actualizar *Site URL* y *Redirect URLs* de Supabase Auth, `og:image` y redirigir el subdominio viejo.
- **Paginación** de pedidos y productos en el panel cuando superen ~500 (D-11 y etapa 6).
- **E2E con Playwright** (D-18) cuando haya más flujos.
- **CSP** estricta en `public/_headers`.
