# Etapa 11 · Stock por etiqueta (MVP 2)

> Leé antes `CLAUDE.md`. Este archivo alcanza para ejecutar la etapa.

## Objetivo
Casi todas las piezas son únicas (stock 1), así que el stock por producto le dice poco a la administradora. Necesita ver, **por etiqueta** (aros, pulseras, collares…), cuántas unidades quedan y cuántas se vendieron. Decidido con el usuario (2026-10-19):
- Una sección **"Por etiqueta"** en el Resumen.
- Ella elige **un solo conjunto** de etiquetas a seguir, **desde el Resumen**, y queda guardado en la base. Así se ve igual desde el teléfono y desde la compu.
- Sin ninguna elegida, se muestran todas.

## Rama
`feature/11-stock-por-etiqueta` desde `develop`.

## Dependencias
- Etapa 7 (Resumen, `resumen_panel`, `renombrar_etiqueta`, D-39) y etapa 6 (pedidos vendidos).

## Por qué una tabla nueva (y no `settings`)
`settings` es de lectura pública (el catálogo necesita el número de WhatsApp), así que una preferencia ahí sería visible para cualquiera.

Una tabla nueva **solo para la administradora** no toca los permisos existentes. Una fila por etiqueta, con clave foránea a `tags`, mantiene la integridad:
- borrar una etiqueta la saca de las seguidas;
- renombrarla la deja seguida.

Si más adelante hacen falta varios conjuntos ("Tipos", "Materiales"), se agrega una tabla de grupos y una columna `grupo_id` en otra migración, sin perder lo elegido. Una fila única con JSON se descartó porque la base no puede validar las referencias.

## Tareas
1. **Migración `…_stock_por_etiqueta.sql`**:
   - Tabla `public.etiquetas_seguidas (tag_id uuid primary key references public.tags (id) on delete cascade, created_at timestamptz not null default now())`.
     - RLS activado y políticas select/insert/delete solo `es_admin()`.
     - `revoke all` a `anon` y `authenticated`; `grant select, insert, delete` a `authenticated`.
     - Comentario de tabla.
   - `resumen_etiquetas(p_ahora timestamptz default null) returns table (...)`:
     - `security invoker`, `stable`, `set search_path = ''`, chequeo `es_admin()` (errcode 42501).
     - Devuelve una fila por **cada** etiqueta:
       - `id`, `nombre` y `seguida`;
       - `productos`: todos los que la usan, para el selector;
       - `piezas`: activos con stock > 0;
       - `unidades`: suma del stock de los activos;
       - `vendidas_mes`: unidades de pedidos `vendido` con `vendido_at` en el mes actual de Buenos Aires, igual que `resumen_panel` (D-23);
       - `vendidas_total`: desde siempre.
     - Las ventas se cuentan con las etiquetas **actuales** del producto.
   - `guardar_etiquetas_seguidas(p_ids uuid[])`: `security invoker`, solo admin. En una transacción borra todas e inserta las que existan.
   - `create or replace` de `renombrar_etiqueta`: al **unir**, si la etiqueta que desaparece estaba seguida, la que queda pasa a estar seguida (`insert … on conflict do nothing` antes del `delete`).
   - `revoke execute` a `public`, `anon` y `authenticated`; `grant execute` a `authenticated`, como en `resumen_y_etiquetas`.
2. **pgTAP `10_stock_por_etiqueta.test.sql`**:
   - anon sin acceso a la tabla ni a las funciones;
   - cuentas con las semillas;
   - borde de mes con `p_ahora` fijo;
   - inactivos fuera del stock;
   - pendientes y cancelados fuera de las ventas;
   - guardar reemplaza el conjunto e ignora ids inexistentes;
   - borrar una etiqueta la saca de seguidas;
   - unir conserva la seguida.
   - Sumar tabla y funciones a `00_estructura`. Después, `npm run db:types`.
3. **Servicios** (`src/services/resumen.ts`):
   - `obtenerStockPorEtiqueta()` (Zod y mapeo a camelCase; tipo `StockEtiqueta` en `src/types/dominio.ts`), cargado en paralelo dentro de `obtenerDatosResumen`;
   - `guardarEtiquetasSeguidas(ids)`;
   - error 42501 → `sin_acceso`.
4. **Lógica pura** (`src/lib/resumen.ts`): `etiquetasAMostrar(lista)` devuelve las seguidas, o todas si no hay ninguna, ordenadas por unidades de mayor a menor (desempate por nombre).
5. **Pantalla** (`ResumenPage`): sección "Por etiqueta" debajo de "Para reponer".
   - Columnas Etiqueta / Quedan / Mes / Total; "Quedan" va en rojo con 0 y en ámbar con `STOCK_BAJO` o menos.
   - Cada etiqueta lleva a `/admin/productos?q={nombre}`.
   - Nota: "Una pieza con varias etiquetas cuenta en cada una."
   - Botón "Elegir etiquetas".
6. **Componente `SelectorEtiquetasResumen`** (`src/components/panel/`):
   - en el lugar, sin modal;
   - lista con checkbox, nombre y cantidad de productos, más "Cancelar" y "Guardar";
   - objetivos de 44 px y `aria-live` para "Guardado";
   - al guardar, relee el Resumen.
7. D-43 en `docs/decisions.md`.

## Archivos que se espera tocar
`supabase/migrations/*_stock_por_etiqueta.sql`, `supabase/tests/{00_estructura,10_stock_por_etiqueta}.test.sql`, `src/types/{database,dominio}.ts`, `src/services/resumen.ts` (+ test), `src/lib/resumen.ts` (+ test), `src/pages/ResumenPage.tsx` (+ test), `src/components/panel/SelectorEtiquetasResumen.tsx`, `docs/decisions.md`, `PLAN.md`.

## Criterios de aceptación
- [ ] Sin etiquetas elegidas, "Por etiqueta" muestra todas, ordenadas por unidades.
- [ ] Elegir 3 y guardar deja solo esas; al recargar siguen elegidas.
- [ ] Vender un pedido suma sus unidades en "Mes" y "Total" de cada etiqueta de sus productos y baja "Quedan".
- [ ] Borrar una etiqueta seguida la saca de la tabla; unirla con otra deja seguida a la que queda.
- [ ] Un usuario anónimo no puede leer `etiquetas_seguidas` ni llamar a las funciones.
- [ ] Lint, typecheck, tests, build y pgTAP en verde.

## Riesgos
- **Zona horaria**: mismo cálculo de mes que `resumen_panel`. Probarlo con fechas fijas.
- **Doble conteo esperado**: una pieza con "aros" y "dorado" suma en las dos filas. La nota de la pantalla lo aclara.
- **Producción**: la migración se aplica a `ls-dev` después del merge (`db push`, la corre el usuario) y a `ls-prod` en la release siguiente (`db push --db-url`, D-41).

## Definición de terminado
Criterios cumplidos, verificado en el navegador contra el Supabase local, PR con CI en verde, squash merge a `develop`, migración aplicada en `ls-dev`, `PLAN.md` actualizado.
