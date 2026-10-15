-- crear_pedido llamado como cliente anónimo. Cada llamada guarda su resultado en t.r para revisarlo
-- después como postgres (el anónimo no puede leer pedidos).
begin;
select plan(31);

create function pg_temp.r() returns jsonb language sql as $$ select current_setting('t.r')::jsonb $$;
create function pg_temp.pedidos() returns bigint language sql as $$ select count(*) from public.orders $$;

-- 1. Pedido válido. El cliente manda un "precio" trucho: se ignora.
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select set_config('t.r', public.crear_pedido(
  '[{"producto_id":"00000000-0000-4000-8000-000000000001","cantidad":2,"precio":1},
    {"producto_id":"00000000-0000-4000-8000-000000000011","cantidad":1}]',
  '  Ana Pérez  ', '351 555-1234'
)::text, true);
reset role;

select ok((pg_temp.r() ->> 'ok')::boolean, 'pedido válido: ok');
select is((pg_temp.r() -> 'pedido' ->> 'total')::bigint, 46600::bigint, 'total con los precios de la base (ignora el precio del cliente)');
-- Las secuencias no vuelven atrás con rollback: el número exacto depende de corridas anteriores (D-14).
select ok((pg_temp.r() -> 'pedido' ->> 'numero')::bigint > 6, 'el número sigue a las semillas');
select set_config('t.numero', pg_temp.r() -> 'pedido' ->> 'numero', true);
select is(pg_temp.r() -> 'pedido' ->> 'cliente', 'Ana Pérez', 'el nombre se guarda sin espacios a los costados');
select is(jsonb_array_length(pg_temp.r() -> 'pedido' -> 'items'), 2, 'devuelve los dos ítems');
select is(
  pg_temp.r() -> 'pedido' -> 'items' -> 0,
  '{"producto_id":"00000000-0000-4000-8000-000000000001","nombre":"Argollas clásicas doradas","cantidad":2,"precio_unitario":14500,"subtotal":29000}'::jsonb,
  'ítem con nombre, cantidad, precio y subtotal'
);
select ok(position('costo' in pg_temp.r()::text) = 0, 'la respuesta no contiene costos en ningún nivel');

select results_eq(
  format($$ select estado, total, vendido_at is null and cancelado_at is null
            from public.orders where id = %L $$, pg_temp.r() -> 'pedido' ->> 'id'),
  $$ values ('pendiente'::text, 46600::bigint, true) $$,
  'el pedido queda pendiente con el total correcto'
);
select results_eq(
  format($$ select product_id, cantidad, precio_unitario, costo_unitario
            from public.order_items where order_id = %L order by precio_unitario $$, pg_temp.r() -> 'pedido' ->> 'id'),
  $$ values ('00000000-0000-4000-8000-000000000001'::uuid, 2, 14500, 5200),
            ('00000000-0000-4000-8000-000000000011'::uuid, 1, 17600, 6300) $$,
  'los ítems guardan precio y costo de la base'
);
select results_eq(
  $$ select stock from public.products
     where id in ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011') order by id $$,
  $$ values (12), (15) $$,
  'crear el pedido no toca el stock'
);

-- 2. Líneas repetidas del mismo producto se suman.
set local role anon;
select set_config('t.r', public.crear_pedido(
  '[{"producto_id":"00000000-0000-4000-8000-000000000004","cantidad":1},
    {"producto_id":"00000000-0000-4000-8000-000000000004","cantidad":2}]',
  'Bea', '11 5555-0000'
)::text, true);
reset role;

select is(jsonb_array_length(pg_temp.r() -> 'pedido' -> 'items'), 1, 'líneas repetidas: un solo ítem');
select is((pg_temp.r() -> 'pedido' -> 'items' -> 0 ->> 'cantidad')::integer, 3, 'líneas repetidas: cantidades sumadas');
select is((pg_temp.r() -> 'pedido' ->> 'numero')::bigint, current_setting('t.numero')::bigint + 1, 'el número es correlativo');
select is(pg_temp.pedidos(), 8::bigint, 'hay 8 pedidos');

-- 3. Errores de negocio: no se inserta nada.
set local role anon;
select set_config('t.r', public.crear_pedido(
  '[{"producto_id":"00000000-0000-4000-8000-000000000014","cantidad":1}]', 'Ana', '3515551234')::text, true);
reset role;
select is(pg_temp.r(), '{"ok":false,"errores":[{"tipo":"inactivo","producto_id":"00000000-0000-4000-8000-000000000014","nombre":"Anillo piedra verde"}]}'::jsonb,
  'producto inactivo → inactivo');

set local role anon;
select set_config('t.r', public.crear_pedido(
  '[{"producto_id":"00000000-0000-4000-8000-000000000005","cantidad":3}]', 'Ana', '3515551234')::text, true);
reset role;
select is(pg_temp.r() -> 'errores' -> 0,
  '{"tipo":"stock_insuficiente","producto_id":"00000000-0000-4000-8000-000000000005","nombre":"Pulsera eslabón fino","disponible":2,"pedido":3}'::jsonb,
  'cantidad mayor al stock → stock_insuficiente con disponible y pedido');

set local role anon;
select set_config('t.r', public.crear_pedido(
  '[{"producto_id":"00000000-0000-4000-8000-000000000003","cantidad":1}]', 'Ana', '3515551234')::text, true);
reset role;
select is(pg_temp.r() -> 'errores' -> 0 ->> 'tipo', 'stock_insuficiente', 'producto con stock 0 → stock_insuficiente');

set local role anon;
select set_config('t.r', public.crear_pedido(
  '[{"producto_id":"00000000-0000-4000-8000-000000000999","cantidad":1},
    {"producto_id":"00000000-0000-4000-8000-000000000014","cantidad":1}]', 'Ana', '3515551234')::text, true);
reset role;
select is(
  (select jsonb_agg(e ->> 'tipo') from jsonb_array_elements(pg_temp.r() -> 'errores') e),
  '["inexistente","inactivo"]'::jsonb,
  'junta todos los errores, en el orden del pedido'
);

set local role anon;
select set_config('t.r', public.crear_pedido(
  '[{"producto_id":"00000000-0000-4000-8000-000000000001","cantidad":1}]', 'Ana', '3515551234', 13900)::text, true);
reset role;
select is(pg_temp.r() -> 'errores', '[{"tipo":"precio_cambiado"}]'::jsonb, 'total esperado distinto → precio_cambiado');
select is((pg_temp.r() ->> 'total_actual')::bigint, 14500::bigint, 'precio_cambiado devuelve el total actual');
select is(pg_temp.r() -> 'precios',
  '[{"producto_id":"00000000-0000-4000-8000-000000000001","precio":14500}]'::jsonb,
  'precio_cambiado devuelve los precios actuales');

select is(pg_temp.pedidos(), 8::bigint, 'ningún error de negocio insertó pedidos');

set local role anon;
select set_config('t.r', public.crear_pedido(
  '[{"producto_id":"00000000-0000-4000-8000-000000000001","cantidad":1}]', 'Ana', '3515551234', 14500)::text, true);
reset role;
select ok((pg_temp.r() ->> 'ok')::boolean, 'total esperado igual → se crea el pedido');

-- 4. Datos inválidos → excepción 22023.
set local role anon;
select throws_ok(
  $$ select public.crear_pedido('[{"producto_id":"00000000-0000-4000-8000-000000000001","cantidad":1}]', 'A', '3515551234') $$,
  '22023', null, 'nombre de 1 letra → 22023');
select throws_ok(
  $$ select public.crear_pedido('[{"producto_id":"00000000-0000-4000-8000-000000000001","cantidad":1}]', 'Ana', '12345') $$,
  '22023', null, 'teléfono de 5 dígitos → 22023');
select throws_ok(
  $$ select public.crear_pedido('[]', 'Ana', '3515551234') $$,
  '22023', null, 'sin productos → 22023');
select throws_ok(
  $$ select public.crear_pedido('[{"producto_id":"00000000-0000-4000-8000-000000000001","cantidad":0}]', 'Ana', '3515551234') $$,
  '22023', null, 'cantidad 0 → 22023');
select throws_ok(
  $$ select public.crear_pedido('[{"producto_id":"00000000-0000-4000-8000-000000000001","cantidad":1.5}]', 'Ana', '3515551234') $$,
  '22023', null, 'cantidad no entera → 22023');
select throws_ok(
  $$ select public.crear_pedido('[{"producto_id":"no-es-uuid","cantidad":1}]', 'Ana', '3515551234') $$,
  '22023', null, 'producto_id inválido → 22023');
select throws_ok(
  $$ select public.crear_pedido('{"producto_id":"00000000-0000-4000-8000-000000000001"}', 'Ana', '3515551234') $$,
  '22023', null, 'items que no es un array → 22023');
reset role;

select is(pg_temp.pedidos(), 9::bigint, 'solo los pedidos válidos quedaron guardados');

select * from finish();
rollback;
