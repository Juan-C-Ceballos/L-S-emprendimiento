# Etapa 2 · Autenticación y estructura del panel

> Leé antes `CLAUDE.md`. Este archivo alcanza para ejecutar la etapa.

## Objetivo
La administradora puede ingresar con email y contraseña, navegar el panel (Resumen, Productos, Pedidos, Ajustes, todavía vacíos) y salir. Las rutas `/admin/*` quedan protegidas. Solo entra una cuenta con `app_metadata.role = 'admin'`. El registro público queda desactivado y documentado.

## Rama
`feature/02-auth-panel` desde `develop`.

## Dependencias
- Etapa 0 (router, páginas placeholder, toasts, capa de servicios).
- Etapa 1 (`es_admin()` y RLS; `supabase/config.toml` con `enable_signup = false`).

## Pantallas del prototipo que implementa
- **Login** (`a.notLogged`, clase `.login`): logo grande (52 px), eyebrow "Panel de la tienda", "Ingresá para ver pedidos y cargar productos.", campos Email y Contraseña, error en rojo con `role="alert"`, botón "Ingresar". **Quitar** el texto "Prototipo: cualquier email y contraseña sirven."
- **Layout del panel**: `HeaderPanel` (`.hd` con botón volver opcional, título `.atitle` centrado, acción a la derecha) y `NavPanel` (`.tabs`: tabs abajo en móvil con íconos y texto Resumen, Productos, Pedidos, Ajustes; en `lg` barra lateral de 220 px con "L&S Panel" arriba, `.desk .aview .tabs`). Tab activa: texto tinta y rayita vino arriba (móvil) o fondo `rosa-suave` (escritorio). Badge de pendientes en Pedidos: se deja el espacio con prop `pendientes?: number` (se conecta en la etapa 6).
- Botón **Salir** (ícono de puerta) en el header del Resumen.

## Tareas
1. **Usuario admin de desarrollo** en `supabase/seed.sql` (al final): insertar en `auth.users` (con `instance_id = '00000000-0000-0000-0000-000000000000'`, `aud`/`role` `authenticated`, `email = 'admin@ls.test'`, `encrypted_password = crypt('<contraseña de prueba>', gen_salt('bf'))`, `email_confirmed_at = now()`, `raw_app_meta_data = '{"provider":"email","providers":["email"],"role":"admin"}'`, campos de token en `''`) y su fila en `auth.identities`. La contraseña de prueba queda escrita **solo** en `seed.sql` (local) y se menciona en el README local como "ver `supabase/seed.sql`". Sumá un segundo usuario **no admin** (`vendedora@ls.test`) para probar el rechazo. Seguí el formato que use la versión vigente del CLI (si `auth.identities` cambió de columnas, adaptá y anotalo).
2. **`src/services/auth.ts`**:
   - `ingresar(email, contrasena)`: `signInWithPassword`; si el usuario no tiene `app_metadata.role === 'admin'`, hace `signOut` y lanza `ErrorServicio('sin_acceso', 'Esta cuenta no tiene acceso al panel.')`. Credenciales inválidas → `ErrorServicio('credenciales', 'El email o la contraseña no coinciden.')`. Sin red → `ErrorServicio('red', 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.')`.
   - `salir()`, `obtenerSesion()` (devuelve `{ email } | null` solo si es admin), `escucharSesion(cb)` (envuelve `onAuthStateChange`, devuelve la función para desuscribirse).
3. **`src/lib/sesion.tsx`**: `SesionProvider` + `useSesion()` con `{ estado: 'cargando' | 'sin-sesion' | 'admin', email }`, usando solo `services/auth`.
4. **`RutaProtegida`** (`src/components/RutaProtegida.tsx`): mientras carga, pantalla neutra (sin parpadeo del login); sin sesión → redirige a `/admin/ingresar?volver=<ruta>`; con sesión → `<Outlet/>`. En `/admin/ingresar` con sesión activa → redirigir a `/admin`.
5. **`IngresarPage`** con validación Zod (email válido: "Escribí un email válido."; contraseña no vacía: "Escribí tu contraseña."), botón deshabilitado y texto "Ingresando…" mientras espera, Enter envía, y después redirige a `volver` o `/admin`.
6. **`PanelLayout`** (`src/components/panel/`): `HeaderPanel`, `NavPanel`, contenedor con scroll; título por ruta (Resumen, Productos, Pedidos, Ajustes, Nuevo producto, Editar producto, Pedido #NNNN). En móvil las tabs se ocultan en formularios y detalle (como el prototipo: `showTabs` solo en las 4 secciones), y el header muestra "Volver".
7. Rutas `/admin/*` dentro de `RutaProtegida` + `PanelLayout`. Las páginas siguen siendo placeholder con su título, salvo lo que hace esta etapa.
8. **Documentación** en el **README**, sección nueva "Administradora": (a) en local el usuario sale de `seed.sql`; (b) en los proyectos remotos, desactivar el registro (**Authentication → Sign In / Providers → Allow new users to sign up: off**), crear el usuario (**Authentication → Users → Add user → Create new user**, con *Auto Confirm User*), y asignarle el rol por SQL:
   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
   where email = '<email de la administradora>';
   ```
   (c) La sesión toma el rol al volver a ingresar. (d) Olvido de contraseña: en el MVP no hay pantalla; se resetea desde el panel de Supabase (Authentication → Users → Send password recovery / o setear una nueva). Verificá los nombres de menú contra la documentación vigente de Supabase y corregilos si cambiaron.
9. Si el proyecto de **desarrollo** ya existe, hacer ahí los pasos (b) con el email que indique el usuario (no inventar uno ni crear la cuenta sin que el usuario lo pida: si hace falta, dejar las instrucciones y pedírselo).

## Archivos que se espera tocar
`supabase/seed.sql`, `src/services/auth.ts`, `src/services/auth.test.ts`, `src/lib/sesion.tsx`, `src/components/RutaProtegida.tsx`, `src/components/panel/{PanelLayout,HeaderPanel,NavPanel}.tsx`, `src/pages/IngresarPage.tsx`, `src/router.tsx`, `README.md`, `PLAN.md`.

## Criterios de aceptación
- [ ] Con la base local recién reseteada, `admin@ls.test` entra al panel; `vendedora@ls.test` ve "Esta cuenta no tiene acceso al panel." y no queda logueada.
- [ ] Credenciales incorrectas muestran el error sin borrar el email.
- [ ] `/admin/productos` sin sesión redirige a `/admin/ingresar?volver=/admin/productos` y, al ingresar, vuelve ahí.
- [ ] Recargar estando en el panel mantiene la sesión.
- [ ] "Salir" cierra la sesión y vuelve al login.
- [ ] Navegación del panel como el prototipo en 390 px (tabs abajo) y en ≥ 1024 px (barra lateral).
- [ ] `supabase/config.toml` tiene `enable_signup = false` y el README explica cómo desactivarlo en los proyectos remotos.
- [ ] Lint, typecheck, tests y build en verde; pgTAP sigue en verde.

## Pruebas requeridas
- `src/services/auth.test.ts` (mock de `@/lib/supabase`): admin ok; no admin → `sin_acceso` y llama a `signOut`; credenciales inválidas → `credenciales`.
- `src/components/RutaProtegida.test.tsx`: cargando, sin sesión (redirección con `volver`), admin (renderiza el hijo).
- `src/pages/IngresarPage.test.tsx`: validación Zod y mensaje de error del servicio.

## Riesgos
- **Rol en el JWT**: `app_metadata` se copia al token al iniciar sesión; si se asigna el rol con la sesión abierta, hay que volver a ingresar. Documentado.
- **Seed de `auth.users`**: el formato interno de Auth cambia entre versiones. Probar `db:reset` desde cero.
- **Parpadeo** del login al recargar: resolver con el estado `cargando`.

## Definición de terminado
Criterios cumplidos, PR con CI en verde, squash merge a `develop`, `develop` en verde, `PLAN.md` actualizado.
