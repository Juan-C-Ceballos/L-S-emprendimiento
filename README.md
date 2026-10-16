# L&S · Sistema de pedidos

Catálogo público de accesorios (cadenas, pulseras, collares, aros, anillos) con pedidos por WhatsApp y un panel privado para que la administradora gestione productos, stock y ventas.

- **Cliente** (sin cuenta): mira el catálogo, filtra por etiquetas, arma un carrito y confirma. El pedido se guarda en la base y se abre WhatsApp con el resumen y el número de pedido.
- **Administradora** (una sola cuenta): carga productos con fotos, etiquetas, precio, costo y stock; sigue pedidos y los marca como vendidos o cancelados.

Sin pagos online: el cobro se coordina por chat.

| Documento | Para qué |
|---|---|
| [`docs/ls-mvp.html`](docs/ls-mvp.html) | Diseño funcional del MVP (fuente de verdad funcional) |
| [`prototype/`](prototype/README.md) | Prototipo de Claude Design (fuente de verdad visual) |
| [`PLAN.md`](PLAN.md) | Plan por etapas y estado actual |
| [`CLAUDE.md`](CLAUDE.md) | Reglas del proyecto para cualquier sesión de trabajo |
| [`docs/decisions.md`](docs/decisions.md) | Decisiones y contradicciones resueltas |
| [`docs/prototype-analysis.md`](docs/prototype-analysis.md) | Pantallas, rutas, componentes, servicios y tokens |
| [`docs/github-setup.md`](docs/github-setup.md) | Configuración del repositorio en GitHub |
| [`docs/release-checklist.md`](docs/release-checklist.md) | Checklist de humo antes de pasar a producción |

## Stack

React + Vite + TypeScript (SPA) · React Router · Tailwind + shadcn/ui · Zod · Supabase (Postgres, Auth, Storage, RLS) · Cloudflare (sitio estático, plan gratuito) · Vitest + Testing Library · pgTAP.

## Requisitos

- Node 22 (`.nvmrc`) y npm.
- Docker Desktop (para levantar Supabase en local).
- Git.

## Cómo levantarlo

> Los comandos `npm` existen a partir de la etapa 0 y los de base de datos a partir de la etapa 1. Ver `PLAN.md`.

```bash
npm install
cp .env.example .env.local   # completar valores (ver abajo)
npm run db:start             # Supabase local en Docker (API en http://127.0.0.1:54321, Studio en :54323)
npm run db:reset             # aplica migraciones y semillas
npm run dev                  # http://localhost:5173
```

`.env.local` puede apuntar a uno de dos lugares (D-32):

- **Supabase de desarrollo en la nube (`ls-dev`), lo habitual para probar la app a mano**: `VITE_SUPABASE_URL=https://<project-ref>.supabase.co` y en `VITE_SUPABASE_ANON_KEY` la clave pública del proyecto (*Project Settings → API Keys*: la `anon` o la `publishable`, cualquiera de las dos). No hace falta Docker. Se ingresa con la cuenta real de la administradora.
- **Supabase local**: la URL y la clave salen de la salida de `npm run db:start` (o de `npx supabase status`). Se ingresa con los usuarios de prueba de `supabase/seed.sql`.

El nombre de la variable tiene que ser exactamente `VITE_SUPABASE_ANON_KEY`, aunque la clave sea la `publishable`.

Supabase local (Docker) sigue haciendo falta para las pruebas de la base (`npm run db:test`), para probar una migración nueva antes de subirla (`npm run db:reset`) y para regenerar los tipos (`npm run db:types`).

### Comandos habituales

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run lint` | ESLint |
| `npm run typecheck` | Chequeo de tipos de TypeScript |
| `npm test` | Pruebas de frontend (Vitest) |
| `npm run build` | Compila a `dist/` |
| `npm run db:start` / `db:stop` | Levanta o detiene Supabase local |
| `npm run db:reset` | Recrea la base local con migraciones + `supabase/seed.sql` |
| `npm run db:test` | Pruebas de base de datos (pgTAP) |
| `npm run db:types` | Regenera `src/types/database.ts` desde la base local |
| `npx supabase migration new <nombre>` | Crea una migración nueva |

## Administradora

El panel (`/admin`) acepta una sola cuenta: la que tiene `app_metadata.role = 'admin'` (la misma regla que usa `es_admin()` en la base). No hay registro público: el registro está desactivado y las cuentas se crean a mano.

**En local**, `npm run db:reset` crea dos usuarios de prueba desde `supabase/seed.sql` (las contraseñas están ahí):

- `admin@ls.test`: administradora, entra al panel.
- `vendedora@ls.test`: sin rol; el panel la rechaza con "Esta cuenta no tiene acceso al panel.".

`supabase/config.toml` tiene `enable_signup = false` en `[auth]` y `[auth.email]`.

**En los proyectos remotos** (desarrollo y producción), desde el panel de Supabase:

1. Desactivar el registro: **Authentication → Sign In / Providers → User Signups → Allow new users to sign up: off**. Así solo pueden ingresar cuentas que ya existen.
2. Crear la cuenta: **Authentication → Users → Add user → Create new user**, con el email y una contraseña, y tildando **Auto Confirm User**.
3. Darle el rol en **SQL Editor**:
   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
   where email = '<email de la administradora>';
   ```
4. El rol viaja dentro del token de sesión: si la administradora ya estaba adentro, tiene que **salir y volver a ingresar** para que el panel la reconozca.

**Olvido de contraseña**: en el MVP no hay pantalla para recuperarla. Se resuelve desde el panel de Supabase, en **Authentication → Users**, abriendo el menú de la cuenta: **Send password recovery** (manda un mail con el link) o cambiándole la contraseña directamente.

## Cómo trabajar con ramas

| Rama | Rol | Entorno |
|---|---|---|
| `main` | Producción. Solo recibe merges desde `develop` con un PR de release | Supabase de producción + deploy de producción en Cloudflare |
| `develop` | Integración | Supabase de desarrollo + deploy de vista previa en Cloudflare |
| `feature/NN-nombre-corto` | Una funcionalidad. `NN` = número de etapa del plan. Sale de `develop` | Local |
| `fix/nombre-corto` | Un arreglo. Sale de `develop` | Local |

Reglas:

1. **Nunca** se hace push directo a `main` ni a `develop`. Todo entra por Pull Request.
2. Feature → `develop`: **squash merge**. `develop` → `main`: **merge commit** (conserva el historial de la release).
3. Commits con [Conventional Commits](https://www.conventionalcommits.org/es/): `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
4. Antes de cada merge:
   1. Traé `develop` a tu rama y resolvé conflictos ahí: `git fetch origin && git merge origin/develop`.
   2. Corré en local: `npm run lint && npm run typecheck && npm test && npm run build` (y `npm run db:test` si tocaste la base).
   3. Esperá el CI en verde en el PR.
   4. Recién entonces mergeá.
5. Después de cada merge a `develop`, verificá que `develop` siga en verde (CI del push).
6. Antes de pasar `develop` a `main`, corré el checklist de [`docs/release-checklist.md`](docs/release-checklist.md).

```bash
# Empezar una funcionalidad
git checkout develop && git pull
git checkout -b feature/04-catalogo-publico
# ... commits ...
git push -u origin feature/04-catalogo-publico   # y abrir el PR contra develop
```

## Entornos y secretos

- Dos proyectos de Supabase: **desarrollo** y **producción**, iguales gracias a las migraciones de `supabase/migrations/`.
- Variables públicas del frontend en `.env.local` (local) y en las variables del hosting (Cloudflare). Nombres en [`.env.example`](.env.example).
- La clave `service_role` **jamás** se usa en el frontend ni se guarda en el repositorio.

## Runbook de producción

Se completa en la etapa 8 (despliegue, alta de la administradora, chequeo contra la pausa, respaldos, cómo aplicar migraciones a producción).
