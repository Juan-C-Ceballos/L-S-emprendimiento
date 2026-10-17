-- Resumen del panel y gestión global de etiquetas (etapa 7).
begin;
select plan(24);

-- Pedidos vendidos con fecha fija para probar el cambio de mes en hora de Buenos Aires (D-23):
-- el 31/1 a las 22 h de Argentina ya es 1/2 en UTC, pero cuenta para enero.
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

select throws_ok($$ select public.resumen_panel() $$, '42501', null, 'anon no puede ver el resumen');
select throws_ok(
  $$ select public.renombrar_etiqueta('00000000-0000-4000-a000-000000000008', 'x') $$,
  '42501', null, 'anon no puede renombrar etiquetas'
);
select throws_ok(
  $$ delete from public.tags where nombre = 'acero' $$,
  '42501', null, 'anon no puede borrar etiquetas'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000b001","role":"authenticated","app_metadata":{}}';

select throws_ok($$ select public.resumen_panel() $$, '42501', 'no_autorizado', 'el no admin no ve el resumen');
select throws_ok(
  $$ select public.renombrar_etiqueta('00000000-0000-4000-a000-000000000008', 'x') $$,
  '42501', 'no_autorizado', 'el no admin no renombra etiquetas'
);

-- ---------------------------------------------------------------------------
-- Resumen (administradora)
-- ---------------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated","app_metadata":{"role":"admin"}}';

select is(
  public.resumen_panel() -> 'pendientes',
  '{"cantidad": 2, "monto": 67700}'::jsonb,
  'pendientes de las semillas: #0005 y #0006 por $67.700'
);
select is(
  public.resumen_panel() -> 'stock_bajo',
  '{"cantidad": 2, "agotados": 1}'::jsonb,
  'stock bajo: gota martillada (0) y pulsera (2); el anillo inactivo no cuenta'
);
select is(
  public.resumen_panel('2026-01-15 12:00-03') -> 'ventas_mes',
  '{"mes": "2026-01", "cantidad": 1, "total": 30000, "ganancia": 20000}'::jsonb,
  'enero incluye la venta del 31/1 a las 22 h de Argentina'
);
select is(
  public.resumen_panel('2026-02-28 23:59-03') -> 'ventas_mes',
  '{"mes": "2026-02", "cantidad": 1, "total": 14500, "ganancia": 9300}'::jsonb,
  'febrero solo incluye la venta del 1/2'
);
select is(
  public.resumen_panel('2026-03-01 00:00-03') -> 'ventas_mes',
  '{"mes": "2026-03", "cantidad": 0, "total": 0, "ganancia": 0}'::jsonb,
  'un mes sin ventas da ceros'
);
select is(
  (public.resumen_panel() -> 'ventas_mes' ->> 'cantidad')::int,
  (select count(*)::int from public.orders o
    where o.estado = 'vendido'
      and date_trunc('month', o.vendido_at at time zone 'America/Argentina/Buenos_Aires')
        = date_trunc('month', now() at time zone 'America/Argentina/Buenos_Aires')),
  'sin fecha usa el mes actual'
);

-- ---------------------------------------------------------------------------
-- Renombrar y unir etiquetas
-- ---------------------------------------------------------------------------

select is(
  public.renombrar_etiqueta('00000000-0000-4000-a000-000000000010', '  Dijes  '),
  '{"resultado": "sin_cambios", "id": "00000000-0000-4000-a000-000000000010"}'::jsonb,
  'el mismo nombre (normalizado) no cambia nada'
);
select is(
  public.renombrar_etiqueta('00000000-0000-4000-a000-000000000010', 'Dijes   y colgantes'),
  '{"resultado": "renombrada", "id": "00000000-0000-4000-a000-000000000010"}'::jsonb,
  'renombrar a un nombre nuevo'
);
select is(
  (select nombre from public.tags where id = '00000000-0000-4000-a000-000000000010'),
  'dijes y colgantes',
  'el nombre se guarda normalizado'
);
select is(
  (select count(*) from public.product_tags where tag_id = '00000000-0000-4000-a000-000000000010'),
  3::bigint,
  'renombrar no cambia qué productos la usan'
);

-- acero (7 productos) → dorado (8): 4 tenían las dos, quedan 11 con dorado y ninguno repetido.
select is(
  public.renombrar_etiqueta('00000000-0000-4000-a000-000000000008', 'DORADO'),
  '{"resultado": "unida", "id": "00000000-0000-4000-a000-000000000006"}'::jsonb,
  'renombrar a una etiqueta que ya existe las une'
);
select is(
  (select count(*) from public.tags where nombre = 'acero'),
  0::bigint,
  'acero ya no existe'
);
select is(
  (select count(*) from public.product_tags where tag_id = '00000000-0000-4000-a000-000000000006'),
  11::bigint,
  'dorado queda en 11 productos'
);
select is(
  (select count(*) from public.product_tags
    where product_id = '00000000-0000-4000-8000-000000000001' and tag_id = '00000000-0000-4000-a000-000000000006'),
  1::bigint,
  'un producto que tenía las dos queda con una sola'
);

select throws_ok(
  $$ select public.renombrar_etiqueta('00000000-0000-4000-a000-000000000006', '   ') $$,
  '22023', null, 'un nombre vacío se rechaza'
);
select throws_ok(
  $$ select public.renombrar_etiqueta('00000000-0000-4000-a000-0000000000ff', 'nueva') $$,
  'P0002', 'etiqueta_inexistente', 'una etiqueta que no existe da error'
);

-- ---------------------------------------------------------------------------
-- Eliminar
-- ---------------------------------------------------------------------------

delete from public.tags where id = '00000000-0000-4000-a000-000000000009';
select is(
  (select count(*) from public.product_tags where tag_id = '00000000-0000-4000-a000-000000000009'),
  0::bigint,
  'eliminar perlas la quita de todos los productos'
);
select is(
  (select count(*) from public.products),
  14::bigint,
  'eliminar una etiqueta no borra productos'
);
select is(
  (select count(*) from public.product_tags where product_id = '00000000-0000-4000-8000-000000000002'),
  2::bigint,
  'los aros perla siguen con sus otras etiquetas'
);

select * from finish();
rollback;
