-- Etapa 7: resumen del panel y gestión global de etiquetas (renombrar con unión).
-- Eliminar una etiqueta es un delete directo de public.tags (RLS solo admin): product_tags tiene
-- `on delete cascade`, así que se quita de los productos sin tocarlos.

-- ---------------------------------------------------------------------------
-- resumen_panel
-- ---------------------------------------------------------------------------

create function public.resumen_panel(p_ahora timestamptz default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  -- Mes calendario en hora de Buenos Aires (D-23). p_ahora existe para poder probar el cambio de mes.
  v_local timestamp := date_trunc('month', coalesce(p_ahora, now()) at time zone 'America/Argentina/Buenos_Aires');
  v_desde timestamptz := v_local at time zone 'America/Argentina/Buenos_Aires';
  v_hasta timestamptz := (v_local + interval '1 month') at time zone 'America/Argentina/Buenos_Aires';
  v_pendientes jsonb;
  v_stock jsonb;
  v_ventas jsonb;
begin
  if not public.es_admin() then
    raise exception 'no_autorizado' using errcode = '42501';
  end if;

  select jsonb_build_object('cantidad', count(*), 'monto', coalesce(sum(o.total), 0))
  into v_pendientes
  from public.orders o
  where o.estado = 'pendiente';

  -- Stock bajo: activos con 3 unidades o menos (D-22).
  select jsonb_build_object(
    'cantidad', count(*) filter (where p.stock <= 3),
    'agotados', count(*) filter (where p.stock <= 0)
  )
  into v_stock
  from public.products p
  where p.activo;

  -- Ventas: pedidos vendidos cuyo vendido_at cae en el mes (D-04). Ganancia con los valores guardados.
  select jsonb_build_object(
    'mes', to_char(v_local, 'YYYY-MM'),
    'cantidad', count(*),
    'total', coalesce(sum(o.total), 0),
    'ganancia', coalesce(sum((
      select sum(i.cantidad::bigint * (i.precio_unitario - i.costo_unitario))
      from public.order_items i
      where i.order_id = o.id
    )), 0)
  )
  into v_ventas
  from public.orders o
  where o.estado = 'vendido' and o.vendido_at >= v_desde and o.vendido_at < v_hasta;

  return jsonb_build_object('pendientes', v_pendientes, 'stock_bajo', v_stock, 'ventas_mes', v_ventas);
end;
$$;

comment on function public.resumen_panel(timestamptz) is
  'Solo administradora. Pendientes, stock bajo y ventas del mes en hora de Buenos Aires.';

-- ---------------------------------------------------------------------------
-- renombrar_etiqueta
-- ---------------------------------------------------------------------------

create function public.renombrar_etiqueta(p_id uuid, p_nombre text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  -- Misma normalización que guardar_producto: sin espacios a los costados, minúsculas, un espacio.
  v_nombre text := lower(regexp_replace(btrim(coalesce(p_nombre, '')), '\s+', ' ', 'g'));
  v_actual text;
  v_otra uuid;
begin
  if not public.es_admin() then
    raise exception 'no_autorizado' using errcode = '42501';
  end if;

  if char_length(v_nombre) not between 1 and 40 then
    raise exception 'datos_invalidos: nombre' using errcode = '22023';
  end if;

  select t.nombre into v_actual
  from public.tags t
  where t.id = p_id
  for update;

  if not found then
    raise exception 'etiqueta_inexistente' using errcode = 'P0002';
  end if;

  if v_actual = v_nombre then
    return jsonb_build_object('resultado', 'sin_cambios', 'id', p_id);
  end if;

  select t.id into v_otra
  from public.tags t
  where t.nombre = v_nombre
  for update;

  if v_otra is not null then
    -- Unir: los productos de p_id pasan a la otra sin duplicar, y p_id se borra (cascade).
    insert into public.product_tags (product_id, tag_id)
    select pt.product_id, v_otra
    from public.product_tags pt
    where pt.tag_id = p_id
    on conflict do nothing;

    delete from public.tags where id = p_id;
    return jsonb_build_object('resultado', 'unida', 'id', v_otra);
  end if;

  update public.tags set nombre = v_nombre where id = p_id;
  return jsonb_build_object('resultado', 'renombrada', 'id', p_id);
end;
$$;

comment on function public.renombrar_etiqueta(uuid, text) is
  'Solo administradora. Renombra una etiqueta; si el nombre ya existe, une las dos sin duplicar.';

-- ---------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------

revoke execute on function public.resumen_panel(timestamptz) from public, anon, authenticated;
revoke execute on function public.renombrar_etiqueta(uuid, text) from public, anon, authenticated;

grant execute on function public.resumen_panel(timestamptz) to authenticated;
grant execute on function public.renombrar_etiqueta(uuid, text) to authenticated;
