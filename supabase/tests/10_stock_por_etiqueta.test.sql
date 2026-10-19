-- Stock y ventas por etiqueta, y etiquetas seguidas en el Resumen (etapa 11).
begin;
select plan(22);

-- Ventas con fecha fija para el mes de Buenos Aires (D-23): el 31/1 a las 22 h de Argentina es enero.
insert into public.orders (id, cliente, telefono, total, estado, created_at, vendido_at) values
  ('00000000-0000-4000-b000-0000000000e1', 'Prueba Enero', '351 000-0001', 30000, 'vendido',
    '2026-01-31 10:00-03', '2026-01-31 22:00-03'),
  ('00000000-0000-4000-b000-0000000000e2', 'Prueba Febrero', '351 000-0002', 14500, 'vendido',
    '2026-02-01 00:10-03', '2026-02-01 00:30-03');
insert into public.order_items (order_id, product_id, cantidad, precio_unitario, costo_unitario) values
  ('00000000-0000-4000-b000-0000000000e1', '00000000-0000-4000-8000-000000000001', 2, 15000, 5000),
  ('00000000-0000-4000-b000-0000000000e2', '00000000-0000-4000-8000-000000000001', 1, 14500, 5200);

-- ---------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok($$ select * from public.resumen_etiquetas() $$, '42501', null, 'anon no puede ver el stock por etiqueta');
select throws_ok(
  $$ select public.guardar_etiquetas_seguidas(array['00000000-0000-4000-a000-000000000001'::uuid]) $$,
  '42501', null, 'anon no puede elegir etiquetas'
);
select throws_ok($$ select * from public.etiquetas_seguidas $$, '42501', null, 'anon no puede leer las seguidas');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000b001","role":"authenticated","app_metadata":{}}';

select throws_ok(
  $$ select * from public.resumen_etiquetas() $$, '42501', 'no_autorizado', 'el no admin no ve el stock por etiqueta'
);
select throws_ok(
  $$ select public.guardar_etiquetas_seguidas('{}') $$, '42501', 'no_autorizado', 'el no admin no elige etiquetas'
);
select throws_ok(
  $$ insert into public.etiquetas_seguidas (tag_id) values ('00000000-0000-4000-a000-000000000001') $$,
  '42501', null, 'el no admin no puede insertar seguidas directo'
);

-- ---------------------------------------------------------------------------
-- Cuentas (administradora)
-- ---------------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated","app_metadata":{"role":"admin"}}';

select is(
  (select count(*) from public.resumen_etiquetas()),
  10::bigint,
  'una fila por cada etiqueta de las semillas'
);
select is(
  (select count(*) from public.resumen_etiquetas() where seguida),
  0::bigint,
  'al principio no se sigue ninguna'
);
-- aros: argollas (12), perla mini (8), gota (0) y abridores (6). Vendidas: 1 argolla (#1) y 2 perla mini (#3)
-- en las semillas, más 2 argollas en enero y 1 en febrero.
select results_eq(
  $$ select productos, piezas, unidades, vendidas_mes, vendidas_total
     from public.resumen_etiquetas('2026-01-15 12:00-03') where nombre = 'aros' $$,
  $$ values (4, 3, 26, 2, 6) $$,
  'aros: 4 productos, 3 con stock, 26 unidades, 2 vendidas en enero y 6 en total'
);
select is(
  (select vendidas_mes from public.resumen_etiquetas('2026-02-28 23:59-03') where nombre = 'aros'),
  1,
  'febrero solo cuenta la venta del 1/2'
);
select results_eq(
  $$ select productos, piezas, unidades, vendidas_total from public.resumen_etiquetas() where nombre = 'anillos' $$,
  $$ values (2, 1, 11, 1) $$,
  'anillos: el inactivo cuenta como producto pero no en el stock'
);
select results_eq(
  $$ select piezas, unidades, vendidas_total from public.resumen_etiquetas() where nombre = 'pulseras' $$,
  $$ values (3, 16, 0) $$,
  'pulseras: el pedido pendiente (#5) y el cancelado (#2) no cuentan como vendidos'
);

-- ---------------------------------------------------------------------------
-- Guardar las seguidas
-- ---------------------------------------------------------------------------

select lives_ok(
  $$ select public.guardar_etiquetas_seguidas(array[
       '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000002',
       '00000000-0000-4000-a000-0000000000ff']::uuid[]) $$,
  'guardar ignora una etiqueta que no existe'
);
select results_eq(
  $$ select nombre from public.resumen_etiquetas() where seguida order by nombre $$,
  $$ values ('aros'), ('pulseras') $$,
  'se siguen aros y pulseras'
);
select public.guardar_etiquetas_seguidas(array['00000000-0000-4000-a000-000000000003']::uuid[]);
select results_eq(
  $$ select nombre from public.resumen_etiquetas() where seguida $$,
  $$ values ('collares') $$,
  'guardar reemplaza el conjunto'
);
select public.guardar_etiquetas_seguidas(null);
select is((select count(*) from public.etiquetas_seguidas), 0::bigint, 'guardar sin etiquetas deja de seguir todas');

-- ---------------------------------------------------------------------------
-- Borrar, renombrar y unir
-- ---------------------------------------------------------------------------

select public.guardar_etiquetas_seguidas(array[
  '00000000-0000-4000-a000-000000000009', '00000000-0000-4000-a000-000000000008',
  '00000000-0000-4000-a000-000000000010']::uuid[]);

delete from public.tags where id = '00000000-0000-4000-a000-000000000009';
select is(
  (select count(*) from public.etiquetas_seguidas where tag_id = '00000000-0000-4000-a000-000000000009'),
  0::bigint,
  'borrar perlas la saca de las seguidas'
);

select public.renombrar_etiqueta('00000000-0000-4000-a000-000000000010', 'colgantes');
select ok(
  (select seguida from public.resumen_etiquetas() where nombre = 'colgantes'),
  'renombrar dijes a colgantes la deja seguida'
);

-- acero (seguida) se une a dorado (no seguida): dorado pasa a estar seguida.
select is(
  public.renombrar_etiqueta('00000000-0000-4000-a000-000000000008', 'dorado') ->> 'resultado',
  'unida',
  'acero se une a dorado'
);
select ok(
  (select seguida from public.resumen_etiquetas() where nombre = 'dorado'),
  'la etiqueta que queda hereda «seguida»'
);
select results_eq(
  $$ select nombre from public.resumen_etiquetas() where seguida order by nombre $$,
  $$ values ('colgantes'), ('dorado') $$,
  'quedan seguidas colgantes y dorado'
);

-- Unir una no seguida con otra no seguida no agrega nada.
select public.renombrar_etiqueta('00000000-0000-4000-a000-000000000007', 'aros');
select is((select count(*) from public.etiquetas_seguidas), 2::bigint, 'unir dos no seguidas no cambia las seguidas');

select * from finish();
rollback;
