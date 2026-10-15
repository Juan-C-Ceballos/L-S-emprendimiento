-- Lectura como cliente anónimo: solo productos activos, sus imágenes y etiquetas. Nunca costos ni pedidos.
begin;
select plan(10);

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select is((select count(*) from public.products), 13::bigint, 'el anónimo ve los 13 productos activos');

select is(
  (select count(*) from public.products where id = '00000000-0000-4000-8000-000000000014'),
  0::bigint,
  'el anónimo no ve el producto inactivo'
);

select is(
  (select count(*) from public.product_images where product_id = '00000000-0000-4000-8000-000000000014'),
  0::bigint,
  'el anónimo no ve imágenes del producto inactivo'
);

select is((select count(*) from public.product_images), 30::bigint, 'el anónimo ve las 30 imágenes de productos activos');

select is(
  (select count(*) from public.product_tags where product_id = '00000000-0000-4000-8000-000000000014'),
  0::bigint,
  'el anónimo no ve las etiquetas del producto inactivo'
);

select is((select count(*) from public.tags), 10::bigint, 'el anónimo ve las 10 etiquetas');

select throws_ok(
  'select * from public.product_costs',
  '42501', null,
  'el anónimo no puede leer costos'
);

select throws_ok(
  'select * from public.orders',
  '42501', null,
  'el anónimo no puede leer pedidos'
);

select throws_ok(
  'select costo_unitario from public.order_items',
  '42501', null,
  'el anónimo no puede leer ítems de pedidos (ni costo_unitario)'
);

select is(
  (select count(*) from public.products where stock = 0),
  1::bigint,
  'el anónimo ve el producto agotado (se muestra como Agotado)'
);

select * from finish();
rollback;
