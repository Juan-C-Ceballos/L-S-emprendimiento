-- Escritura como cliente anónimo: todo rechazado. Los pedidos solo entran por crear_pedido.
begin;
select plan(7);

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$ insert into public.orders (cliente, telefono, total) values ('Ana', '3515551234', 1) $$,
  '42501', null,
  'el anónimo no puede insertar pedidos directo'
);

select throws_ok(
  $$ insert into public.order_items (order_id, product_id, cantidad, precio_unitario, costo_unitario)
     values ('00000000-0000-4000-b000-000000000005', '00000000-0000-4000-8000-000000000001', 1, 1, 0) $$,
  '42501', null,
  'el anónimo no puede insertar ítems de pedido'
);

select throws_ok(
  $$ insert into public.products (nombre, precio) values ('Trucho', 1) $$,
  '42501', null,
  'el anónimo no puede insertar productos'
);

select throws_ok(
  $$ insert into public.product_costs (product_id, costo) values ('00000000-0000-4000-8000-000000000001', 0) $$,
  '42501', null,
  'el anónimo no puede insertar costos'
);

select throws_ok(
  $$ update public.products set precio = 1 where id = '00000000-0000-4000-8000-000000000001' $$,
  '42501', null,
  'el anónimo no puede cambiar precios'
);

select throws_ok(
  $$ delete from public.products where id = '00000000-0000-4000-8000-000000000001' $$,
  '42501', null,
  'el anónimo no puede borrar productos'
);

select throws_ok(
  $$ insert into public.tags (nombre) values ('trucha') $$,
  '42501', null,
  'el anónimo no puede crear etiquetas'
);

select * from finish();
rollback;
