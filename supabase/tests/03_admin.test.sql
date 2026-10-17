-- Administradora (app_metadata.role = admin) frente a un usuario logueado que no es admin.
begin;
select plan(14);

-- Como administradora
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated","app_metadata":{"role":"admin"}}';

select ok(public.es_admin(), 'es_admin() reconoce a la administradora');
select is((select count(*) from public.products), 14::bigint, 'la administradora ve los 14 productos (incluido el inactivo)');
select is((select count(*) from public.product_costs), 14::bigint, 'la administradora ve los costos');
select is((select count(*) from public.orders), 6::bigint, 'la administradora ve los pedidos');

select lives_ok(
  $$ update public.products set precio = 15000 where id = '00000000-0000-4000-8000-000000000001' $$,
  'la administradora puede cambiar un precio'
);

select is(
  (select precio from public.products where id = '00000000-0000-4000-8000-000000000001'),
  15000,
  'el precio quedó actualizado'
);

select throws_ok(
  $$ delete from public.products where id = '00000000-0000-4000-8000-000000000014' $$,
  '42501', null,
  'ni la administradora puede borrar productos (se desactivan)'
);

select lives_ok(
  $$ insert into public.tags (nombre) values ('verano') $$,
  'la administradora puede crear etiquetas'
);

-- Como usuario logueado que NO es admin
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000b001","role":"authenticated","app_metadata":{}}';

select ok(not public.es_admin(), 'es_admin() es false sin el rol');
select is((select count(*) from public.product_costs), 0::bigint, 'el no admin no ve costos');
select is((select count(*) from public.orders) + (select count(*) from public.order_items), 0::bigint, 'el no admin no ve pedidos ni ítems');
select is((select count(*) from public.products), 13::bigint, 'el no admin no ve el producto inactivo');

select throws_ok(
  $$ insert into public.products (nombre, precio) values ('Trucho', 1) $$,
  '42501', null,
  'el no admin no puede crear productos'
);

-- Un update sin permiso no falla, pero no toca ninguna fila (RLS).
update public.products set precio = 1 where id = '00000000-0000-4000-8000-000000000001';
reset role;

select is(
  (select precio from public.products where id = '00000000-0000-4000-8000-000000000001'),
  15000,
  'el update del no admin no cambió el precio'
);

select * from finish();
rollback;
