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
| [`docs/produccion-paso-a-paso.md`](docs/produccion-paso-a-paso.md) | Primera puesta en producción (Supabase, Cloudflare, anti-pausa) |

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

La primera puesta en marcha, paso a paso, está en [`docs/produccion-paso-a-paso.md`](docs/produccion-paso-a-paso.md). Esto es lo de todos los días. Decisiones y fuentes: D-41 en `docs/decisions.md`.

### Entornos

| | Producción | Vista previa |
|---|---|---|
| Rama | `main` | `develop` |
| Sitio | `https://<proyecto>.pages.dev` | `https://develop.<proyecto>.pages.dev` |
| Supabase | `ls-prod` | `ls-dev` (ref `nhsjichuumyflklqkhxw`) |
| Variables en Cloudflare Pages | *Production* | *Preview* |

`<proyecto>` es el nombre del proyecto de Pages (sugerido: `ls-accesorios`). Las URL reales se anotan en `PLAN.md` al terminar la etapa 8.

Variables de Pages (*Settings → Variables and Secrets*), en los dos entornos: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (la clave pública del proyecto que corresponda) y `NODE_VERSION=22`. Solo en *Production*: `VITE_SITE_URL=https://<proyecto>.pages.dev` (hace absoluta la imagen de la vista previa del link). Las `VITE_*` se leen **al compilar**: si cambia una, hay que volver a desplegar (*Deployments → ⋯ → Retry deployment*).

### Cómo se despliega

- Cada push a `develop` (un PR mergeado) despliega la vista previa. Cada merge a `main` despliega producción. No hay que hacer nada a mano en Cloudflare.
- Una release es un PR `develop` → `main` con **merge commit**, después de correr [`docs/release-checklist.md`](docs/release-checklist.md) sobre la vista previa.
- Volver atrás: en Pages, *Deployments*, elegir el deploy anterior de producción → *Rollback to this deployment*. Ojo: no deshace migraciones de la base.

### Aplicar migraciones a producción

Después de mergear una release que trae migraciones nuevas. La carpeta queda vinculada a `ls-dev`; producción se alcanza con `--db-url`, así un `db push` suelto nunca la toca. La cadena se copia de Supabase: proyecto `ls-prod` → botón **Connect** → **Session pooler** (la conexión directa es solo IPv6), reemplazando `[YOUR-PASSWORD]` por la contraseña de la base.

```powershell
$env:DB_PROD = "postgresql://postgres.<ref-prod>:<contraseña>@<host-del-pooler>:5432/postgres"
npx supabase db push --db-url $env:DB_PROD --dry-run   # lista lo que va a aplicar
npx supabase db push --db-url $env:DB_PROD
Remove-Item Env:DB_PROD
```

Las migraciones se aplican **antes** de probar la versión nueva en producción: el sitio nuevo puede llamar a funciones que todavía no existen.

### Administradora

- Alta (una sola vez) y olvido de contraseña: sección [Administradora](#administradora), en el proyecto `ls-prod`.
- Cambiar el número o el mensaje de WhatsApp: desde el panel, **Ajustes**. Se guarda en la base y vale al instante, sin desplegar (D-34).

### Anti-pausa de Supabase

Supabase pausa los proyectos gratis después de una semana con poca actividad. El Worker `ls-keepalive` (`workers/keepalive/`) consulta `ls-prod` **todos los días a las 9 h de Argentina** (12:00 UTC).

- Ver si corrió: Cloudflare → *Workers & Pages* → `ls-keepalive` → *Settings* → *Trigger Events* → **View events** (últimas 100 ejecuciones), o la pestaña *Logs*. Una ejecución correcta registra `keepalive ok: 200`.
- Volver a desplegarlo (si se cambia el código o el horario en `wrangler.jsonc`):
  ```powershell
  cd workers/keepalive
  npm install
  npx wrangler deploy
  ```
- Si llega el mail de Supabase avisando la pausa: entrar a `ls-prod` en el panel de Supabase (eso cuenta como actividad) y revisar los eventos del Worker. Si ya se pausó: proyecto → **Resume project**.
- `ls-dev` no tiene anti-pausa: si se pausa, se reanuda igual desde el panel.

### Respaldos (manual, una vez por mes)

El plan gratis no da respaldos descargables, y el repositorio es público, así que el respaldo **no** se guarda en GitHub (tiene nombres y teléfonos de clientes). Se hace a mano con Docker Desktop abierto:

```powershell
$env:DB_PROD = "<cadena del Session pooler de ls-prod>"
$fecha = Get-Date -Format yyyy-MM-dd
npx supabase db dump --db-url $env:DB_PROD -f "respaldo-$fecha-esquema.sql"
npx supabase db dump --db-url $env:DB_PROD --data-only --use-copy -f "respaldo-$fecha-datos.sql"
npx supabase db dump --db-url $env:DB_PROD --role-only -f "respaldo-$fecha-roles.sql"
Remove-Item Env:DB_PROD
```

- Correrlo **fuera** de la carpeta del repo (o dentro de `backups/`, que está en `.gitignore`) y subir los tres archivos a una carpeta privada de la nube (Drive, etc.).
- Fotos: están en Storage (bucket `productos`). Se ven en Supabase → *Storage* y se pueden descargar desde ahí. La administradora además conserva los originales.
- Restaurar sobre un proyecto **nuevo y vacío**: aplicarle las migraciones (`npx supabase db push --db-url <cadena-del-nuevo>`) y después cargar los datos con `psql` (viene con Postgres; también se puede pegar el archivo en el *SQL Editor* si es chico):
  ```powershell
  psql "<cadena-del-nuevo>" -f respaldo-AAAA-MM-DD-datos.sql
  ```
  Después: crear de nuevo a la administradora (las cuentas de `auth` también vienen en el respaldo de datos; si se restauran, solo verificar el rol), subir las fotos al bucket `productos` con las mismas rutas y apuntar las variables de Pages al proyecto nuevo.

### Rotar la clave pública (anon / publishable)

Si hiciera falta (por ejemplo, abuso): Supabase → *Project Settings → API Keys*, crear una clave *publishable* nueva o regenerar la anon, cargarla en `VITE_SUPABASE_ANON_KEY` de Pages (*Production*) y en el secreto del Worker (`cd workers/keepalive; npx wrangler secret put SUPABASE_ANON_KEY`), volver a desplegar el sitio y recién ahí desactivar la vieja.

### Si se sospecha abuso de pedidos falsos

Cortar los pedidos nuevos sin bajar el sitio, desde el *SQL Editor* de `ls-prod`:

```sql
revoke execute on function public.crear_pedido(jsonb, text, text, bigint) from anon;
```

El catálogo sigue funcionando y confirmar un pedido muestra un error. Los pedidos falsos se cancelan desde el panel. Para volver a abrir:

```sql
grant execute on function public.crear_pedido(jsonb, text, text, bigint) to anon;
```

La protección de fondo (captcha, límite por IP) está prevista para después del MVP (etapa 9).
