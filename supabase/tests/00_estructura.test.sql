-- Estructura, RLS y permisos. Las consultas son genéricas para detectar también tablas y funciones futuras.
begin;
select plan(8);

select tables_are(
  'public',
  array['products', 'product_images', 'tags', 'product_tags', 'product_costs', 'orders', 'order_items', 'settings'],
  'existen las 8 tablas del MVP'
);

select is(
  (select count(*)
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity),
  0::bigint,
  'todas las tablas de public tienen RLS activado'
);

select is(
  (select count(*)
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.prosecdef
     and not exists (
       select 1 from unnest(coalesce(p.proconfig, '{}')) as cfg where cfg like 'search_path=%'
     )),
  0::bigint,
  'toda función security definer de public fija search_path'
);

select results_eq(
  $$ select p.proname::text collate "default"
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')
     order by 1 $$,
  $$ values ('crear_pedido'), ('es_admin') $$,
  'anon solo puede ejecutar crear_pedido y es_admin'
);

select results_eq(
  $$ select p.proname::text collate "default"
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'execute')
     order by 1 $$,
  $$ values ('cancelar_pedido'), ('crear_pedido'), ('es_admin'), ('guardar_producto'), ('marcar_vendido') $$,
  'authenticated solo ejecuta las funciones de la API'
);

select is(
  (select count(*)
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p')
     and has_table_privilege('anon', c.oid, 'insert, update, delete, truncate')),
  0::bigint,
  'anon no tiene permisos de escritura en ninguna tabla'
);

select ok(
  not has_table_privilege('anon', 'public.product_costs', 'select')
    and not has_table_privilege('anon', 'public.orders', 'select')
    and not has_table_privilege('anon', 'public.order_items', 'select'),
  'anon no tiene select sobre costos ni pedidos'
);

select ok(
  not has_table_privilege('anon', 'public.products', 'delete')
    and not has_table_privilege('authenticated', 'public.products', 'delete'),
  'nadie del navegador puede borrar productos'
);

select * from finish();
rollback;
