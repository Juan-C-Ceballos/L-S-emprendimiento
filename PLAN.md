# PLAN · L&S

Índice del plan de implementación. Cada etapa tiene su archivo **autocontenido** en `docs/plan/`. Una sesión nueva lee `CLAUDE.md` + el archivo de la etapa en curso y puede trabajar sin más contexto.

## Estado actual

- **Etapa en curso:** 1 · Base de datos (sin empezar). La etapa 0 está terminada en `feature/00-fundacion`, con el [PR #1](https://github.com/Juan-C-Ceballos/L-S-emprendimiento/pull/1) a `develop` abierto y CI en verde; falta el merge (squash).
- **Rama:** crear `feature/01-base-de-datos` desde `develop` **después** de mergear la etapa 0.
- **Próximo paso:** mergear el PR de la etapa 0, verificar `develop` en verde, y abrir `docs/plan/etapa-01-base-de-datos.md`.
- **Ojo en Windows:** la carpeta del proyecto no puede tener `&` en la ruta (rompe `npx` y los scripts de npm). Ya se renombró a `L-S` y los scripts volvieron a la forma estándar (D-29).
- **Remoto de GitHub:** https://github.com/Juan-C-Ceballos/L-S-emprendimiento (público). `main`, `develop` y `feature/00-fundacion` subidas el 2026-10-15. Rama por defecto `develop` y ruleset activo en `main` y `develop` (PR obligatorio, check `frontend`, sin force push). Mejoras opcionales pendientes en `docs/github-setup.md` ("Estado verificado").

## Etapas

- [x] **0 · Fundación** — [`etapa-00-fundacion.md`](docs/plan/etapa-00-fundacion.md) · `feature/00-fundacion`
  Scaffold Vite + React + TS + Tailwind + shadcn + Router, tokens de diseño, Vitest, ESLint, capa `services/` y cliente de Supabase, CI.
- [ ] **1 · Base de datos** — [`etapa-01-base-de-datos.md`](docs/plan/etapa-01-base-de-datos.md) · `feature/01-base-de-datos`
  Migraciones, RLS, `product_costs`, `crear_pedido`, `marcar_vendido`, `cancelar_pedido`, semillas, pgTAP, tipos generados, job de CI de base.
- [ ] **2 · Autenticación y panel** — [`etapa-02-auth-panel.md`](docs/plan/etapa-02-auth-panel.md) · `feature/02-auth-panel`
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
| Configurar la protección de ramas y los tipos de merge (ver `docs/github-setup.md`; no hay `gh` CLI) | Antes del primer PR (etapa 0) | Hecho (verificado 2026-10-15); quedan mejoras opcionales |
| Instalar Docker Desktop y dejarlo corriendo | 1 | Docker detectado en la máquina |
| Proyecto de Supabase **de desarrollo**: `project ref`, URL, clave anon, contraseña de la base, token personal (`SUPABASE_ACCESS_TOKEN`) | Al mergear la 1 en `develop` (se puede trabajar en local antes) | Pendiente |
| Número de WhatsApp de la tienda | 5 | Pendiente |
| Email de la administradora | 2 (dev) / 8 (prod) | Pendiente |
| Proyecto de Supabase **de producción** + cuenta de Cloudflare conectada al repositorio de GitHub | 8 | Pendiente |

## Registro de avance

<!-- Una entrada por sesión o etapa, la más reciente arriba. Formato:
### AAAA-MM-DD · Etapa N · rama
- Hecho: …
- Pendiente: …
- PR: …
-->

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
