-- cancelar_pedido: un pendiente no toca stock; un vendido lo repone; un cancelado no vuelve atrás.
begin;
select plan(13);

create function pg_temp.stock(n integer) returns integer language sql as $$
  select stock from public.products where id = ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
$$;

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok(
  $$ select public.cancelar_pedido('00000000-0000-4000-b000-000000000006') $$,
  '42501', null, 'el anónimo no puede ejecutar cancelar_pedido');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000b001","role":"authenticated","app_metadata":{}}';
select throws_ok(
  $$ select public.cancelar_pedido('00000000-0000-4000-b000-000000000006') $$,
  '42501', 'no_autorizado', 'un logueado no admin recibe no_autorizado');

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated","app_metadata":{"role":"admin"}}';

-- Pendiente (#6: argollas x2)
select is(
  public.cancelar_pedido('00000000-0000-4000-b000-000000000006'),
  '{"ok":true,"repuesto":false,"cambios":[]}'::jsonb,
  'cancelar un pendiente no repone nada');
select is(pg_temp.stock(1), 12, 'el stock de las argollas no cambió');
select results_eq(
  $$ select estado, cancelado_at is not null, vendido_at is null from public.orders where numero = 6 $$,
  $$ values ('cancelado'::text, true, true) $$,
  'el pendiente quedó cancelado con fecha');

-- Vendido (#5: se vende y después se cancela)
select lives_ok($$ select public.marcar_vendido('00000000-0000-4000-b000-000000000005') $$, 'se vende el #5');
select is(pg_temp.stock(5), 1, 'la venta descontó la pulsera');

select is(
  public.cancelar_pedido('00000000-0000-4000-b000-000000000005'),
  '{"ok":true,"repuesto":true,"cambios":[
     {"producto_id":"00000000-0000-4000-8000-000000000008","nombre":"Collar corazón","desde":6,"hasta":7},
     {"producto_id":"00000000-0000-4000-8000-000000000005","nombre":"Pulsera eslabón fino","desde":1,"hasta":2}]}'::jsonb,
  'cancelar un vendido repone el stock');
select is(pg_temp.stock(5), 2, 'la pulsera volvió a su stock');
select results_eq(
  $$ select estado, cancelado_at is not null, vendido_at is not null from public.orders where numero = 5 $$,
  $$ values ('cancelado'::text, true, true) $$,
  'el vendido cancelado conserva vendido_at como historial');

-- Cancelado: ni se cancela de nuevo ni se vende
select throws_ok(
  $$ select public.cancelar_pedido('00000000-0000-4000-b000-000000000002') $$,
  'P0001', 'estado_invalido', 'cancelar un cancelado → estado_invalido');
select throws_ok(
  $$ select public.marcar_vendido('00000000-0000-4000-b000-000000000005') $$,
  'P0001', 'estado_invalido', 'vender un cancelado → estado_invalido');
select throws_ok(
  $$ select public.cancelar_pedido('00000000-0000-4000-b000-000000000999') $$,
  'P0002', 'pedido_inexistente', 'pedido inexistente → P0002');

select * from finish();
rollback;
