# PLAN · L&S

Índice del plan de implementación. Cada etapa tiene su archivo **autocontenido** en `docs/plan/`. Una sesión nueva lee `CLAUDE.md` + el archivo de la etapa en curso y puede trabajar sin más contexto.

## Estado actual

- **Etapa en curso:** 10 · Scroll del catálogo (MVP 2), en `feature/10-scroll-catalogo`. Después sigue la 11 (stock por etiqueta).
- **Etapa 8:** la primera release ya está en `main` (PR #18, merge commit de `develop`; verificado con git el 2026-10-19: `main` y `develop` tienen el mismo contenido). **A confirmar con el usuario** qué quedó hecho de la guía `docs/produccion-paso-a-paso.md`: paso 4 (URL de Auth), checklist de release (5), Worker anti-pausa (7) y abrir la tienda (8). Cuando esté confirmado, verificar producción contra `ls-prod`, completar `<proyecto>` en el README y el checklist, y tildar la etapa 8.
- **Producción:** Supabase `ls-prod` (ref `tcpbmenfkakzlhyidxli`, URL `https://tcpbmenfkakzlhyidxli.supabase.co`, São Paulo, organización `L&S-Emprendimiento`). Cloudflare Pages `ls-accesorios`: producción `https://ls-accesorios.pages.dev` (rama `main`), vista previa `https://develop.ls-accesorios.pages.dev` (rama `develop`).
- **Cómo probar:** el catálogo, contra `ls-dev` con el servidor `dev-local` de `.claude/launch.json` (puerto 5175, usa `.env.local`). El panel, contra el Supabase local: Docker, `npm run db:start`, `npm run db:reset` (pgTAP necesita las semillas intactas) y el servidor `dev-supabase-local` (puerto 5176, usuario `admin@ls.test` de `supabase/seed.sql`). El build de producción se sirve con `preview-dist` (puerto 4173).
- **Supabase en la nube:** proyecto de **desarrollo** `ls-dev` creado (ref `nhsjichuumyflklqkhxw`, URL `https://nhsjichuumyflklqkhxw.supabase.co`, São Paulo, Postgres 17, organización `L&S-Emprendimiento`, plan gratuito). Las 5 migraciones aplicadas con `supabase db push` (verificado el 2026-10-16 por la API: `guardar_producto`, `marcar_vendido`, `renombrar_etiqueta` y `resumen_panel` existen y anon recibe `permission denied`); registro público desactivado; semillas de productos y pedidos cargadas por el usuario. Administradora creada: `1accesorioslis@gmail.com` con rol `admin` (verificado 2026-10-15: es la única cuenta de `auth.users`). **No** correr ahí el bloque final de `supabase/seed.sql` (usuarios de prueba con contraseñas en el repo público). La carpeta local quedó vinculada a ese proyecto (`supabase/.temp/`, ignorado). Producción se crea en la etapa 8 en la misma organización.
- **Al mergear cada etapa con migraciones nuevas:** `npx supabase db push --dry-run` y después `npx supabase db push` contra dev (lo corre el usuario; pide la contraseña de la base).
- **Ojo en Windows:** la carpeta del proyecto no puede tener `&` en la ruta (rompe `npx` y los scripts de npm). Ya se renombró a `L-S` y los scripts volvieron a la forma estándar (D-29).
- **Remoto de GitHub:** https://github.com/Juan-C-Ceballos/L-S-emprendimiento (público). Ramas remotas `main` y `develop`; rama por defecto `develop`. Ruleset activo en las dos: PR obligatorio, checks `frontend` y `base-de-datos`, rama al día antes de mergear, sin force push. Permite squash y merge commit: **hacia `develop` elegir siempre "Squash and merge"**; "Create a merge commit" solo en las releases `develop` → `main` (ver `docs/github-setup.md`, "Estado verificado").

## Etapas

- [x] **0 · Fundación** — [`etapa-00-fundacion.md`](docs/plan/etapa-00-fundacion.md) · `feature/00-fundacion`
  Scaffold Vite + React + TS + Tailwind + shadcn + Router, tokens de diseño, Vitest, ESLint, capa `services/` y cliente de Supabase, CI.
- [x] **1 · Base de datos** — [`etapa-01-base-de-datos.md`](docs/plan/etapa-01-base-de-datos.md) · `feature/01-base-de-datos`
  Migraciones, RLS, `product_costs`, `crear_pedido`, `marcar_vendido`, `cancelar_pedido`, semillas, pgTAP, tipos generados, job de CI de base.
- [x] **2 · Autenticación y panel** — [`etapa-02-auth-panel.md`](docs/plan/etapa-02-auth-panel.md) · `feature/02-auth-panel`
  Login, guardia de rutas, layout del panel, registro público desactivado.
- [x] **3 · Panel de productos** — [`etapa-03-panel-productos.md`](docs/plan/etapa-03-panel-productos.md) · `feature/03-panel-productos`
  Lista, alta, edición, activar/desactivar, costo y margen, etiquetas con autocompletado, imágenes comprimidas en el navegador, Storage.
- [x] **4 · Catálogo público** — [`etapa-04-catalogo-publico.md`](docs/plan/etapa-04-catalogo-publico.md) · `feature/04-catalogo-publico`
  Grilla, filtros todas/alguna con estado en la URL y contadores, búsqueda, detalle con galería, agotados, vista previa del link.
- [x] **5 · Carrito y pedido** — [`etapa-05-carrito-pedido.md`](docs/plan/etapa-05-carrito-pedido.md) · `feature/05-carrito-pedido`
  Carrito en el navegador (sin precios), confirmación, `crear_pedido`, errores de stock y precio, pantalla de éxito y WhatsApp.
- [x] **6 · Panel de pedidos** — [`etapa-06-panel-pedidos.md`](docs/plan/etapa-06-panel-pedidos.md) · `feature/06-panel-pedidos`
  Lista filtrable por estado, detalle, marcar vendido y cancelar.
- [x] **7 · Resumen y Ajustes** — [`etapa-07-resumen-ajustes.md`](docs/plan/etapa-07-resumen-ajustes.md) · `feature/07-resumen-ajustes`
  Pedidos pendientes, ventas del mes, stock bajo; gestión global de etiquetas.
- [ ] **8 · Puesta en producción** — [`etapa-08-produccion.md`](docs/plan/etapa-08-produccion.md) · `feature/08-produccion`
  Supabase de producción, Cloudflare (main = producción, develop = vista previa), Cron anti-pausa, respaldos, runbook, primera release.
- [ ] **9 · Posterior al MVP** (solo documentación) — [`etapa-09-post-mvp.md`](docs/plan/etapa-09-post-mvp.md)
  Topes, captcha, límite por IP, vistas previas por producto, reportes, PWA.

### MVP 2 (pedidos del uso real, desde 2026-10-19)

- [ ] **10 · Scroll del catálogo** — [`etapa-10-scroll-catalogo.md`](docs/plan/etapa-10-scroll-catalogo.md) · `feature/10-scroll-catalogo`
  Al volver de un producto, la grilla queda donde estaba (vidriera en memoria, D-42).
- [ ] **11 · Stock por etiqueta** — [`etapa-11-stock-por-etiqueta.md`](docs/plan/etapa-11-stock-por-etiqueta.md) · `feature/11-stock-por-etiqueta`
  Sección "Por etiqueta" en el Resumen: unidades que quedan y vendidas (mes y total), con las etiquetas que elige la administradora.
- **A decidir:** agregar al carrito desde la grilla (propuesta de diseño). Se vuelve a evaluar después de probar la etapa 10 (D-42).

Dependencias: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8; MVP 2: 10 y 11 son independientes entre sí. La 4 solo necesita la 1 (puede adelantarse a la 2 y la 3 si hiciera falta), y la 6 y la 7 solo necesitan la 2. Se recomienda el orden numérico.

## Qué necesito del usuario (y cuándo)

| Qué | Para qué etapa | Estado |
|---|---|---|
| Crear el repositorio en GitHub | Antes del primer PR (etapa 0) | Hecho: `Juan-C-Ceballos/L-S-emprendimiento` (público) |
| Configurar la protección de ramas y los tipos de merge (ver `docs/github-setup.md`; no hay `gh` CLI) | Antes del primer PR (etapa 0) | Hecho (verificado 2026-10-15) |
| Sumar `base-de-datos` como check requerido y sacar rebase de los métodos de merge | Después del PR de la etapa 1 | Hecho (verificado 2026-10-15) |
| (Opcional) Separar el ruleset: `develop` solo squash, `main` solo merge commit | Antes de la primera release (8) | Opcional |
| Instalar Docker Desktop y dejarlo corriendo | 1 | Hecho: Docker Desktop 29.7, Supabase local funcionando |
| Proyecto de Supabase **de desarrollo**: `project ref`, URL, clave anon, contraseña de la base, token personal (`SUPABASE_ACCESS_TOKEN`) | 1 (al mergear) | Hecho (2026-10-15): `ls-dev`, ref `nhsjichuumyflklqkhxw`, migraciones aplicadas y verificadas por la API con la clave pública (anónimo sin acceso a costos ni pedidos, registro desactivado). La clave pública va en `.env.local` y en las variables del hosting, no en el repo; la contraseña y el token quedan solo en la máquina del usuario |
| Número de WhatsApp de la tienda | 5 | Lo carga la administradora en Ajustes (D-34) después de aplicar la migración `ajustes_whatsapp` a `ls-dev` |
| Email de la administradora | 2 (dev) / 8 (prod) | Dev hecho (2026-10-15): `1accesorioslis@gmail.com`, rol `admin`, creada por el usuario. Prod hecho (2026-10-17): creada por el usuario con rol `admin` (verificado por él con SQL) |
| Proyecto de Supabase **de producción** + cuenta de Cloudflare conectada al repositorio de GitHub | 8 | Hecho (2026-10-17): `ls-prod` y Pages `ls-accesorios`. Pendiente: paso 4 (URL de Auth) |
| Desplegar el Worker anti-pausa (`wrangler login` + `deploy` + 2 secretos) | 8 | Pendiente: paso 7 de la guía |
| Respaldo mensual de `ls-prod` (opción B, D-41) | 8 en adelante | Pendiente: runbook en el README |

## Registro de avance

<!-- Una entrada por sesión o etapa, la más reciente arriba. Formato:
### AAAA-MM-DD · Etapa N · rama
- Hecho: …
- Pendiente: …
- PR: …
-->

### 2026-10-19 · Etapa 10 · `feature/10-scroll-catalogo`
- Contexto: la release del MVP 1 ya está en `main` (PR #18). Con el uso real aparecieron tres pedidos: el scroll del catálogo se pierde al volver de un producto, agregar al carrito desde la grilla, y ver el stock por etiqueta. Se abrió el bloque **MVP 2** (etapas 10 y 11, D-42); lo de la grilla queda a decidir.
- Hecho: causa reproducida contra `ls-dev` con 1,5 s de demora en la red (de 2161 px se volvía a 568 px: el catálogo se montaba con esqueletos y `ScrollRestoration` no tenía alto para restaurar). `listarCatalogo` guarda la última vidriera en memoria (`ultimaVidriera()`) y `CatalogoPage` la pinta mientras refresca; un error al refrescar no tapa los datos. 4 pruebas nuevas. Planes de las etapas 10 y 11 escritos.
- Verificado: lint, typecheck, 202 pruebas y build. En el navegador contra `ls-dev` (375 px, misma demora): volver con "Volver" y con atrás deja la grilla en 2161 px, sin esqueletos, y se mantiene al llegar los datos nuevos; consola sin errores.
- Pendiente: PR contra `develop` y squash con CI en verde.

### 2026-10-17 · Etapa 8 (puesta en marcha) · `fix/guia-produccion`
- Hecho por el usuario: `ls-prod` creado, registro cortado, 5 migraciones aplicadas con `db push --db-url` (Session pooler), administradora con rol `admin`. Pages `ls-accesorios` conectado al repo, variables de Production (`ls-prod`) y Preview (`ls-dev`, sin `VITE_SITE_URL`), vista previa solo de `develop`. El primer deploy de `main` falló como se esperaba (`main` todavía no tiene la app).
- Verificado por la API con la clave publishable de `ls-prod`: tablas creadas y vacías, `settings` con el mensaje por defecto y sin número, costos/pedidos/ítems y funciones de admin con `permission denied` para anon, insert directo en `orders` rechazado, `crear_pedido` valida, bucket `productos` público y subida anónima rechazada, registro cortado. La clave publishable funciona también como `Bearer` (lo que manda el Worker anti-pausa).
- Guía corregida con lo que se vio en el dashboard: cadena en *Connect → Direct → Session pooler*; el flujo de Workers aparece primero y hay que ir a Pages; las variables de la creación valen para los dos entornos; el selector de entorno está arriba de Settings; sacar el `*` de *Include*; no hay deploy manual por rama (sale con un merge).
- Pendiente: lo de "Estado actual".

### 2026-10-16 · Etapa 8 · `feature/08-produccion`
- Prueba E2E antes de producción (sobre `develop` en `cca73de`): lint, typecheck, 195 pruebas, build y `db:test` 162/162 en verde. En el navegador contra el Supabase local: catálogo (filtros Y/O, búsqueda sin tildes, orden por precio, detalle, tope de stock), carrito, errores del formulario, rechazo por stock con "Ajustar al stock disponible" (sin crear pedido), pedido válido con precio y costo puestos por la base y stock sin tocar, link `wa.me` correcto con número cargado en Ajustes; seguridad anónima (costos, pedidos, insert/patch, RPC de admin, subida a Storage y registro: todo rechazado); panel (login incorrecto/correcto, vender descuenta y bloquea otro pedido sin stock, cancelar un vendido repone, resumen coincide, alta con 2 fotos achicadas a 1600/400 px, edición de portada/foto/precio con borrado en Storage, desactivar lo saca del catálogo, salir protege las rutas). Contra `ls-dev` (solo lectura): las 5 migraciones están, registro cortado, fotos públicas. Build de producción servido con `vite preview` contra `ls-dev` sin errores en consola. Detalle encontrado: "se van a reponer 1 unidad" (singular), arreglado en `fix/texto-reponer-singular` (PR #15).
- Hecho: verificación de documentación vigente de Cloudflare y Supabase (D-41): sitio en **Pages** por las variables de build por entorno; sin `_redirects` (fallback de SPA por defecto); `public/_headers`; `og:image` absoluta con `VITE_SITE_URL` (plugin en `vite.config.ts`); Worker `workers/keepalive/` (cron diario 12:00 UTC, consulta `tags` con la clave pública, lanza si falla) con 4 pruebas y probado con `wrangler dev --test-scheduled` contra el Supabase local; respaldo manual (opción B: el repo es público); migraciones a producción con `db push --db-url` para no vincular la carpeta a `ls-prod`. README con el runbook de producción, `docs/release-checklist.md` completo, `docs/produccion-paso-a-paso.md` para el usuario. D-08 actualizada (cron diario) y `CLAUDE.md` alineado.
- PR #16, mergeado con squash. Los pasos del usuario siguen en la entrada de 2026-10-17.

### 2026-10-16 · Arreglo · `fix/texto-reponer-singular`
- Hecho: la confirmación de cancelar un pedido vendido decía "se van a reponer 1 unidad"; ahora dice "se va a reponer 1 unidad" (y sigue en plural con varias). Prueba nueva en `src/lib/pedidos.test.ts`. Lo encontró la prueba E2E previa a producción.
- PR #15, mergeado con squash.

### 2026-10-16 · Ajustes antes de producción · `feature/mejoras-catalogo-panel`
- Hecho (pedidos de la dueña): logo centrado en el login; sello del logo (`public/logo-sello.webp`, sin el marco cuadrado) en el header del cliente y en la barra lateral del panel; en el teléfono, 8 etiquetas y "Ver todas (N)" / "Ver menos"; orden del catálogo por "Más nuevos", "Menor precio" y "Mayor precio" (en la URL, agotados siempre al final); "Nuevo producto" y la confirmación de cancelar pedido centrados. D-40.
- Verificado: lint, typecheck, 195 pruebas y build. En el navegador: catálogo contra `ls-dev` en 390 px (sello en el header, 8 etiquetas + "Ver todas (11)" → 11 y "Ver menos", "Menor precio" ordena $8.900 → $26.900 con los agotados al final) y en 1280 px (todas las etiquetas, sin botón; "Mayor precio"); panel contra el Supabase local en 1280 px (login centrado, logo en la barra lateral, "Nuevo producto" a 392 px de cada lado, confirmación de cancelar centrada, sin confirmar).
- Pendiente: ~~PR contra `develop` y squash con CI en verde~~ (hecho: PR #14).

### 2026-10-16 · Etapa 7 · `feature/07-resumen-ajustes`
- Hecho: migración `resumen_y_etiquetas` (`resumen_panel` con pendientes, stock bajo y ventas del mes en hora de Buenos Aires; `renombrar_etiqueta` que une sin duplicar) + `09_resumen_y_etiquetas.test.sql` (24 pruebas, incluido el borde de mes con fechas fijas); tipos regenerados. `src/services/resumen.ts` (`obtenerResumen`, `obtenerDatosResumen`), `src/services/etiquetas.ts` (`listarEtiquetasAdmin`, `crearEtiqueta`, `renombrarEtiqueta`, `eliminarEtiqueta`). `ResumenPage` (fecha, tres tarjetas con links a las listas filtradas, "Para atender" y "Para reponer" con sus vacíos) y Ajustes > Etiquetas (`GestionEtiquetas` + `FilaEtiqueta`: crear, renombrar en el lugar con aviso de unión, Enter/Escape, eliminar con confirmación). `useAsync` devuelve `previos`. Placeholders borrados. D-39.
- Verificado: lint, typecheck, 192 pruebas, build, `db:test` 162/162 y `db:lint`. En el navegador contra el Supabase local como `admin@ls.test`: Resumen con las semillas (2 pendientes por $67.700; stock bajo 2 con 1 agotado; ventas de octubre $82.000, 2 pedidos, ganancia $51.200, igual al cálculo a mano); vender #0006 y volver: 1 pendiente y ventas $111.000 / ganancia $69.800; renombrar "acero" a "Dorado" unió las dos (dorado en 11 productos) y el catálogo público dejó de mostrar "acero"; eliminar "perlas" la quitó de 2 productos sin borrarlos. Base local reseteada a las semillas al terminar. El panel del navegador estaba oculto: no hay capturas, las acciones se dispararon desde la página.
- Pendiente: ~~PR contra `develop` y squash con CI en verde; después, `db push` de la migración a `ls-dev`~~ (hecho: PR #13 y el arreglo #12; `develop` en verde; migración aplicada en `ls-dev`, verificado: anon recibe `permission denied` en `resumen_panel`).

### 2026-10-16 · Etapa 6 · `feature/06-panel-pedidos`
- Hecho: `src/lib/pedidos.ts` (búsqueda por cliente sin tildes o por número con prefijo, filtro por estado, contadores, vacíos del prototipo, ganancia, faltantes, texto de cancelar, teléfono para `wa.me`). Servicios `listarPedidosAdmin` (últimos 500), `contarPendientes`, `obtenerPedido` (ítems con precio y stock actuales y miniatura), `marcarVendido` y `cancelarPedido` (errores `stock_insuficiente` con el detail JSON, `estado_invalido`, `sin_acceso`, `pedido_inexistente`). `PedidosPage` (estado y búsqueda en la URL, chips con contador) y `PedidoDetallePage` (tarjeta Cliente/Teléfono con `tel:` y "Escribir por WhatsApp", ítems con "Precio actual" y "Stock actual", ganancia, alerta de stock, vender, cancelar con confirmación inline, aviso verde con `desde → hasta`, relectura después de cada acción). Componentes `FilaPedido`, `PillEstado`, `AvisoDelta`, `ConfirmacionInline`. Badge de pendientes en la tab Pedidos. D-38.
- Verificado: lint, typecheck, 178 pruebas, build y `db:test` 138/138 (después de `db:reset`). En el navegador contra el Supabase local como `admin@ls.test` (390 px): Pendientes #0006 y #0005, contadores 2/3/1/6 y badge 2; #0001 con "Precio actual: $14.500" y ganancia $20.200; vender #0005 bajó Collar corazón 7 → 6 y Pulsera eslabón fino 2 → 1, aviso verde, toast y badge 1; cancelarlo repuso 6 → 7 y 1 → 2 y quedó sin acciones; con dos pedidos de 2 pulseras, vender uno deja el otro con "No alcanza el stock", stock en rojo y el botón deshabilitado, y llamar a `marcar_vendido` a la fuerza devuelve `stock_insuficiente` sin cambiar nada; `#0006` y `lucia` encuentran su pedido. El aspecto en escritorio no se miró en captura (el panel del navegador estaba oculto); usa el mismo layout que Productos.
- Pendiente: ~~PR contra `develop` y squash con CI en verde~~ (hecho: PR #11). Después del merge, `frontend` falló en `develop` por una prueba intermitente de la etapa 4: arreglada en `fix/prueba-titulo-pestana`.

### 2026-10-16 · Etapa 5 · `feature/05-carrito-pedido`
- Hecho: `src/services/carrito.ts` (localStorage `ls:carrito:v1`, solo producto y cantidad, Zod al leer) + `CarritoProvider`/`useCarrito` con sincronización entre pestañas. `src/lib/carritoReglas.ts` (problemas de stock con los textos del prototipo, rechazo de la base → avisos, ajustar al stock, total). `obtenerProductosPorIds` y `src/services/pedidos.ts` (`crearPedido` con `PedidoRechazado`, último pedido en sessionStorage). `esquemaConfirmacion` (D-25) y `formatearTelefonoTienda`. Detalle conectado (stepper con tope `stock − enCarrito`, toasts, "Ya tenés N en el carrito", "Ya tenés todo el stock"), badge del header, barra "Ver carrito" en el catálogo, `CarritoPage`, `ConfirmarPage` (alerta de stock con "Ajustar", aviso de precio cambiado, "Confirmando…", doble clic bloqueado) y `PedidoConfirmadoPage` (vista previa del mensaje y link `wa.me` con el número de Ajustes; sin número, sin botón). Puntos de extensión comentados (tope por pedido, captcha). D-37.
- Verificado: lint, typecheck, 154 pruebas y build. En el navegador contra `ls-dev` (390 px y 1280 px): agregar desde el detalle respeta el stock y localStorage guarda solo `productoId` y `cantidad`; badge y barra con el total ($52.300 para 2 × 18.900 + 14.500); carrito fiel al prototipo; quitar en otra pestaña actualiza esta; Confirmar con campos vacíos muestra los errores del prototipo sin llamar a la base.
- Pedido real en `ls-dev` (con permiso del usuario): carrito con 2 × "Pulsera eslabón fino" → Confirmar con nombre "Prueba Claude" y teléfono ficticio `351 000-0000` → pedido **#0007** pendiente por $37.800; pantalla de éxito con la vista previa y el link `https://wa.me/5493885725887?text=…` correcto (no se abrió); el carrito quedó vacío; el stock de la pulsera siguió en 2; anon sigue sin poder leer `orders` (401). **El usuario cancela ese pedido** desde Supabase o desde el panel de pedidos (etapa 6).
- No verificado en el navegador: los rechazos por stock y por precio contra la base (cubiertos por `ConfirmarPage.test.tsx` y por las pgTAP de `crear_pedido`), ni `precio_unitario`/`costo_unitario` del pedido #0007 (anon no puede leer `orders`; se ve en el panel de Supabase).
- Pendiente: ~~PR contra `develop` y squash con CI en verde~~ (hecho: PR #10, `develop` en verde). Cancelar el pedido de prueba #0007 de `ls-dev`.

### 2026-10-16 · Etapa 4 · `feature/04-catalogo-publico`
- Hecho: `src/lib/filtros.ts` (URL ida y vuelta con comas legibles, Y/O, búsqueda sin tildes, agotados al final, contadores con la regla del prototipo, pista del vacío, texto del contador) con 17 pruebas. `listarCatalogo` (devuelve `Vidriera`: productos + etiquetas en orden) y `obtenerProductoPublico` en `src/services/productos.ts`, con pruebas. `CatalogoPage` (hero, filtros en la URL, chips con contador y atenuadas en 0, buscador de etiquetas con Enter, "Limpiar filtros", esqueletos, error con "Reintentar", vacío con "Que tenga alguna") y `ProductoPage` (galería con snap, contador y puntos; etiquetas que llevan a `/?tags=x`; nota de stock; stepper y "Agregar al carrito" deshabilitado; "Esta pieza ya no está disponible"). Componentes en `src/components/catalogo/`. Header con "Volver" y `ScrollRestoration`. Título de pestaña por página. Open Graph en `index.html` + `public/og.jpg` (1200 × 630, generado con `scripts/generar-og.html`). D-36.
- Verificado: lint, typecheck, 122 pruebas y build. En el navegador contra `ls-dev` (390 px y 1280 px): 14 activos (las 13 semillas + un producto de prueba de la administradora), "Anillo piedra verde" no aparece ni abre por URL, "Aros gota martillada" al final con "Agotado"; `?tags=aros,dorado` da 2 y con `modo=alguna` 9; `?q=pérla` encuentra "Aros perla mini"; vacío con pista y botones; detalle de "Pulsera eslabón fino" con "Últimas 2 unidades", puntos y deslizamiento sincronizados; "Volver" recupera filtros y scroll; columna de filtros sticky de 288 px y grilla de 4 en escritorio.
- Pendiente: ~~PR contra `develop` y squash con CI en verde~~ (hecho: PR #9, `develop` en verde). Probar la vista previa con un validador de Open Graph cuando el sitio esté desplegado (etapa 8 completa `og:image` con URL absoluta).

### 2026-10-16 · Etapa 3 · `feature/03-panel-productos`
- Hecho: migración `storage_y_guardar_producto` (bucket público `productos`, solo JPEG hasta 2 MB, políticas solo admin; RPC `guardar_producto` en una transacción con validaciones, etiquetas normalizadas, imágenes sincronizadas y `paths_quitados`) + `08_storage_y_guardar_producto.test.sql`; tipos regenerados. `src/lib/{imagenes,productos,constantes}.ts`, esquema Zod del producto, `src/services/{imagenes,productos,etiquetas}.ts`. `ProductosPage` (búsqueda con espera, chips con contadores, filtro y búsqueda en la URL, vacíos del prototipo) y `ProductoFormPage` (precio/costo/margen en vivo, stock, imágenes con subida, portada, orden y quitar, etiquetas con autocompletado y "Crear «x»", interruptor activo, barra Cancelar/Guardar, `?desde=resumen`). Componentes `BuscadorConEspera`, `FilaProducto`, `PillStock`, `MargenGanancia`, `EditorImagenes`, `EditorEtiquetas`, `InterruptorActivo`. D-35.
- Verificado en local: `db:reset`, `db:test` 138/138, `db:lint`; lint, typecheck, 89 pruebas y build. En el navegador contra Supabase local: alta con 2 fotos (4 JPEG en Storage, 1600 y 400 px de lado largo, horizontal y vertical), portada y etiqueta nueva guardadas en orden; quitar una imagen borra la fila y sus 2 archivos; cancelar después de subir borra la foto; anon recibe 403 al subir y no puede listar el bucket; lista y formulario en 375 px. Bug encontrado y arreglado: buscar justo después de cambiar el filtro lo perdía.
- Pendiente: ~~PR contra `develop` y squash; después, `db push` de la migración a `ls-dev`~~ (hecho: PR #8 y migración aplicada). Probar con fotos reales de celular (las de prueba eran imágenes lisas: el peso típico de 100–300 KB no se pudo medir).

### 2026-10-15 · Ajustes de WhatsApp · `feature/ajustes-whatsapp`
- Hecho: migración `ajustes_whatsapp` (tabla `settings` de una fila con RLS: lectura pública, edición solo admin) + `supabase/tests/07_settings.test.sql`; tipos regenerados. `src/lib/whatsapp.ts` (`armarMensaje`, `enlaceWhatsApp`, mensaje original, pedido de ejemplo), `src/lib/esquemas.ts` (Zod con los mensajes del prototipo), `src/services/ajustes.ts`, y `AjustesPage` con número, mensaje, "Insertar dato", "Volver al mensaje original", vista previa, "Descartar" y "Guardar número y mensaje". Se eliminó `VITE_WHATSAPP_NUMBER`. D-34 (reemplaza D-01); planes de las etapas 5, 7, 8 y 9 actualizados.
- Verificado en local: `db:reset`, `db:test` 111/111, `db:lint`; lint, typecheck, 60 pruebas y build. En el navegador contra Supabase local: guardar el número `+54 9 351 555-1234` lo deja como `5493515551234` y sobrevive a recargar; vista previa y tabs en 375 px.
- Pendiente: PR #7 contra `develop` (squash). Al mergear, aplicar la migración a `ls-dev` (`npx supabase db push --dry-run` y `npx supabase db push`) y cargar el número real en Ajustes.

### 2026-10-15 · Marca · `feature/marca-logo-paleta`
- Hecho: logo del emprendimiento recortado en cuadrado según su marco (`public/logo.webp`, fondo transparente) y usado en el login; favicon e ícono de iOS con el monograma; paleta bronce/champán en `src/index.css` con tokens renombrados (`vino` → `bronce`, `rosa*` → `champan*`). D-33.
- Verificado: lint, typecheck, 47 pruebas y build; catálogo y login en 375 px contra `ls-dev`.
- PR #6, mergeado con squash.

### 2026-10-15 · Etapa 2 · `feature/02-auth-panel`
- Hecho: usuarios de prueba en `supabase/seed.sql` (`admin@ls.test` con rol admin y `vendedora@ls.test` sin rol). `src/services/auth.ts` (`ingresar`, `salir`, `obtenerSesion`, `escucharSesion`) con errores `credenciales`, `sin_acceso` (cierra la sesión) y `sin_conexion`. `SesionProvider` + `useSesion` (solo en `/admin/*`), `RutaProtegida` con pantalla neutra mientras carga y `?volver=`. `IngresarPage` con Zod, "Ingresando…", Enter y redirección (solo a rutas `/admin`). `PanelLayout` + `HeaderPanel` + `NavPanel` (tabs abajo en móvil solo en las 4 secciones, barra lateral de 220 px en `lg`, prop `pendientes` para el badge) + `BotonSalir`; título, "Volver" y acción del header en el `handle` de cada ruta. README: sección "Administradora".
- Arreglo: `[auth.email] enable_signup` en `true` (con `false` el CLI apaga el proveedor de email y nadie podía ingresar). El registro sigue cortado por `[auth] enable_signup = false` (D-31).
- Verificado en local: `db:reset` desde cero, `db:test` 98/98; lint, typecheck, 47 pruebas y build en verde. En el navegador contra Supabase local: `/admin/productos` sin sesión → `/admin/ingresar?volver=/admin/productos`; `vendedora@ls.test` rechazada sin quedar logueada; contraseña incorrecta muestra el error sin borrar el email; admin entra y vuelve a Productos; recargar mantiene la sesión; tabs en 375 px y barra lateral en 1280 px; "Salir" vuelve al login.
- Decisiones nuevas: D-31.
- Después: el usuario creó la administradora en `ls-dev` (`1accesorioslis@gmail.com`) y cargó las semillas de productos. Verificado por la API y por SQL: 13 productos, costos inaccesibles para anon, registro desactivado, única cuenta con rol `admin`. `.env.local` pasa a apuntar a `ls-dev` (D-32).
- Pendiente: PR contra `develop` y squash merge con CI en verde (no hay migraciones nuevas: no hace falta `db push`).

### 2026-10-15 · Cierre de sesión · `fix/docs-estado-github`
- Hecho: etapa 1 mergeada (PR #2, squash) y CI de `develop` en verde. El usuario sumó `base-de-datos` como check requerido y dejó el ruleset con squash y merge (sin rebase); verificado con la API. Limpieza local: ramas `feature/00` y `feature/01` borradas, `develop` al día, Supabase local apagado. Actualizados `PLAN.md` y `docs/github-setup.md`.
- Después: proyecto de Supabase de desarrollo creado (`ls-dev`) y migraciones aplicadas por el usuario (`supabase link` + `db push`); verificado por la API.
- Pendiente: proyecto de producción (etapa 8). La etapa 2 la arranca el usuario en otra sesión.

### 2026-10-15 · Etapa 1 · `feature/01-base-de-datos`
- Hecho: Supabase CLI 2.121 como devDependency, `supabase/config.toml` (registro desactivado, `site_url` en 5173) y scripts `db:*`. Migración `esquema_inicial`: 7 tablas con CHECKs, índices, `es_admin()`, `set_updated_at`, `revoke` de permisos por defecto y RLS con políticas en todas. Migración `funciones_pedidos`: `crear_pedido` (security definer), `marcar_vendido` y `cancelar_pedido` (security invoker, solo admin, bloqueo de productos ordenado por id). Semillas del prototipo con UUID fijos, 31 SVG en `public/seed/` (`scripts/generar-placeholders.mjs`) y 6 pedidos. 98 pruebas pgTAP en 7 archivos. `src/types/database.ts` generado y `src/types/dominio.ts`. Job `base-de-datos` en el CI.
- Verificado en local: `db:reset` desde cero, `db:lint` sin errores, `db:test` 98/98, tipos al día; lint, typecheck, test y build del frontend en verde. Por la API REST con la clave anon: 13 productos, `permission denied` en `product_costs` y `orders`, y `crear_pedido` responde.
- Decisiones nuevas: D-30 (detalles de la base). D-29 actualizada (carpeta renombrada a `L-S`, scripts estándar).
- Pendiente: CI en verde en el PR y merge con squash; sumar `base-de-datos` como check requerido; aplicar migraciones al Supabase de desarrollo cuando exista.

### 2026-10-15 · Etapa 0 · `feature/00-fundacion`
- Hecho: scaffold Vite 8 + React 19 + TypeScript 6 estricto (`noUncheckedIndexedAccess`, alias `@`); Tailwind v4 con los tokens del prototipo en `src/index.css`; shadcn/ui (Radix + Nova) con `button` (variantes `default`, `ghost`, `wa`, `danger`, `dangerSolid`; tamaño `sm`), `input`, `label`, `textarea` con el look de L&S; React Router 8 con todas las rutas y páginas placeholder + 404; `HeaderCliente`, `Logo`, `LayoutCliente`, `ToastProvider`/`useToast`; `env.ts` (Zod) con pantalla "Falta configurar el sitio"; `supabase.ts` tipado; `ErrorServicio` + `desdeErrorSupabase`; `formato.ts`; `useAsync`; ESLint `strictTypeChecked` con `no-restricted-imports` para Supabase fuera de `src/services/`; Vitest (30 pruebas); CI `.github/workflows/ci.yml` con el job `frontend`.
- Verificado en local: `npm ci`, lint, typecheck, test y build en verde; en el navegador, header con Bricolage Grotesque, `&` en `#9A4E5E`, fondo `#FBF4F1`; sin variables de entorno muestra "Falta configurar el sitio".
- Decisiones nuevas: D-28 (diferencias del scaffold y de shadcn v4 con el plan) y D-29 (scripts con `node node_modules/…` por el `&` de la ruta en Windows).
- Ajuste posterior (mismo PR): carpeta renombrada a `L-S`, scripts de npm de vuelta a la forma estándar y D-29 actualizada.
- Pendiente: merge con squash a `develop` (PR #1, CI en verde).

### 2026-10-15 · Preparación · `main`
- Hecho: repositorio git con `main` → `develop` → `feature/00-fundacion`; prototipo desempaquetado en `prototype/` (`src/main.html` es el código legible); `docs/ls-mvp.html` movido a `docs/`; `docs/prototype-analysis.md`, `docs/decisions.md` (D-01 a D-27), `docs/github-setup.md`, `docs/release-checklist.md` (v1); `README.md`, `CLAUDE.md`, `.env.example`, `.gitignore`, `.nvmrc`, plantilla de PR; plan por etapas.
- Repo recreado para borrar del historial el número de WhatsApp del prototipo (reemplazado por `+54 9 11 0000-0000`); GitHub configurado por el usuario y verificado.
- Pendiente: según las etapas.

## Dónde quedé y qué sigue

<!-- Usar solo si una sesión se corta a mitad de etapa. Borrar cuando se retome. -->
_Sin trabajo a medio hacer._
