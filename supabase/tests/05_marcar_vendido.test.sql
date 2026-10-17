-- marcar_vendido: solo administradora, descuenta stock, todo o nada.
begin;
select plan(15);

create function pg_temp.stock(n integer) returns integer language sql as $$
  select stock from public.products where id = ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
$$;

-- Permisos
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok(
  $$ select public.marcar_vendido('00000000-0000-4000-b000-000000000005') $$,
  '42501', null, 'el anónimo no puede ejecutar marcar_vendido');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000b001","role":"authenticated","app_metadata":{}}';
select throws_ok(
  $$ select public.marcar_vendido('00000000-0000-4000-b000-000000000005') $$,
  '42501', 'no_autorizado', 'un logueado no admin recibe no_autorizado');

-- Como administradora: pedido #5 (pulsera eslabón x1 con stock 2; collar corazón x1 con stock 7)
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated","app_metadata":{"role":"admin"}}';

select is(
  public.marcar_vendido('00000000-0000-4000-b000-000000000005'),
  '{"ok":true,"cambios":[
     {"producto_id":"00000000-0000-4000-8000-000000000008","nombre":"Collar corazón","desde":7,"hasta":6},
     {"producto_id":"00000000-0000-4000-8000-000000000005","nombre":"Pulsera eslabón fino","desde":2,"hasta":1}]}'::jsonb,
  'devuelve los cambios de stock');
select is(pg_temp.stock(5), 1, 'descontó la pulsera');
select is(pg_temp.stock(8), 6, 'descontó el collar');
select results_eq(
  $$ select estado, vendido_at is not null from public.orders where numero = 5 $$,
  $$ values ('vendido'::text, true) $$,
  'el pedido quedó vendido con fecha de venta');

select throws_ok(
  $$ select public.marcar_vendido('00000000-0000-4000-b000-000000000005') $$,
  'P0001', 'estado_invalido', 'un pedido ya vendido no se vuelve a vender');

select throws_ok(
  $$ select public.marcar_vendido('00000000-0000-4000-b000-000000000999') $$,
  'P0002', 'pedido_inexistente', 'pedido inexistente → P0002');

-- Stock insuficiente en uno de dos productos: nada cambia.
reset role;
select set_config('t.r', public.crear_pedido(
  '[{"producto_id":"00000000-0000-4000-8000-000000000004","cantidad":1},
    {"producto_id":"00000000-0000-4000-8000-000000000007","cantidad":2}]', 'Ana', '3515551234')::text, true);
update public.products set stock = 1 where id = '00000000-0000-4000-8000-000000000007';

set local role authenticated;
select throws_ok(
  format($$ select public.marcar_vendido(%L) $$, current_setting('t.r')::jsonb -> 'pedido' ->> 'id'),
  'P0001', 'stock_insuficiente', 'stock insuficiente → error');
reset role;

select is(pg_temp.stock(4), 6, 'el producto con stock suficiente no se descontó');
select is(pg_temp.stock(7), 1, 'el producto sin stock suficiente quedó igual');
select is(
  (select estado from public.orders where id = (current_setting('t.r')::jsonb -> 'pedido' ->> 'id')::uuid),
  'pendiente', 'el pedido sigue pendiente');

-- El detalle del error trae qué falta (para mostrarlo en el panel).
create function pg_temp.detalle_error(p uuid) returns jsonb language plpgsql as $$
declare v text;
begin
  perform public.marcar_vendido(p);
  return null;
exception when others then
  get stacked diagnostics v = pg_exception_detail;
  return v::jsonb;
end $$;

set local role authenticated;
select is(
  pg_temp.detalle_error((current_setting('t.r')::jsonb -> 'pedido' ->> 'id')::uuid),
  '[{"producto_id":"00000000-0000-4000-8000-000000000007","nombre":"Pulsera de dijes","disponible":1,"pedido":2}]'::jsonb,
  'el detalle de stock_insuficiente lista los faltantes');

select throws_ok(
  $$ select public.marcar_vendido('00000000-0000-4000-b000-000000000002') $$,
  'P0001', 'estado_invalido', 'un pedido cancelado no se vende');
reset role;

select is(pg_temp.stock(1), 12, 'ningún otro stock cambió');

select * from finish();
rollback;
