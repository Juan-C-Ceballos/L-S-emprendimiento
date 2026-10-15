# Etapa 1 · Base de datos

> Leé antes `CLAUDE.md`. Este archivo alcanza para ejecutar la etapa. Las decisiones citadas (D-NN) están en `docs/decisions.md`.

## Objetivo
Esquema completo del MVP versionado con migraciones del Supabase CLI: tablas, índices, CHECKs, RLS en todas las tablas, `product_costs` aislada, las funciones `crear_pedido`, `marcar_vendido` y `cancelar_pedido`, semillas alineadas con el prototipo, pruebas pgTAP (incluida la prueba de que el anónimo **no** puede leer costos, pedidos ni productos inactivos), tipos de TypeScript generados y el job de CI que valida migraciones y corre las pruebas de base.

## Rama
`feature/01-base-de-datos` desde `develop` (con la etapa 0 mergeada).

## Dependencias
- Etapa 0 (scripts de npm, CI con job `frontend`, `src/types/database.ts` placeholder).
- Docker Desktop corriendo en la máquina.
- **No** necesita el proyecto remoto de desarrollo para trabajar: todo se hace en local. Ver "Al mergear" para aplicarlo al proyecto de dev.

## Pantallas del prototipo que implementa
Ninguna. Fija el contrato de datos que usan todas las pantallas. Los datos semilla salen de `seed()` en `prototype/src/main.html`.

## Tareas

### 1. Supabase CLI
- `npm i -D supabase` (D-17) y `npx supabase init` (crea `supabase/config.toml`; mantené `supabase/migrations/` y `supabase/tests/`).
- En `supabase/config.toml`: `[auth] enable_signup = false`, `site_url = "http://localhost:5173"`, `[auth.email] enable_confirmations = false`. `project_id = "ls-pedidos"`.
- Scripts en `package.json`:
  ```json
  "db:start": "supabase start",
  "db:stop": "supabase stop",
  "db:reset": "supabase db reset",
  "db:test": "supabase test db",
  "db:lint": "supabase db lint --level error",
  "db:types": "supabase gen types typescript --local > src/types/database.ts"
  ```
  (npm resuelve `supabase` desde `node_modules/.bin`.) En Windows, si la redirección `>` da problemas de codificación (UTF-16), usar `supabase gen types typescript --local --schema public` y escribir con un script de Node `scripts/gen-types.mjs`.

### 2. Migración `…_esquema_inicial.sql` (`npx supabase migration new esquema_inicial`)
Todo en una migración; RLS activado en la misma migración que crea cada tabla.

**Función de rol**
```sql
create function public.es_admin() returns boolean
language sql stable security invoker set search_path = ''
as $$ select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false) $$;
```
`grant execute` a `anon` y `authenticated` (las políticas la evalúan con el rol de quien consulta).

**Tablas** (D-04, D-05, D-14):
- `products`: `id uuid pk default gen_random_uuid()`, `nombre text not null check (char_length(btrim(nombre)) between 1 and 120)`, `descripcion text not null default ''`, `precio integer not null check (precio >= 0)`, `stock integer not null default 0 check (stock >= 0)`, `activo boolean not null default true`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.
- `product_images`: `id uuid pk`, `product_id uuid not null references products(id)`, `path text not null`, `path_miniatura text not null`, `orden integer not null check (orden >= 0)`, `created_at`.
- `tags`: `id uuid pk`, `nombre text not null unique check (nombre = lower(btrim(nombre)) and char_length(nombre) between 1 and 40)`, `created_at`.
- `product_tags`: `product_id uuid references products(id)`, `tag_id uuid references tags(id) on delete cascade`, `primary key (product_id, tag_id)`.
- `product_costs`: `product_id uuid primary key references products(id)`, `costo integer not null check (costo >= 0)`, `updated_at`.
- `orders`: `id uuid pk`, `numero bigint generated always as identity unique`, `estado text not null default 'pendiente' check (estado in ('pendiente','vendido','cancelado'))`, `cliente text not null check (char_length(btrim(cliente)) between 2 and 80)`, `telefono text not null check (char_length(regexp_replace(telefono, '\D', '', 'g')) between 8 and 15)`, `total bigint not null check (total >= 0)`, `created_at timestamptz not null default now()`, `vendido_at timestamptz`, `cancelado_at timestamptz`, y un CHECK de coherencia:
  `(estado = 'pendiente' and vendido_at is null and cancelado_at is null) or (estado = 'vendido' and vendido_at is not null and cancelado_at is null) or (estado = 'cancelado' and cancelado_at is not null)`.
- `order_items`: `id uuid pk`, `order_id uuid not null references orders(id) on delete cascade`, `product_id uuid not null references products(id)`, `cantidad integer not null check (cantidad > 0)`, `precio_unitario integer not null check (precio_unitario >= 0)`, `costo_unitario integer not null check (costo_unitario >= 0)`, `unique (order_id, product_id)`.
- Trigger `set_updated_at` en `products` y `product_costs`.

**Índices**: `products (activo)`; `product_images (product_id, orden)`; `product_tags (tag_id)`; `orders (estado, created_at desc)`; `orders (vendido_at) where estado = 'vendido'`; `order_items (order_id)`; `order_items (product_id)`.

**Permisos (defensa en profundidad, además de RLS)**:
- `revoke all on all tables in schema public from anon, authenticated;` y después otorgar lo justo:
  - `anon`: `select` en `products`, `product_images`, `tags`, `product_tags`.
  - `authenticated`: `select, insert, update` en todas las tablas; `delete` solo en `product_images`, `product_tags`, `tags`. **Nunca `delete` en `products`** (no se borran).
- `alter default privileges in schema public revoke execute on functions from public;` y `revoke execute on all functions in schema public from public, anon, authenticated;` antes de otorgar cada función explícitamente.

**RLS** (`alter table … enable row level security` en las 7 tablas):
- `products`: `select` para `anon, authenticated` con `using (activo or public.es_admin())`; `insert`/`update` para `authenticated` con `public.es_admin()`.
- `product_images`: `select` con `using (public.es_admin() or exists (select 1 from public.products p where p.id = product_id and p.activo))`; escritura (`insert`, `update`, `delete`) solo `es_admin()`.
- `tags`: `select` para todos con `using (true)` (D-15); escritura solo `es_admin()`.
- `product_tags`: `select` igual que `product_images`; escritura solo `es_admin()`.
- `product_costs`: **todas** las operaciones solo `es_admin()`. Ninguna política para `anon`.
- `orders` y `order_items`: `select`/`update` solo `es_admin()`. **Sin política de `insert`** para nadie (los inserta `crear_pedido`, que es `security definer`).

### 3. Migración `…_funciones_pedidos.sql`

**`crear_pedido`** — `security definer`, `set search_path = ''`, `grant execute` a `anon, authenticated`.
```sql
create function public.crear_pedido(
  p_items jsonb,               -- [{"producto_id": uuid, "cantidad": int}, ...]
  p_cliente text,
  p_telefono text,
  p_total_esperado bigint default null   -- D-24: solo para detectar cambios de precio
) returns jsonb
```
Comportamiento:
1. Validar entrada; si es inválida, `raise exception 'datos_invalidos: <motivo>' using errcode = '22023'`: `p_items` es un array no vacío; cada elemento con `producto_id` uuid válido y `cantidad` entero > 0; `p_cliente` con 2 a 80 caracteres tras `btrim`; `p_telefono` con 8 a 15 dígitos.
2. Agrupar líneas repetidas del mismo producto (sumar cantidades).
3. Leer de `public.products` y `public.product_costs` los productos pedidos. Juntar errores de negocio **sin insertar nada**:
   - `{"tipo": "inexistente", "producto_id"}` si no existe.
   - `{"tipo": "inactivo", "producto_id", "nombre"}` si `activo = false`.
   - `{"tipo": "stock_insuficiente", "producto_id", "nombre", "disponible": stock, "pedido": cantidad}`.
   Si hay errores: `return jsonb_build_object('ok', false, 'errores', …)`.
4. Calcular el total con los precios reales. Si `p_total_esperado is not null` y difiere: devolver `{"ok": false, "errores": [{"tipo": "precio_cambiado"}], "precios": [{"producto_id", "precio"}], "total_actual": n}` sin insertar.
5. Insertar `orders` (estado `pendiente`) y `order_items` con `precio_unitario = products.precio` y `costo_unitario = coalesce(product_costs.costo, 0)`.
6. Devolver:
   ```json
   {"ok": true, "pedido": {"id": "…", "numero": 7, "total": 29000, "cliente": "Ana",
     "items": [{"producto_id": "…", "nombre": "…", "cantidad": 2, "precio_unitario": 14500, "subtotal": 29000}]}}
   ```
   **Nunca** devuelve costos.
- El stock **no** se modifica.

**`marcar_vendido(p_pedido_id uuid) returns jsonb`** — `security invoker`, `set search_path = ''`, `grant execute` solo a `authenticated`.
1. `if not public.es_admin() then raise exception 'no_autorizado' using errcode = '42501'`.
2. `select … from public.orders where id = p_pedido_id for update`. Si no existe: `raise exception 'pedido_inexistente' using errcode = 'P0002'`. Si `estado <> 'pendiente'`: `raise exception 'estado_invalido' using errcode = 'P0001', detail = estado`.
3. Bloquear los productos del pedido con `for update` **ordenados por id** (evita deadlocks).
4. Si algún producto tiene `stock < cantidad`: `raise exception 'stock_insuficiente' using errcode = 'P0001', detail = <json con [{producto_id, nombre, disponible, pedido}]>`.
5. Descontar stock, `estado = 'vendido'`, `vendido_at = now()`.
6. Devolver `{"ok": true, "cambios": [{"producto_id", "nombre", "desde", "hasta"}]}` (para el aviso "Listo: se descontó el stock").

**`cancelar_pedido(p_pedido_id uuid) returns jsonb`** — mismo encabezado que `marcar_vendido`.
1. Mismos chequeos de admin y existencia (con `for update`).
2. Si `estado = 'cancelado'`: `raise exception 'estado_invalido'`.
3. Si `estado = 'vendido'`: bloquear productos (ordenados) y **reponer** stock.
4. `estado = 'cancelado'`, `cancelado_at = now()` (si estaba vendido, `vendido_at` se conserva como historial).
5. Devolver `{"ok": true, "repuesto": bool, "cambios": [...]}` (vacío si no se repuso).

Las tres funciones: un solo `begin…end` de plpgsql = una transacción. Comentá cada función con `comment on function`.

### 4. Semillas `supabase/seed.sql` (solo desarrollo; producción arranca vacía)
- Los 14 productos de `seed()` del prototipo con **UUID fijos** (`'00000000-0000-4000-8000-0000000000NN'`, NN = id del prototipo) para usarlos en pruebas. El 14 ("Anillo piedra verde") inactivo; el 3 ("Aros gota martillada") con stock 0.
- Costos en `product_costs` para los 14.
- Las 10 etiquetas (`aros, pulseras, collares, cadenas, anillos, dorado, plateado, acero, perlas, dijes`) y sus relaciones.
- Imágenes (D-27): generá una vez los SVG con `scripts/generar-placeholders.mjs`, que copia el SVG de `prototype/src/placeholder.html` (componente `Ph`) y reemplaza `kind`, `tone`, `metal` y `v` según `seed()` (los mapas `tone()` y `metal()` están en `main.html`). Escribí `public/seed/p{NN}-{i}.svg`. En `product_images`: `path = path_miniatura = '/seed/p{NN}-{i}.svg'`, `orden = i`. Commiteá los SVG generados.
- Los 6 pedidos de ejemplo con sus ítems, `created_at = now() - interval 'N days'` como en el prototipo, `vendido_at`/`cancelado_at` coherentes con el estado, y los precios/costos unitarios **del pedido** (el #1 tiene 13.900 en "Argollas clásicas", distinto del precio actual 14.500, a propósito). Insertalos en orden para que `numero` quede de 1 a 6.

### 5. Pruebas pgTAP (`supabase/tests/`)
Ayudas al inicio de cada archivo:
```sql
begin; select plan(N);
-- como anónimo
set local role anon; set local request.jwt.claims = '{"role":"anon"}';
-- como administradora
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated","app_metadata":{"role":"admin"}}';
-- como usuario logueado que NO es admin
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000b001","role":"authenticated","app_metadata":{}}';
… select * from finish(); rollback;
```
Archivos y casos mínimos:
- `00_estructura.test.sql`: existen las 7 tablas; **todas las tablas de `public` tienen RLS** (consulta genérica a `pg_class` con `relrowsecurity`, así detecta tablas futuras sin RLS); las funciones `security definer` de `public` tienen `search_path` fijado (`proconfig`); `anon` solo tiene `execute` sobre `crear_pedido` y `es_admin`.
- `01_anon_lectura.test.sql`: el anónimo ve 13 productos (no el inactivo); no ve imágenes ni `product_tags` del inactivo; **`product_costs` → `permission denied` (42501)**; **`orders` y `order_items` → `permission denied`**; ve las 10 etiquetas.
- `02_anon_escritura.test.sql`: `insert` en `orders`, `products`, `product_costs` falla; `update` de `products.precio` falla; `delete` de `products` falla.
- `03_admin.test.sql`: la administradora ve los 14 productos y los costos; puede actualizar precio; **no** puede borrar productos; un usuario autenticado no admin no ve costos ni pedidos ni el producto inactivo.
- `04_crear_pedido.test.sql`: pedido válido como anónimo → `ok: true`, inserta pedido pendiente con `precio_unitario` y `costo_unitario` de la base, `total` correcto, stock sin cambios; líneas duplicadas se suman; producto inactivo → `inactivo` y no inserta; cantidad > stock → `stock_insuficiente` y no inserta; producto con stock 0 → `stock_insuficiente`; `p_total_esperado` distinto → `precio_cambiado` y no inserta; nombre de 1 letra o teléfono de 5 dígitos → excepción `22023`; `items` vacío → `22023`; el resultado no contiene la clave `costo` en ningún nivel; `numero` es correlativo.
- `05_marcar_vendido.test.sql`: anónimo → sin permiso; no admin → `no_autorizado`; admin con stock suficiente → descuenta, `vendido`, `vendido_at` no nulo, devuelve cambios; pedido ya vendido → `estado_invalido`; stock insuficiente → error y **nada cambia** (ni stock ni estado).
- `06_cancelar_pedido.test.sql`: cancelar pendiente → no toca stock; cancelar vendido → repone stock y `repuesto: true`; cancelar cancelado → `estado_invalido`; vender cancelado → `estado_invalido`.

### 6. Tipos
`npm run db:types` → `src/types/database.ts` (reemplaza el placeholder de la etapa 0). Agregá `src/types/dominio.ts` con tipos de dominio (`Producto`, `ProductoCatalogo`, `Pedido`, `ItemPedido`, `EstadoPedido`, `ResultadoCrearPedido`) derivados de los generados, para que las etapas siguientes no dependan de las filas crudas.

### 7. CI: job `base-de-datos` en `.github/workflows/ci.yml`
- `ubuntu-latest`, `actions/checkout@v4`, `actions/setup-node@v4` (`node-version-file: .nvmrc`, `cache: npm`), `npm ci`.
- `npx supabase start -x studio,imgproxy,inbucket,edge-runtime,logflare,vector,supavisor,realtime` (levanta Postgres, Auth, Storage y la API; Storage hace falta desde la etapa 3 por `storage.buckets`). Si algún nombre de servicio en `-x` no existe en la versión del CLI, sacalo.
- `npm run db:lint`, `npm run db:test`.
- Tipos al día: `npx supabase gen types typescript --local > /tmp/database.ts && diff -u src/types/database.ts /tmp/database.ts`.
- Mismo `concurrency` que `frontend`. Anotá en `docs/github-setup.md` que el check requerido `base-de-datos` ya existe.

## Archivos que se espera tocar
`package.json`, `package-lock.json`, `supabase/config.toml`, `supabase/migrations/*_esquema_inicial.sql`, `supabase/migrations/*_funciones_pedidos.sql`, `supabase/seed.sql`, `supabase/tests/0*.test.sql`, `scripts/generar-placeholders.mjs`, `public/seed/*.svg`, `src/types/database.ts`, `src/types/dominio.ts`, `.github/workflows/ci.yml`, `docs/github-setup.md`, `PLAN.md`.

## Criterios de aceptación
- [ ] `npm run db:reset` aplica migraciones y semillas sin errores desde cero.
- [ ] `npm run db:test` pasa todas las pruebas, incluidas las de anónimo sin acceso a costos, pedidos ni productos inactivos.
- [ ] `npm run db:lint` sin errores.
- [ ] Las 7 tablas tienen RLS; ninguna tabla de `public` queda sin RLS.
- [ ] `crear_pedido` ignora cualquier precio que no venga de la base y nunca devuelve costos.
- [ ] `marcar_vendido` y `cancelar_pedido` son atómicas: ante un error no queda ningún cambio parcial (probado).
- [ ] `src/types/database.ts` generado y al día; el job `base-de-datos` del CI lo verifica.
- [ ] Lint, typecheck, tests y build del frontend siguen en verde.

## Pruebas requeridas
Las seis de la tarea 5. El CI corre `frontend` y `base-de-datos`.

## Riesgos
- **Permisos por defecto de Supabase**: Supabase otorga por defecto permisos amplios a `anon` y `authenticated` sobre tablas y funciones nuevas. Por eso los `revoke` explícitos y la prueba genérica de `00_estructura`.
- **`security definer` mal configurada**: sin `search_path` fijo es una vía de escalada. Prueba en `00_estructura`.
- **Deadlocks** al vender pedidos concurrentes: bloquear productos siempre ordenados por id.
- **CI lento**: `supabase start` tarda 1 a 3 minutos. Es aceptable. Si se vuelve inestable, documentarlo y marcar el job como requerido solo para PR a `main`.
- **Codificación en Windows** al generar tipos (ver tarea 1).

## Al mergear
Si el proyecto de Supabase **de desarrollo** ya existe (ver "Qué necesito del usuario" en `PLAN.md`): `npx supabase link --project-ref <ref-dev>` y `npx supabase db push`. Las semillas **no** se aplican automáticamente en remoto; para tener datos de prueba en dev, correr `supabase/seed.sql` desde el SQL Editor del proyecto de desarrollo (los SVG se sirven desde el sitio). Si todavía no existe, anotarlo como pendiente en `PLAN.md`.

## Definición de terminado
Criterios cumplidos, PR `feature/01-base-de-datos` → `develop` con CI (`frontend` + `base-de-datos`) en verde, squash merge, `develop` en verde, `PLAN.md` actualizado (casilla, registro y estado del push a dev).
