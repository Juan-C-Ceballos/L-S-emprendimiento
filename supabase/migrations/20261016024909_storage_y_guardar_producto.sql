-- Etapa 3: bucket de imágenes de productos y RPC guardar_producto (D-05, D-15, D-16).
-- Inmutable una vez mergeada: para cambiar algo, migración nueva.

-- ---------------------------------------------------------------------------
-- Storage: bucket público "productos"
-- ---------------------------------------------------------------------------

-- Público (D-15): los archivos se sirven por URL sin política de lectura para anon.
-- Solo JPEG (el navegador comprime antes de subir) y hasta 2 MB por archivo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

-- Solo la administradora sube, reemplaza, borra y lista. La API de Storage necesita poder
-- leer la fila para borrar (delete … returning), por eso hay un select solo para ella.
-- No hay política para anon: no puede listar el bucket.
create policy productos_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'productos' and (select public.es_admin()));

create policy productos_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'productos' and (select public.es_admin()));

create policy productos_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'productos' and (select public.es_admin()))
  with check (bucket_id = 'productos' and (select public.es_admin()));

create policy productos_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'productos' and (select public.es_admin()));

-- ---------------------------------------------------------------------------
-- guardar_producto
-- ---------------------------------------------------------------------------

-- Crea o edita un producto con su costo, etiquetas e imágenes en una sola transacción (D-16).
-- security invoker: corre con los permisos y el RLS de quien llama; además exige es_admin().
-- Entrada: {"id", "nombre", "descripcion", "precio", "costo", "stock", "activo",
--           "etiquetas": ["…"], "imagenes": [{"path", "path_miniatura"}]} (orden = posición).
-- Devuelve {"id", "paths_quitados": [...]}: detalle y miniatura de las imágenes que se sacaron,
-- para que el navegador las borre de Storage. Nunca borra productos.
create function public.guardar_producto(p jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_nombre text;
  v_descripcion text;
  v_precio integer;
  v_costo integer;
  v_stock integer;
  v_etiquetas text[];
  v_imagenes jsonb;
  v_imagen jsonb;
  v_quitados jsonb;
begin
  if not public.es_admin() then
    raise exception 'no_autorizado' using errcode = '42501';
  end if;

  -- 1. Validar la entrada.
  if p is null or jsonb_typeof(p) is distinct from 'object' then
    raise exception 'datos_invalidos: producto' using errcode = '22023';
  end if;

  if jsonb_typeof(p -> 'id') is distinct from 'string'
    or (p ->> 'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then
    raise exception 'datos_invalidos: id' using errcode = '22023';
  end if;
  v_id := (p ->> 'id')::uuid;

  v_nombre := btrim(coalesce(p ->> 'nombre', ''));
  if char_length(v_nombre) not between 1 and 120 then
    raise exception 'datos_invalidos: nombre' using errcode = '22023';
  end if;

  v_descripcion := btrim(coalesce(p ->> 'descripcion', ''));

  if jsonb_typeof(p -> 'precio') is distinct from 'number' or (p ->> 'precio') !~ '^[0-9]{1,9}$' then
    raise exception 'datos_invalidos: precio' using errcode = '22023';
  end if;
  if jsonb_typeof(p -> 'costo') is distinct from 'number' or (p ->> 'costo') !~ '^[0-9]{1,9}$' then
    raise exception 'datos_invalidos: costo' using errcode = '22023';
  end if;
  if jsonb_typeof(p -> 'stock') is distinct from 'number' or (p ->> 'stock') !~ '^[0-9]{1,9}$' then
    raise exception 'datos_invalidos: stock' using errcode = '22023';
  end if;
  v_precio := (p ->> 'precio')::integer;
  v_costo := (p ->> 'costo')::integer;
  v_stock := (p ->> 'stock')::integer;

  if jsonb_typeof(p -> 'activo') is distinct from 'boolean' then
    raise exception 'datos_invalidos: activo' using errcode = '22023';
  end if;

  -- Etiquetas: minúsculas, sin espacios a los costados, espacios múltiples → uno, sin repetidas.
  if jsonb_typeof(coalesce(p -> 'etiquetas', '[]'::jsonb)) is distinct from 'array'
    or exists (
      select 1 from jsonb_array_elements(coalesce(p -> 'etiquetas', '[]'::jsonb)) as e
      where jsonb_typeof(e) is distinct from 'string'
    )
  then
    raise exception 'datos_invalidos: etiquetas' using errcode = '22023';
  end if;
  select coalesce(array_agg(distinct t), '{}')
    into v_etiquetas
    from (
      select lower(regexp_replace(btrim(e), '\s+', ' ', 'g')) as t
      from jsonb_array_elements_text(coalesce(p -> 'etiquetas', '[]'::jsonb)) as e
    ) as normalizadas
    where t <> '';
  if exists (select 1 from unnest(v_etiquetas) as t where char_length(t) > 40) then
    raise exception 'datos_invalidos: etiqueta muy larga' using errcode = '22023';
  end if;

  -- Imágenes: al menos una, cada una con path y path_miniatura, sin repetir.
  v_imagenes := p -> 'imagenes';
  if jsonb_typeof(v_imagenes) is distinct from 'array' or jsonb_array_length(v_imagenes) = 0 then
    raise exception 'sin_imagenes: el producto necesita al menos una imagen' using errcode = '22023';
  end if;
  for v_imagen in select e from jsonb_array_elements(v_imagenes) as e loop
    if jsonb_typeof(v_imagen -> 'path') is distinct from 'string'
      or jsonb_typeof(v_imagen -> 'path_miniatura') is distinct from 'string'
      or char_length(v_imagen ->> 'path') not between 1 and 300
      or char_length(v_imagen ->> 'path_miniatura') not between 1 and 300
    then
      raise exception 'datos_invalidos: imagen' using errcode = '22023';
    end if;
  end loop;
  if (select count(distinct e ->> 'path') from jsonb_array_elements(v_imagenes) as e)
     <> jsonb_array_length(v_imagenes)
  then
    raise exception 'datos_invalidos: imagen repetida' using errcode = '22023';
  end if;

  -- 2. Producto y costo.
  insert into public.products (id, nombre, descripcion, precio, stock, activo)
  values (v_id, v_nombre, v_descripcion, v_precio, v_stock, (p ->> 'activo')::boolean)
  on conflict (id) do update
    set nombre = excluded.nombre,
        descripcion = excluded.descripcion,
        precio = excluded.precio,
        stock = excluded.stock,
        activo = excluded.activo;

  insert into public.product_costs (product_id, costo)
  values (v_id, v_costo)
  on conflict (product_id) do update set costo = excluded.costo;

  -- 3. Etiquetas: crear las nuevas y reemplazar las del producto.
  insert into public.tags (nombre)
  select t from unnest(v_etiquetas) as t
  on conflict (nombre) do nothing;

  delete from public.product_tags pt
  where pt.product_id = v_id
    and pt.tag_id not in (select tg.id from public.tags tg where tg.nombre = any (v_etiquetas));

  insert into public.product_tags (product_id, tag_id)
  select v_id, tg.id from public.tags tg where tg.nombre = any (v_etiquetas)
  on conflict do nothing;

  -- 4. Imágenes: quitar las que ya no están, reordenar las que siguen y agregar las nuevas.
  select coalesce(jsonb_agg(x.ruta order by x.ruta), '[]'::jsonb)
    into v_quitados
    from (
      select unnest(array[pi.path, pi.path_miniatura]) as ruta
      from public.product_images pi
      where pi.product_id = v_id
        and pi.path not in (select e ->> 'path' from jsonb_array_elements(v_imagenes) as e)
    ) as x;

  delete from public.product_images pi
  where pi.product_id = v_id
    and pi.path not in (select e ->> 'path' from jsonb_array_elements(v_imagenes) as e);

  update public.product_images pi
  set orden = n.posicion - 1,
      path_miniatura = n.path_miniatura
  from (
    select e ->> 'path' as path, e ->> 'path_miniatura' as path_miniatura, posicion
    from jsonb_array_elements(v_imagenes) with ordinality as t (e, posicion)
  ) as n
  where pi.product_id = v_id and pi.path = n.path;

  insert into public.product_images (product_id, path, path_miniatura, orden)
  select v_id, n.path, n.path_miniatura, n.posicion - 1
  from (
    select e ->> 'path' as path, e ->> 'path_miniatura' as path_miniatura, posicion
    from jsonb_array_elements(v_imagenes) with ordinality as t (e, posicion)
  ) as n
  where not exists (
    select 1 from public.product_images pi where pi.product_id = v_id and pi.path = n.path
  );

  return jsonb_build_object('id', v_id, 'paths_quitados', v_quitados);
end;
$$;

comment on function public.guardar_producto(jsonb) is
  'Crea o edita producto, costo, etiquetas e imágenes en una transacción (D-16). Solo administradora.';

revoke execute on function public.guardar_producto(jsonb) from public, anon;
grant execute on function public.guardar_producto(jsonb) to authenticated;
