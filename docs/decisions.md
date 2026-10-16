# Decisiones y contradicciones

Registro de todo lo que no estaba cerrado en `docs/ls-mvp.html`, en el pedido inicial o en el prototipo.
Regla: **el documento manda en lo funcional y el prototipo en lo visual**. Si algo es ambiguo, se elige lo más simple y se anota acá.
Formato: `D-NN`. No se reutilizan números. Para revertir una decisión, agregá una nueva que la reemplace.

---

## Contradicciones entre el prototipo y el documento

### D-01 · Ajustes: número y mensaje de WhatsApp editables
- **Prototipo**: la pantalla Ajustes permite editar el número de WhatsApp y la plantilla del mensaje (con `{pedido}`, `{items}`, `{total}`, `{nombre}`), y los guarda.
- **Documento y pedido inicial**: el número sale de una variable de entorno. El documento no menciona plantillas editables.
- **Decisión**: número en `VITE_WHATSAPP_NUMBER` (solo dígitos, con código de país, ej. `549…`). Plantilla **fija en código** (`src/lib/whatsapp.ts`), igual al mensaje por defecto del prototipo. Ajustes muestra el número **en modo lectura** con la nota "Se cambia en la configuración del sitio" y conserva solo la gestión de etiquetas.
- **Punto de extensión**: una tabla `settings` (clave/valor, solo admin para escribir y lectura pública de claves permitidas) si algún día hace falta editarlos desde el panel.

### D-02 · Gestión global de etiquetas (renombrar, unir, eliminar)
- **Prototipo**: Ajustes tiene alta, renombrado (si el nombre ya existe, une las dos) y eliminación de etiquetas.
- **Documento**: solo pide "etiquetas con autocompletado" en el formulario de producto. No lo prohíbe.
- **Decisión**: se implementa, pero en la **etapa 7** (junto al Resumen) para no agrandar la etapa 3. Renombrar/unir se hace con la RPC `renombrar_etiqueta` (atómica). Eliminar es un `delete` en `tags` con `on delete cascade` en `product_tags`. Los productos nunca se borran; las etiquetas sí.

### D-03 · Búsqueda por nombre en el catálogo
- **Prototipo**: el catálogo tiene buscador por nombre además del filtro por etiquetas.
- **Pedido inicial**: la URL tiene `?tags=a,b&modo=todas`. No menciona búsqueda.
- **Decisión**: se implementa (es gratis porque el catálogo filtra en el navegador) y se agrega `q` a la URL: `/?q=perla&tags=aros,dorado&modo=todas`. Valores de `modo`: `todas` (por defecto, se omite de la URL) y `alguna`. El prototipo usa `all`/`any` internamente; en la app se usan los nombres en español.

### D-04 · Fecha de venta y de cancelación
- **Prototipo**: usa la fecha de venta (`soldTs`) para "Ventas de {mes}" y para "Vendido el {fecha}".
- **Modelo del documento**: `orders` solo tiene `fecha`.
- **Decisión**: `orders` agrega `vendido_at timestamptz null` y `cancelado_at timestamptz null`, que completan `marcar_vendido` y `cancelar_pedido`. `fecha` se llama `created_at`. Ventas del mes = pedidos con estado `vendido` y `vendido_at` dentro del mes calendario actual en `America/Argentina/Buenos_Aires`.

### D-05 · Miniatura de cada imagen
- **Documento**: `product_images (id, product_id, url, orden)` pero pide detalle de 1600 px y miniatura de 400 px.
- **Decisión**: `product_images` guarda `path` (ruta del detalle en Storage) y `path_miniatura`. Las URL públicas se arman en `src/services/imagenes.ts` con `getPublicUrl`, así cambiar de bucket o de CDN no requiere migrar datos. La portada es la imagen con `orden = 0`.

### D-06 · Precio mayor a cero
- **Pedido inicial**: `CHECK (precio >= 0)`. **Prototipo**: exige precio mayor a $0.
- **Decisión**: la base mantiene `precio >= 0` como se pidió. El formulario (Zod) exige `precio > 0`. El costo puede ser 0.

### D-07 · "El endpoint de servidor queda desde el inicio"
- **Documento**: en la tabla de decisiones dice que el endpoint de servidor queda desde el inicio, pero en Seguridad dice que en el MVP el navegador llama directo a `crear_pedido`.
- **Decisión**: en el MVP el navegador llama directo a la RPC. El punto de extensión es `src/services/pedidos.ts → crearPedido()`, la única función que conoce el transporte. Cuando se sumen captcha y límite por IP, se cambia esa función para llamar a una función de Cloudflare y se revoca `execute` de `crear_pedido` para `anon`.

### D-08 · Frecuencia del chequeo contra la pausa
- **Documento**: dice "cada pocos días, por ejemplo cada tres" y en la tabla de opciones "chequeo programado semanal".
- **Decisión**: cada 3 días (Supabase pausa tras 7 días sin actividad; semanal deja demasiado poco margen). Se confirma en la etapa 8 con la documentación vigente.

### D-24 · Detección de "precio cambiado" sin que el cliente mande precios
- **Documento**: "El cliente nunca manda precios" y, a la vez, "si entre que agregó algo y confirmó cambió un precio, la función lo detecta y se lo muestra antes de guardar".
- **Decisión**: `crear_pedido` recibe un parámetro opcional `p_total_esperado` (el total que el cliente vio en pantalla, leído de la base al abrir Confirmar). **Nunca se usa para calcular nada**: la función calcula el total con los precios reales y, si difiere del esperado, devuelve el error `precio_cambiado` con los precios actuales y no inserta. Los precios guardados siempre son los de la base.

---

## Decisiones técnicas

### D-09 · Sin librerías extra de UI más allá de shadcn
- Toasts: componente propio (`src/components/Toast.tsx` + contexto), ~40 líneas, con el estilo del prototipo. No se agrega `sonner`.
- Formularios: inputs controlados + Zod. **No** se usa `react-hook-form` ni el componente `Form` de shadcn (lo requiere).
- Íconos: `lucide-react` viene con shadcn/ui y se acepta. Si un ícono del prototipo no existe en lucide, se copia el SVG inline.
- Fuentes: `<link>` a Google Fonts en `index.html` (Bricolage Grotesque 400/600/700 y Hanken Grotesk 400/500/600/700, `display=swap`). No se agrega `@fontsource`.

### D-10 · Sin librería de datos (React Query, SWR)
- Las pantallas llaman a servicios mediante un hook mínimo `useAsync` en `src/lib/useAsync.ts` (carga, error, recarga). El volumen es chico y no hay caché compartido que justifique otra dependencia.
- Si más adelante hace falta, se suma TanStack Query sin tocar los servicios.

### D-11 · El catálogo filtra en el navegador
- Coincide con el documento ("El catálogo carga los productos activos una vez y filtra ahí").
- `productos.listarCatalogo()` trae todos los activos con portada (miniatura) y etiquetas en una sola consulta. Búsqueda, filtro Y/O y contadores son funciones puras en `src/lib/filtros.ts`, con pruebas unitarias.
- Punto de extensión: si el catálogo pasa de ~500 productos, mover el filtro a una RPC con el mismo contrato.

### D-12 · Diseño responsive
- El prototipo tiene dos tamaños fijos (390 y 1280). La app es mobile-first y aplica el diseño de escritorio desde `lg` (≥ 1024 px). Entre 640 y 1023 px se usa el diseño móvil con contenido centrado (máx. 720 px) y la grilla pasa a 3 columnas en `md`.

### D-13 · Cómo se identifica a la administradora
- `public.es_admin()` devuelve `true` si `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`. `app_metadata` solo se puede cambiar con la clave `service_role` o por SQL, nunca desde el navegador.
- Así, aunque alguien lograra crear una cuenta (por ejemplo, si se reactivara el registro por error), no tendría permisos.
- Alta de la administradora: se crea el usuario desde el panel de Supabase (Authentication → Add user) y se le asigna el rol con SQL (ver runbook en el README, etapa 8).

### D-14 · Identificadores y dinero
- `uuid` (`gen_random_uuid()`) en todas las tablas, como el documento. `orders.numero` es `bigint generated always as identity`, único, y se muestra como `#0007`. Pueden quedar huecos en la numeración si una transacción falla; se acepta.
- Dinero en **pesos enteros** (`integer`), igual que el prototipo, que solo acepta dígitos. Totales en `bigint`. Si hiciera falta manejar centavos, se migra a `numeric(12,2)` sin cambiar la interfaz de los servicios.
- Estados de pedido: `text` con `CHECK (estado in ('pendiente','vendido','cancelado'))`. Es más fácil de migrar que un `enum`.

### D-15 · Lectura pública de etiquetas
- `tags` es legible por cualquiera (los nombres no son sensibles). `product_tags` solo es legible para productos activos (o para la administradora). Así el cliente no puede deducir qué etiquetas tienen los productos inactivos.
- Las imágenes del bucket son públicas por URL (lo pide el documento: "lectura pública"). La **fila** de `product_images` de un producto inactivo no es legible para el cliente, pero si alguien ya conoce la URL de un archivo, puede abrirlo. Se acepta.

### D-16 · Guardar producto en una sola transacción
- Producto, costo, etiquetas e imágenes se guardan con la RPC `guardar_producto(p jsonb)` (security invoker + chequeo de `es_admin()`), así nunca queda un producto sin costo o con la mitad de las etiquetas.
- El id del producto nuevo se genera en el navegador (`crypto.randomUUID()`) para poder subir las imágenes a `productos/{id}/…` **antes** de guardar. Si el guardado falla, las imágenes subidas quedan huérfanas. Es un riesgo aceptado y documentado, y se puede limpiar a mano desde Storage.

### D-17 · Supabase CLI como dependencia de desarrollo
- El CLI de Supabase se instala como `devDependency` (`supabase` en npm) y se usa con `npx supabase …`. Así funciona igual en Windows, en otras máquinas y en CI, sin instalaciones globales. Necesita Docker Desktop para el entorno local.

### D-18 · Pruebas
- Frontend: Vitest + Testing Library + jsdom. Servicios probados con un cliente de Supabase simulado (mock del módulo `src/lib/supabase.ts`).
- Base de datos: pgTAP con `supabase test db` (archivos `supabase/tests/*.test.sql`). Corre en CI con `supabase start`.
- **Sin pruebas E2E automáticas** en el MVP (no se agrega Playwright). El recorrido completo se verifica con el checklist de humo de `docs/release-checklist.md`. Punto de extensión: sumar Playwright cuando haya más flujos.

### D-19 · Gestor de paquetes y versión de Node
- `npm` (viene con Node, sin herramientas extra) y Node 22 LTS (`.nvmrc`). Se versiona `package-lock.json`.

### D-20 · Ruta del producto con UUID
- `/producto/:id` usa el UUID. Un slug legible queda para después, junto con las vistas previas por producto.

### D-21 · Vista previa del link del catálogo
- El documento la incluye en el MVP ("título e imagen fija"). El prototipo no la muestra. Se resuelve en la **etapa 4** con metatags Open Graph en `index.html` y una imagen fija `public/og.jpg` (1200 × 630).

### D-22 · Umbral de stock bajo
- `STOCK_BAJO = 3` (constante en `src/lib/constantes.ts` y en la RPC `resumen_panel`). Es el valor del prototipo.

### D-23 · Zona horaria
- Fechas guardadas en `timestamptz` (UTC). Se muestran y se agrupan por mes en `America/Argentina/Buenos_Aires`.

### D-25 · Validación del teléfono y del nombre
- Cliente: nombre de 2 a 80 caracteres sin contar espacios a los costados. Teléfono de 8 a 15 dígitos al contar solo los dígitos (el prototipo dice 8 a 13 en el mensaje; se usa 8 a 15 para aceptar formatos con `+54 9`). El mensaje de error se ajusta: "entre 8 y 15 dígitos".
- Se valida igual con Zod en el navegador y dentro de `crear_pedido`. Se guarda tal como lo escribió el cliente (sin espacios a los costados).

### D-26 · Ajustes del plan de etapas
- Se respetan las etapas sugeridas, con dos cambios:
  1. La gestión global de etiquetas (D-02) va en la etapa 7 junto al Resumen, que queda "Resumen y Ajustes".
  2. El workflow de CI con el job de frontend se crea en la etapa 0. El job de base de datos se agrega en la etapa 1, cuando existen migraciones (antes fallaría sin nada que probar).
- La plantilla de PR, `docs/github-setup.md` y una primera versión de `docs/release-checklist.md` quedan creadas desde el commit inicial. La etapa 8 completa el checklist.

### D-27 · Imágenes de las semillas
- Las semillas de desarrollo usan SVG estáticos en `public/seed/` (generados una vez a partir del componente `Ph` del prototipo), con `path` relativo al sitio en lugar de Storage. `src/services/imagenes.ts` resuelve: si `path` empieza con `/seed/`, se usa tal cual; si no, se arma la URL pública de Storage. En producción no hay semillas.

### D-28 · Versiones del scaffold (etapa 0)
- La plantilla `react-ts` de `create-vite` vigente trae Vite 8, TypeScript 6.0 y **oxlint** en lugar de ESLint, y ya no genera `src/vite-env.d.ts` (usa `"types": ["vite/client"]` en `tsconfig.app.json`). Se mantiene **ESLint** como pide el plan (`typescript-eslint` `strictTypeChecked` + `no-restricted-imports`), con flat config escrita a mano; no se agrega oxlint. No se usa `stylisticTypeChecked` (el plan pide solo `strictTypeChecked`).
- `shadcn init` (v4) pide elegir base y preset: se eligió **Radix** + **Nova** (el preset por defecto). Diferencias con lo descripto en el plan:
  - `src/lib/utils.ts` reexporta `cn` del paquete `cn` (de shadcn, reemplazo de `clsx` + `tailwind-merge`) y los componentes de `ui/` lo importan directo. Se acepta: viene con shadcn.
  - El preset agregaba la fuente Geist con `@fontsource-variable/geist`: **se quitó** (D-09: fuentes por `<link>` a Google Fonts).
  - `shadcn` y `tw-animate-css` quedan como `devDependencies`: solo se usan al compilar el CSS (`@import "shadcn/tailwind.css"`).
  - Se borró el bloque `.dark` (no hay modo oscuro) y se dejó `@custom-variant dark (&:is(.dark *))` para que las clases `dark:` de shadcn nunca se activen por la preferencia del sistema.
- Vitest sin `globals`: las pruebas importan `describe`/`it`/`expect` de `vitest` y `src/test/setup.ts` llama a `cleanup()` en `afterEach`.
- `HeaderCliente`: el carrito es un `Link` a `/carrito` (navega, no ejecuta una acción), con `aria-label="Carrito vacío"`.

### D-29 · Carpeta del proyecto sin `&` en la ruta (actualizada 2026-10-15)
- Al principio la carpeta se llamaba `L&S`. En Windows, los atajos `.cmd` de `node_modules/.bin` se rompen con el `&` en la ruta (`"S\node_modules\.bin\" no se reconoce como un comando…`), así que `npm run lint`, `npx <herramienta local>` y compañía fallaban. Como parche, los scripts llamaban a `node node_modules/<paquete>/<bin>`.
- **Resolución:** la carpeta se renombró a `L-S`. Los scripts de `package.json` volvieron a la forma estándar (`vite`, `tsc -b`, `eslint .`, `vitest run`) y `npx <herramienta>` funciona (verificado con `vite` y `eslint`). Los scripts `db:*` de la etapa 1 usan la forma estándar (`supabase …`).
- Regla: no usar `&` (ni otros caracteres especiales de `cmd`) en la ruta del proyecto. Si alguien lo clona en una carpeta así, renombrarla.

### D-30 · Detalles de la base de datos (etapa 1)
- **Políticas con `(select public.es_admin())`**: envolver la función en un `select` hace que Postgres la evalúe una vez por consulta y no una por fila (recomendación de Supabase para RLS). El resultado es el mismo.
- **Cantidad por línea en `crear_pedido`**: además de entero > 0, se acepta como máximo 6 dígitos. No es un tope de negocio (esos quedan fuera del MVP); evita que una cantidad enorme rompa la conversión a `integer` con un error genérico en vez de `datos_invalidos`.
- **Una sola lectura en `crear_pedido`**: precios, stock y costos se leen una vez y los chequeos y lo insertado usan esos mismos datos, así no pueden diferir dentro de la llamada.
- **Detalle de los errores de `marcar_vendido`**: `stock_insuficiente` lleva en `detail` un JSON con `[{producto_id, nombre, disponible, pedido}]`, y `estado_invalido` lleva el estado actual. El servicio de la etapa 6 los lee desde el error de PostgREST.
- **Semillas**: el pedido #2 (cancelado) no tiene fecha de cancelación en el prototipo; se usa "hace 12 días a las 10:00". Las fechas de las semillas nunca quedan en el futuro (si todavía no son las 9:12, el #6 queda con la hora actual).
- **Numeración en las pruebas**: las secuencias no vuelven atrás con `rollback`, así que las pruebas no esperan un `numero` exacto: chequean que sea mayor que el de las semillas y correlativo (huecos aceptados en D-14).
- **CLI de Supabase 2.121**: los tipos generados salen sin formatear. No se formatean porque el CI compara la salida cruda del CLI. El servicio de correo local ahora se llama `mailpit` (antes `inbucket`) y se excluye con `-x`.
- **`src/types/dominio.ts`** incluye, además de los tipos de dominio, `RespuestaCrearPedidoRpc`: la forma exacta (snake_case) del jsonb de `crear_pedido`, para que el servicio de la etapa 5 la valide y la convierta.

### D-31 · Autenticación y panel (etapa 2)
- **`[auth.email] enable_signup` tiene que quedar en `true`** en `supabase/config.toml`. En el CLI esa opción prende o apaga el proveedor de email entero (con `false`, `signInWithPassword` responde `email_provider_disabled` y nadie puede ingresar). El registro público queda cortado por `[auth] enable_signup = false` (verificado: `/auth/v1/signup` responde `signup_disabled`). En los proyectos remotos el equivalente es el interruptor "Allow new users to sign up" (README, "Administradora").
- **Sin red en el login**: se reusa el código `sin_conexion` y `MENSAJE_SIN_CONEXION` de `errores.ts` en lugar del `red` / "No pudimos conectarnos…" del archivo de la etapa, para que todos los servicios usen el mismo código y el mismo texto.
- **`useSesion` en su propio archivo** (`src/lib/useSesion.ts`, con el contexto y el tipo), y `SesionProvider` en `src/lib/sesion.tsx`: igual que `Toast.tsx` / `useToast.ts`, para que Fast Refresh funcione (un archivo de componentes no exporta hooks).
- **`SesionProvider` envuelve solo las rutas `/admin/*`** (en `src/router.tsx`): el catálogo no escucha la sesión.
- **Título, "Volver", acción del header y tabs por ruta** van en el `handle` de cada ruta del panel (`RutaPanel`, `src/components/panel/rutasPanel.ts`); `PanelLayout` los lee con `useMatches()`. Las páginas del panel ya no tienen su propio `h1`: el título es el `h1` del header, como en el prototipo.
- **`volver` del login**: solo se acepta una ruta que empiece con `/admin` (evita redirigir a otro sitio con `?volver=//…`); si no, va a `/admin`.
- **Validación del login**: los errores de Zod se muestran debajo de cada campo (como el resto de los formularios del prototipo); el error del servicio va abajo con `role="alert"`. Se borra al volver a escribir, como en el prototipo.
- **Usuarios de prueba** en `supabase/seed.sql` con UUID `00000000-0000-4000-c000-00000000000N`. Los campos de token de `auth.users` van en `''` (GoTrue falla al leer `NULL`). Formato verificado con GoTrue v2.197 / CLI 2.121.
- **Token nuevo** `--color-texto-tab: #7a766f` (texto de las tabs inactivas del prototipo).

### D-32 · La app se prueba a mano contra `ls-dev`
- El usuario prefiere probar la app contra el Supabase de desarrollo en la nube en vez del local: para eso existe `ls-dev`, que ya tiene las semillas de productos y la cuenta real de la administradora. `.env.local` apunta ahí.
- Supabase local (Docker) **no se elimina**: lo siguen necesitando `npm run db:test` (pgTAP), probar una migración nueva desde cero antes de `db push` (`npm run db:reset`) y `npm run db:types`. El CI levanta su propia base y no depende de ninguno de los dos.
- Cuidado: lo que se hace en la app con `.env.local` apuntando a `ls-dev` cambia datos reales de desarrollo (pedidos, stock, productos). Las pruebas automáticas nunca apuntan a la nube.

## Pendientes de verificar (no bloquean)
- **Etapa 8**: disponibilidad y límites de Cron Triggers en el plan gratuito de Cloudflare, y si conviene Pages o Workers con recursos estáticos para el sitio (Pages no ejecuta crons por sí solo; el cron va en un Worker aparte). Confirmar con la documentación oficial vigente y anotar el resultado acá.
- **Etapa 8**: que Supabase cuente como actividad una consulta a la API REST con la clave anon.
- **GitHub**: la protección de ramas en repositorios **privados** requiere GitHub Pro/Team. Ver `docs/github-setup.md`.
