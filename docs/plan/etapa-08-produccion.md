# Etapa 8 · Puesta en producción

> Leé antes `CLAUDE.md`. Este archivo alcanza para ejecutar la etapa. **Esta etapa depende de cuentas del usuario**: no crees cuentas ni cargues credenciales por tu cuenta. Pedí lo necesario con instrucciones precisas (sección "Qué pedirle al usuario") y avanzá con lo que no dependa de eso.

## Objetivo
El sistema queda publicado gratis: `main` en producción (Supabase de producción + Cloudflare) y `develop` como vista previa (Supabase de desarrollo). Un Cron Trigger de Cloudflare evita la pausa de Supabase gratis, hay un respaldo periódico de los datos, el runbook está en el README, `docs/release-checklist.md` está completo y se hace la primera release `develop` → `main`.

## Rama
`feature/08-produccion` desde `develop`. La release final es un PR `develop` → `main` con **merge commit**.

## Dependencias
- Etapas 0 a 7 mergeadas en `develop` y en verde.
- Del usuario: ver abajo.

## Pantallas del prototipo que implementa
Ninguna nueva. Se verifica todo el prototipo en producción con el checklist.

## Qué pedirle al usuario (con instrucciones)
1. **Proyecto de Supabase de producción** (supabase.com → New project; región São Paulo `sa-east-1` por cercanía; contraseña de base fuerte guardada en su gestor). Pasar: `project ref`, URL y clave anon/publishable. La contraseña de la base y el token personal se cargan **en su máquina** (`.env.local`) o se los pasa por un canal que no quede en el repo.
2. **Cuenta de Cloudflare** conectada a GitHub (Workers & Pages → Create → conectar el repositorio). Si prefiere hacerlo él, darle los valores exactos de configuración (abajo).
3. **Email de la administradora** de producción y que confirme el número de WhatsApp real.
4. Para el respaldo con GitHub Actions: crear el secreto `SUPABASE_DB_URL_PROD` (ver tarea 6) en el repositorio.

## Tareas
1. **Verificar documentación vigente** (obligatorio antes de configurar; anotar en `docs/decisions.md` con fecha y enlaces):
   - Cloudflare: ¿el sitio va en **Pages** (variables separadas para producción y vista previa; vista previa por rama) o en **Workers con recursos estáticos**? Criterio: necesitamos que `develop` use las variables del Supabase de desarrollo y `main` las de producción, con el menor trabajo. Recomendación inicial: **Pages** para el sitio (tiene variables por entorno *Production* / *Preview* nativas) y un **Worker aparte** para el cron (Pages no ejecuta Cron Triggers).
   - Cron Triggers en el plan gratuito: disponibilidad, cantidad máxima y frecuencia mínima.
   - Supabase: condiciones actuales de pausa por inactividad en el plan gratuito y qué cuenta como actividad (el documento asume que una consulta a la API REST alcanza; verificar).
2. **Supabase de producción**: `npx supabase link --project-ref <ref-prod>` y `npx supabase db push` (sin semillas). Configurar Auth: registro desactivado, *Site URL* = URL de producción de Cloudflare, *Redirect URLs* con la URL de vista previa. Crear a la administradora y asignarle el rol (runbook de la etapa 2) **solo con el email que dé el usuario**. Verificar que el bucket `productos` existe (lo crea la migración) y es público.
3. **Sitio en Cloudflare** (Pages, si se confirmó en la tarea 1):
   - Build command `npm run build`, output `dist`, `NODE_VERSION=22`.
   - Rama de producción `main`; vistas previas habilitadas solo para `develop` (y opcionalmente PRs).
   - Variables **Production**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` del proyecto de producción, `VITE_WHATSAPP_NUMBER`. Variables **Preview**: las del proyecto de desarrollo.
   - SPA: `public/_redirects` con `/* /index.html 200` (o el mecanismo equivalente vigente; si se usa Workers con assets, `not_found_handling = "single-page-application"`).
   - Headers de seguridad en `public/_headers`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` mínima, y `Cache-Control: public, max-age=31536000, immutable` para `/assets/*`. Una CSP queda como mejora (anotar).
   - Completar `og:image` con URL absoluta de producción (pendiente de la etapa 4).
4. **Worker anti-pausa** en `workers/keepalive/` (proyecto propio con su `wrangler.jsonc` y `package.json` mínimo; `wrangler` como devDependency de esa carpeta, justificado en `docs/decisions.md`):
   - Handler `scheduled` que hace `fetch(`${SUPABASE_URL}/rest/v1/tags?select=id&limit=1`, { headers: { apikey, Authorization: `Bearer ${apikey}` } })` y registra el estado (`console.log`). Lee `SUPABASE_URL` y `SUPABASE_ANON_KEY` de las variables del Worker (la clave anon es pública; igual se carga como secret para no versionarla).
   - Cron `0 12 */3 * *` (cada 3 días, 9 h de Argentina) o el más cercano que permita el plan (D-08).
   - Prueba unitaria del handler con `fetch` simulado (Vitest dentro de la carpeta o desde la raíz).
   - Despliegue con `npx wrangler deploy` (lo corre el usuario o la sesión con el token que el usuario configure en su máquina; nunca guardar tokens en el repo).
   - Apunta **solo a producción** (el proyecto de desarrollo puede pausarse sin problema).
5. **Aplicar migraciones a producción**: documentar el flujo. Recomendado: manual, en cada release, después del merge a `main`: `npx supabase link --project-ref <ref-prod> && npx supabase db push`, y volver a vincular dev. (Automatizarlo con GitHub Actions queda como mejora; requiere guardar un token en GitHub.)
6. **Respaldo periódico** (el plan gratuito no incluye backups descargables):
   - Opción A (recomendada si el repo es **privado**): workflow `.github/workflows/respaldo.yml` semanal (`schedule` + `workflow_dispatch`) que corre `npx supabase db dump --db-url "$SUPABASE_DB_URL_PROD" --data-only -f respaldo.sql` (y otro dump del esquema) y lo sube como artifact con retención de 30 días. Contiene nombres y teléfonos de clientes: **no usar si el repositorio es público**.
   - Opción B: runbook manual mensual con el mismo comando desde la máquina de la administradora/usuario, guardando el archivo en su nube.
   - Las fotos están en Storage: el runbook explica cómo descargarlas (Storage → bucket `productos`), aunque la administradora conserva los originales.
   - Elegir con el usuario y anotar en `docs/decisions.md`.
7. **README → Runbook de producción**: URLs (producción y vista previa), cómo se despliega (merge a `main`), cómo aplicar migraciones, alta y cambio de contraseña de la administradora, cómo cambiar el número de WhatsApp (variable en Cloudflare + redeploy), cron anti-pausa (dónde ver las ejecuciones, cómo reactivar el proyecto si se pausó), respaldo y restauración (`psql < respaldo.sql` sobre un proyecto vacío con migraciones aplicadas), cómo rotar la clave anon, y qué hacer si se sospecha abuso de `crear_pedido` (desactivar temporalmente con `revoke execute on function public.crear_pedido from anon;`).
8. **`docs/release-checklist.md`**: completar con las URL reales y los pasos verificados.
9. **Primera release**: PR `develop` → `main` con la lista del checklist tildada, merge commit, `db push` a producción, verificación de humo en producción (pedido de prueba y cancelarlo).

## Archivos que se espera tocar
`public/_redirects`, `public/_headers`, `index.html`, `workers/keepalive/**`, `.github/workflows/respaldo.yml` (si se elige A), `README.md`, `docs/release-checklist.md`, `docs/decisions.md`, `docs/github-setup.md`, `PLAN.md`.

## Criterios de aceptación
- [ ] La URL de producción sirve la app; recargar en `/producto/<id>` o `/admin/pedidos` no da 404.
- [ ] La vista previa de `develop` usa el Supabase de desarrollo y producción el de producción (verificar en la pestaña Red del navegador).
- [ ] La clave `service_role` no aparece en el bundle (`grep` en `dist/`) ni en el repo.
- [ ] El Worker anti-pausa está desplegado con su cron y tiene al menos una ejecución exitosa (probar con "Trigger" manual o `wrangler dev --test-scheduled`).
- [ ] Hay un respaldo funcionando (artifact generado o runbook probado una vez).
- [ ] El checklist de release corrió completo y la release está en `main` con merge commit.
- [ ] Runbook completo en el README.

## Pruebas requeridas
- Prueba unitaria del handler del Worker.
- Todo el CI en verde en `develop` y en el PR de release.
- Checklist de humo completo en vista previa y la sección "Producción" en producción.

## Riesgos
- **Cambios de producto en Cloudflare o Supabase**: por eso la tarea 1 es obligatoria y queda registrada.
- **Pausa de Supabase igual**: si la consulta no cuenta como actividad, cambiar a otra operación liviana (por ejemplo, una RPC de solo lectura) y anotarlo.
- **Datos personales en respaldos**: solo en repo privado o fuera de GitHub.
- **Migraciones manuales olvidadas**: el checklist de release lo incluye como paso explícito.

## Definición de terminado
Criterios cumplidos, PR `feature/08-produccion` → `develop` (squash) y release `develop` → `main` (merge commit) mergeados, producción verificada, `PLAN.md` con el MVP marcado como publicado y la URL de producción.
