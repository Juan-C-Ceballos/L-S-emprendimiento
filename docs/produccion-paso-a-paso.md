# Pasar a producción · paso a paso

Lo que tenés que hacer **vos** para publicar L&S (etapa 8). Las partes que dependen de cuentas y contraseñas no las puede hacer Claude. El código ya está listo en la rama `feature/08-produccion`. Por qué se eligió cada cosa: D-41 en `docs/decisions.md`. El día a día después de publicar: "Runbook de producción" en el README.

Tiempo estimado: 1 a 2 horas. Hacelo en este orden: cada paso usa algo del anterior.

Vas a anotar algunos datos. **Los marcados 🔒 son secretos**: van solo a tu gestor de contraseñas, nunca al repo ni a un chat.

| Dato | Dónde lo anotás |
|---|---|
| `ref` de `ls-prod` (ej. `abcdxyz…`) | Podés pasárselo a Claude |
| URL de `ls-prod` (`https://<ref>.supabase.co`) | Podés pasárselo a Claude |
| Clave pública de `ls-prod` (anon o publishable) | Es pública, pero no hace falta pegarla en el chat |
| 🔒 Contraseña de la base de `ls-prod` | Gestor de contraseñas |
| 🔒 Contraseña de la administradora en producción | Gestor de contraseñas (o la elige ella) |
| Nombre del proyecto de Pages y su URL | Podés pasárselo a Claude |

---

## 1. Mergear la rama de la etapa 8 en `develop`

1. En GitHub, abrí un PR de `feature/08-produccion` contra `develop` (la descripción está en la plantilla; Claude te deja el texto listo).
2. Esperá el CI en verde (`frontend` y `base-de-datos`) y mergeá con **Squash and merge**.

## 2. Crear el Supabase de producción (`ls-prod`)

1. Entrá a [supabase.com/dashboard](https://supabase.com/dashboard), organización **L&S-Emprendimiento** → **New project**.
2. Nombre: `ls-prod`. Región: **South America (São Paulo)**. Plan: Free.
3. **Database password**: usá una larga **solo con letras y números** (sin símbolos: así no hay que codificarla en la cadena de conexión). 🔒 Guardala.
4. Esperá a que termine de crearse (un par de minutos).
5. Anotá el `ref` y la URL (*Project Settings → General* / *Data API*) y la clave pública (*Project Settings → API Keys*: la `anon` o la `publishable`).

### 2.1 Cortar el registro público

**Authentication → Sign In / Providers → User Signups → Allow new users to sign up: off** → Save. Así solo pueden ingresar cuentas creadas a mano.

### 2.2 Aplicar las migraciones (crea tablas, permisos, funciones y el bucket de fotos)

1. En `ls-prod`, tocá **Connect** (arriba) → pestaña de cadenas de conexión → **Session pooler** → copiá la cadena `postgresql://postgres.<ref>:[YOUR-PASSWORD]@…pooler.supabase.com:5432/postgres`.
2. En PowerShell, en la carpeta del proyecto (con `develop` actualizado: `git checkout develop; git pull`):

   ```powershell
   $env:DB_PROD = "<la cadena, con tu contraseña en lugar de [YOUR-PASSWORD]>"
   npx supabase db push --db-url $env:DB_PROD --dry-run
   ```

   Tiene que listar **5 migraciones** (`esquema_inicial`, `funciones_pedidos`, `ajustes_whatsapp`, `storage_y_guardar_producto`, `resumen_y_etiquetas`). Si lista eso, aplicalas:

   ```powershell
   npx supabase db push --db-url $env:DB_PROD
   Remove-Item Env:DB_PROD
   ```

   No uses `supabase link` con producción: la carpeta tiene que seguir vinculada a `ls-dev`. Las semillas (`seed.sql`) **no** se cargan: producción arranca vacía.
3. Verificá en el panel: **Table Editor** muestra `products`, `orders`, `settings`, etc. (vacías, salvo una fila en `settings`), y **Storage** muestra el bucket `productos` marcado como *Public*.

### 2.3 Crear a la administradora

Con el email que vaya a usar la dueña en producción (puede ser `1accesorioslis@gmail.com`, el mismo que en dev):

1. **Authentication → Users → Add user → Create new user**: email, contraseña 🔒 y tildá **Auto Confirm User**.
2. **SQL Editor** → New query:

   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
   where email = '<email de la administradora>';
   ```

   Tiene que decir `1 row affected` (si dice 0, el email no coincide).

## 3. Publicar el sitio en Cloudflare Pages

1. Creá una cuenta en [dash.cloudflare.com](https://dash.cloudflare.com) (gratis) si no tenés.
2. **Workers & Pages → Create → Pages → Import an existing Git repository** (si te ofrece crear un *Worker*, buscá la pestaña o el link de **Pages**: tiene que ser Pages, ver D-41).
3. Conectá GitHub y elegí el repositorio `Juan-C-Ceballos/L-S-emprendimiento`.
4. Configuración:
   - **Project name**: `ls-accesorios` (será `https://ls-accesorios.pages.dev`; si está tomado, elegí otro y usalo en todos los pasos siguientes).
   - **Production branch**: `main`.
   - **Framework preset**: `React (Vite)` · **Build command**: `npm run build` · **Build output directory**: `dist` · **Root directory**: vacío.
   - **Environment variables**: por ahora cargá las de **producción** (abajo). Las de vista previa se cargan después en Settings.
5. **Save and Deploy**. El primer deploy compila `main`, que todavía no tiene la app: **es normal que falle** o que quede vacío. Producción se publica de verdad en el paso 6.

### 3.1 Variables (Settings → Variables and Secrets)

Cargalas como *Text* (no hace falta *Secret*: son públicas) en cada entorno:

| Variable | Production | Preview |
|---|---|---|
| `VITE_SUPABASE_URL` | URL de `ls-prod` | `https://nhsjichuumyflklqkhxw.supabase.co` (`ls-dev`) |
| `VITE_SUPABASE_ANON_KEY` | clave pública de `ls-prod` | clave pública de `ls-dev` (la de tu `.env.local`) |
| `VITE_SITE_URL` | `https://ls-accesorios.pages.dev` | — (no cargar) |
| `NODE_VERSION` | `22` | `22` |

**Nunca** cargues la clave `service_role` ni la contraseña de la base.

### 3.2 Vistas previas solo para `develop`

**Settings → Builds → Branch control** (o *Builds & deployments → Configure Preview deployments*): **Custom branches** → *Include*: `develop`. Guardá.

Después: **Deployments → Create deployment** (o hacé cualquier merge a `develop`) para que se publique la vista previa en `https://develop.ls-accesorios.pages.dev`.

## 4. Direcciones de Auth en Supabase

Sirven para los mails de recuperación de contraseña.

- En `ls-prod`: **Authentication → URL Configuration** → *Site URL* = `https://ls-accesorios.pages.dev`.
- En `ls-dev`: *Redirect URLs* → agregar `https://develop.ls-accesorios.pages.dev/**`.

## 5. Probar la vista previa (checklist de release)

En `https://develop.ls-accesorios.pages.dev`, desde el celular y la compu, corré [`docs/release-checklist.md`](release-checklist.md) completo (menos la sección "Producción"). Esa vista previa usa `ls-dev`, así que los pedidos de prueba quedan ahí: cancelalos al terminar. De paso, **cancelá el pedido de prueba #0007** que quedó en `ls-dev` de la etapa 5.

Si algo falla, avisale a Claude antes de seguir.

## 6. Primera release: `develop` → `main`

1. En GitHub: PR de `develop` contra `main`. Pegá en la descripción el checklist tildado.
2. CI en verde → mergeá con **Create a merge commit** (no squash).
3. Cloudflare despliega producción solo. Esperá a que el deploy de `main` termine bien (*Deployments*).
4. Corré la sección **"Producción"** del checklist en `https://ls-accesorios.pages.dev`. Las migraciones ya están aplicadas (paso 2.2).

## 7. Worker anti-pausa (`ls-keepalive`)

Evita que Supabase pause `ls-prod` por falta de visitas. Se despliega una vez desde tu compu:

```powershell
cd workers/keepalive
npm install
npx wrangler login                          # abre el navegador para autorizar tu cuenta de Cloudflare
npx wrangler deploy
npx wrangler secret put SUPABASE_URL        # pegá la URL de ls-prod y Enter
npx wrangler secret put SUPABASE_ANON_KEY   # pegá la clave pública de ls-prod y Enter
cd ../..
```

Verificación: al día siguiente después de las 9 h, en Cloudflare → **Workers & Pages → ls-keepalive → Settings → Trigger Events → View events** tiene que haber una ejecución correcta (en *Logs*: `keepalive ok: 200`).

Para probarlo en el momento sin esperar, en tu compu: creá `workers/keepalive/.dev.vars` (está en `.gitignore`) con

```
SUPABASE_URL=<URL de ls-prod>
SUPABASE_ANON_KEY=<clave pública de ls-prod>
```

y corré `npx wrangler dev --test-scheduled` dentro de `workers/keepalive`; en otra terminal, `curl "http://localhost:8787/__scheduled?cron=0+12+*+*+*"`. La primera terminal tiene que mostrar `keepalive ok: 200`. Cortalo con Ctrl+C.

## 8. Abrir la tienda

1. La dueña entra a `https://ls-accesorios.pages.dev/admin` con su cuenta.
2. **Ajustes**: carga el número de WhatsApp real y revisa el mensaje. **Sin número, los clientes no ven el botón de WhatsApp.**
3. **Productos**: carga los productos reales con fotos (producción arranca sin productos).
4. Un pedido de prueba desde el celular y cancelarlo desde **Pedidos**.
5. Compartí el link: `https://ls-accesorios.pages.dev`. Podés revisar cómo se ve la vista previa del link en WhatsApp mandándotelo a vos.

## 9. Respaldo mensual

Una vez por mes (y antes de cambios grandes), con Docker Desktop abierto, seguí "Respaldos" en el README. Guardá los archivos en una carpeta privada de la nube, **nunca** en GitHub.

## 10. Avisale a Claude

Pasale el `ref` de `ls-prod`, el nombre del proyecto de Pages y las dos URL. Con eso se cierra la etapa 8 en `PLAN.md` (casillas, URL reales y registro de avance).

## Opcional

- **Separar el ruleset de GitHub**: `develop` solo squash y `main` solo merge commit, así GitHub no te deja equivocarte de botón (`docs/github-setup.md`, "Estado verificado").
- **Dominio propio**: Pages → *Custom domains*. Si lo agregás, cambiá `VITE_SITE_URL` (Production), la *Site URL* de `ls-prod` y volvé a desplegar.
