# PLAN · L&S

Índice del plan de implementación. Cada etapa tiene su archivo **autocontenido** en `docs/plan/`. Una sesión nueva lee `CLAUDE.md` + el archivo de la etapa en curso y puede trabajar sin más contexto.

## Estado actual

- **Etapa en curso:** 3 · Panel de productos (sin empezar). Las etapas 0 a 2 están en `develop`.
- **Rama:** crear `feature/03-panel-productos` desde `develop` (`git checkout develop && git pull && git checkout -b feature/03-panel-productos`).
- **Próximo paso:** abrir `docs/plan/etapa-03-panel-productos.md`. La app se prueba a mano contra `ls-dev` (`.env.local` ya apunta ahí, D-32): `npm run dev` y entrar a http://localhost:5173/admin con la cuenta de la administradora. Docker y `npm run db:start` solo hacen falta si la etapa toca la base (migraciones, `db:test`, `db:types`).
- **Supabase en la nube:** proyecto de **desarrollo** `ls-dev` creado (ref `nhsjichuumyflklqkhxw`, URL `https://nhsjichuumyflklqkhxw.supabase.co`, São Paulo, Postgres 17, organización `L&S-Emprendimiento`, plan gratuito). Migraciones de la etapa 1 aplicadas con `supabase db push`; registro público desactivado; semillas de productos y pedidos cargadas por el usuario. Administradora creada: `1accesorioslis@gmail.com` con rol `admin` (verificado 2026-10-15: es la única cuenta de `auth.users`). **No** correr ahí el bloque final de `supabase/seed.sql` (usuarios de prueba con contraseñas en el repo público). La carpeta local quedó vinculada a ese proyecto (`supabase/.temp/`, ignorado). Producción se crea en la etapa 8 en la misma organización.
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
- [ ] **3 · Panel de productos** — [`etapa-03-panel-productos.md`](docs/plan/etapa-03-panel-productos.md) · `feature/03-panel-productos`
  Lista, alta, edición, activar/desactivar, costo y margen, etiquetas con autocompletado, imágenes comprimidas en el navegador, Storage.
- [ ] **4 · Catálogo público** — [`etapa-04-catalogo-publico.md`](docs/plan/etapa-04-catalogo-publico.md) · `feature/04-catalogo-publico`
  Grilla, filtros todas/alguna con estado en la URL y contadores, búsqueda, detalle con galería, agotados, vista previa del link.
- [ ] **5 · Carrito y pedido** — [`etapa-05-carrito-pedido.md`](docs/plan/etapa-05-carrito-pedido.md) · `feature/05-carrito-pedido`
  Carrito en el navegador (sin precios), confirmación, `crear_pedido`, errores de stock y precio, pantalla de éxito y WhatsApp.
- [ ] **6 · Panel de pedidos** — [`etapa-06-panel-pedidos.md`](docs/plan/etapa-06-panel-pedidos.md) · `feature/06-panel-pedidos`
  Lista filtrable por estado, detalle, marcar vendido y cancelar.
- [ ] **7 · Resumen y Ajustes** — [`etapa-07-resumen-ajustes.md`](docs/plan/etapa-07-resumen-ajustes.md) · `feature/07-resumen-ajustes`
  Pedidos pendientes, ventas del mes, stock bajo; gestión global de etiquetas.
- [ ] **8 · Puesta en producción** — [`etapa-08-produccion.md`](docs/plan/etapa-08-produccion.md) · `feature/08-produccion`
  Supabase de producción, Cloudflare (main = producción, develop = vista previa), Cron anti-pausa, respaldos, runbook, primera release.
- [ ] **9 · Posterior al MVP** (solo documentación) — [`etapa-09-post-mvp.md`](docs/plan/etapa-09-post-mvp.md)
  Topes, captcha, límite por IP, vistas previas por producto, reportes, PWA.

Dependencias: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. La 4 solo necesita la 1 (puede adelantarse a la 2 y la 3 si hiciera falta), y la 6 y la 7 solo necesitan la 2. Se recomienda el orden numérico.

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
| Email de la administradora | 2 (dev) / 8 (prod) | Dev hecho (2026-10-15): `1accesorioslis@gmail.com`, rol `admin`, creada por el usuario. Prod: en la etapa 8 |
| Proyecto de Supabase **de producción** + cuenta de Cloudflare conectada al repositorio de GitHub | 8 | Pendiente |

## Registro de avance

<!-- Una entrada por sesión o etapa, la más reciente arriba. Formato:
### AAAA-MM-DD · Etapa N · rama
- Hecho: …
- Pendiente: …
- PR: …
-->

### 2026-10-15 · Ajustes de WhatsApp · `feature/ajustes-whatsapp` (sobre `feature/marca-logo-paleta`)
- Hecho: migración `ajustes_whatsapp` (tabla `settings` de una fila con RLS: lectura pública, edición solo admin) + `supabase/tests/07_settings.test.sql`; tipos regenerados. `src/lib/whatsapp.ts` (`armarMensaje`, `enlaceWhatsApp`, mensaje original, pedido de ejemplo), `src/lib/esquemas.ts` (Zod con los mensajes del prototipo), `src/services/ajustes.ts`, y `AjustesPage` con número, mensaje, "Insertar dato", "Volver al mensaje original", vista previa, "Descartar" y "Guardar número y mensaje". Se eliminó `VITE_WHATSAPP_NUMBER`. D-34 (reemplaza D-01); planes de las etapas 5, 7, 8 y 9 actualizados.
- Verificado en local: `db:reset`, `db:test` 111/111, `db:lint`; lint, typecheck, 60 pruebas y build. En el navegador contra Supabase local: guardar el número `+54 9 351 555-1234` lo deja como `5493515551234` y sobrevive a recargar; vista previa y tabs en 375 px.
- Pendiente: PR contra `develop` **después** del de `feature/marca-logo-paleta` (está apilada encima). Al mergear, aplicar la migración a `ls-dev` (`npx supabase db push --dry-run` y `npx supabase db push`) y cargar el número real en Ajustes.

### 2026-10-15 · Marca · `feature/marca-logo-paleta`
- Hecho: logo del emprendimiento recortado en cuadrado según su marco (`public/logo.webp`, fondo transparente) y usado en el login; favicon e ícono de iOS con el monograma; paleta bronce/champán en `src/index.css` con tokens renombrados (`vino` → `bronce`, `rosa*` → `champan*`). D-33.
- Verificado: lint, typecheck, 47 pruebas y build; catálogo y login en 375 px contra `ls-dev`.
- Pendiente: PR contra `develop` (squash).

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
