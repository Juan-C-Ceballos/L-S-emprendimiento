-- Bucket "productos" y RPC guardar_producto (etapa 3).
begin;
select plan(27);

-- Producto nuevo de prueba (id fijo) y una etiqueta existente de las semillas.
\set nuevo '''00000000-0000-4000-8000-0000000000e1'''

-- ---------------------------------------------------------------------------
-- Bucket
-- ---------------------------------------------------------------------------
select is(
  (select public from storage.buckets where id = 'productos'),
  true,
  'el bucket productos existe y es público'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'productos'),
  array['image/jpeg'],
  'el bucket solo acepta JPEG'
);

-- ---------------------------------------------------------------------------
-- Anónimo
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('productos', 'x/anon.jpg') $$,
  '42501', null,
  'anon no puede subir al bucket'
);
select is((select count(*) from storage.objects where bucket_id = 'productos'), 0::bigint,
  'anon no puede listar el bucket');
select throws_ok(
  format($$ select public.guardar_producto(%L::jsonb) $$, jsonb_build_object('id', :nuevo)),
  '42501', null,
  'anon no puede ejecutar guardar_producto'
);

-- ---------------------------------------------------------------------------
-- Usuario logueado que no es admin
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000b001","role":"authenticated","app_metadata":{}}';

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('productos', 'x/no-admin.jpg') $$,
  '42501', null,
  'el no admin no puede subir al bucket'
);
select throws_ok(
  $$ select public.guardar_producto('{}'::jsonb) $$,
  '42501', 'no_autorizado',
  'el no admin no puede guardar productos'
);

-- ---------------------------------------------------------------------------
-- Administradora
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated","app_metadata":{"role":"admin"}}';

select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('productos', 'x/admin.jpg') $$,
  'la administradora puede subir al bucket'
);
-- El borrado directo en storage.objects lo bloquea Supabase (se borra con la API de Storage,
-- que necesita ver la fila): se chequea que la administradora la ve y que existe la política.
select is(
  (select count(*) from storage.objects where bucket_id = 'productos' and name = 'x/admin.jpg'),
  1::bigint,
  'la administradora ve lo que subió (lo necesita la API para borrar)'
);

create temp table productos_antes as select count(*) as n from public.products;

-- Crear: costo, una etiqueta existente ("aros", con mayúsculas y espacios) y una nueva.
select is(
  public.guardar_producto(jsonb_build_object(
    'id', :nuevo, 'nombre', '  Aros prueba  ', 'descripcion', 'De prueba', 'precio', 12000,
    'costo', 4000, 'stock', 5, 'activo', true,
    'etiquetas', jsonb_build_array('  AROS ', 'edición   limitada', 'aros'),
    'imagenes', jsonb_build_array(
      jsonb_build_object('path', 'e1/a.jpg', 'path_miniatura', 'e1/a-min.jpg'),
      jsonb_build_object('path', 'e1/b.jpg', 'path_miniatura', 'e1/b-min.jpg'),
      jsonb_build_object('path', 'e1/c.jpg', 'path_miniatura', 'e1/c-min.jpg')
    )
  )),
  jsonb_build_object('id', :nuevo, 'paths_quitados', '[]'::jsonb),
  'crear devuelve el id y nada para borrar'
);
select is((select nombre from public.products where id = :nuevo), 'Aros prueba', 'el nombre queda sin espacios');
select is((select costo from public.product_costs where product_id = :nuevo), 4000, 'el costo quedó guardado');
select is(
  (select array_agg(t.nombre order by t.nombre) from public.product_tags pt
   join public.tags t on t.id = pt.tag_id where pt.product_id = :nuevo),
  array['aros', 'edición limitada'],
  'etiquetas normalizadas, sin repetir'
);
select is((select count(*) from public.tags where nombre = 'aros'), 1::bigint, 'no duplica la etiqueta existente');
select is(
  (select array_agg(path order by orden) from public.product_images where product_id = :nuevo),
  array['e1/a.jpg', 'e1/b.jpg', 'e1/c.jpg'],
  'las imágenes quedan en orden; la primera es la portada'
);

-- Editar: c pasa a portada, se quita b, entra d, se cambia una etiqueta.
select is(
  public.guardar_producto(jsonb_build_object(
    'id', :nuevo, 'nombre', 'Aros prueba', 'descripcion', '', 'precio', 13000,
    'costo', 4500, 'stock', 0, 'activo', false,
    'etiquetas', jsonb_build_array('aros', 'plateado'),
    'imagenes', jsonb_build_array(
      jsonb_build_object('path', 'e1/c.jpg', 'path_miniatura', 'e1/c-min.jpg'),
      jsonb_build_object('path', 'e1/a.jpg', 'path_miniatura', 'e1/a-min.jpg'),
      jsonb_build_object('path', 'e1/d.jpg', 'path_miniatura', 'e1/d-min.jpg')
    )
  )) -> 'paths_quitados',
  '["e1/b-min.jpg", "e1/b.jpg"]'::jsonb,
  'editar devuelve detalle y miniatura de la imagen quitada'
);
select is(
  (select array_agg(path order by orden) from public.product_images where product_id = :nuevo),
  array['e1/c.jpg', 'e1/a.jpg', 'e1/d.jpg'],
  'el nuevo orden queda guardado'
);
select is(
  (select array_agg(orden order by orden) from public.product_images where product_id = :nuevo),
  array[0, 1, 2],
  'los órdenes son 0, 1, 2'
);
select is(
  (select array_agg(t.nombre order by t.nombre) from public.product_tags pt
   join public.tags t on t.id = pt.tag_id where pt.product_id = :nuevo),
  array['aros', 'plateado'],
  'las etiquetas del producto se reemplazan'
);
select is(
  (select row(precio, stock, activo)::text from public.products where id = :nuevo),
  '(13000,0,f)',
  'precio, stock y activo actualizados'
);
select is((select costo from public.product_costs where product_id = :nuevo), 4500, 'el costo se actualiza');

-- Validaciones
select throws_ok(
  format($$ select public.guardar_producto(%L::jsonb) $$, jsonb_build_object(
    'id', :nuevo, 'nombre', 'Sin fotos', 'precio', 1, 'costo', 0, 'stock', 0, 'activo', true,
    'etiquetas', '[]'::jsonb, 'imagenes', '[]'::jsonb)),
  '22023', null,
  'sin imágenes no se guarda'
);
select throws_ok(
  format($$ select public.guardar_producto(%L::jsonb) $$, jsonb_build_object(
    'id', :nuevo, 'nombre', 'Negativo', 'precio', -1, 'costo', 0, 'stock', 0, 'activo', true,
    'etiquetas', '[]'::jsonb,
    'imagenes', jsonb_build_array(jsonb_build_object('path', 'e1/a.jpg', 'path_miniatura', 'e1/a-min.jpg')))),
  '22023', null,
  'precio negativo no se guarda'
);
select throws_ok(
  format($$ select public.guardar_producto(%L::jsonb) $$, jsonb_build_object(
    'id', :nuevo, 'nombre', '   ', 'precio', 1, 'costo', 0, 'stock', 0, 'activo', true,
    'etiquetas', '[]'::jsonb,
    'imagenes', jsonb_build_array(jsonb_build_object('path', 'e1/a.jpg', 'path_miniatura', 'e1/a-min.jpg')))),
  '22023', null,
  'nombre vacío no se guarda'
);

-- Nunca borra productos.
select is(
  (select count(*) from public.products),
  (select n + 1 from productos_antes),
  'solo se sumó el producto nuevo; no se borró ninguno'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
          and policyname = 'productos_admin_delete' and cmd = 'DELETE'),
  'existe la política de borrado del bucket solo para la administradora'
);
select ok(
  pg_get_functiondef('public.guardar_producto(jsonb)'::regprocedure) !~* 'delete\s+from\s+public\.products\M',
  'guardar_producto no tiene ningún delete sobre products'
);

select * from finish();
rollback;
