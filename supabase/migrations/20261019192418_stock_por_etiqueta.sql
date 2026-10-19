-- Etapa 11: stock y ventas por etiqueta en el Resumen, con las etiquetas que sigue la administradora.
-- Una tabla aparte y no una columna de settings: settings es de lectura pública (D-43).

-- ---------------------------------------------------------------------------
-- etiquetas_seguidas
-- ---------------------------------------------------------------------------

create table public.etiquetas_seguidas (
  tag_id uuid primary key references public.tags (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.etiquetas_seguidas is
  'Etiquetas que la administradora sigue en el Resumen. Sin filas, el Resumen muestra todas.';

revoke all on public.etiquetas_seguidas from anon, authenticated;
grant select, insert, delete on public.etiquetas_seguidas to authenticated;

alter table public.etiquetas_seguidas enable row level security;

-- Solo la administradora. Ninguna política para anon.
create policy etiquetas_seguidas_select on public.etiquetas_seguidas
  for select to authenticated
  using ((select public.es_admin()));

create policy etiquetas_seguidas_insert on public.etiquetas_seguidas
  for insert to authenticated
  with check ((select public.es_admin()));

create policy etiquetas_seguidas_delete on public.etiquetas_seguidas
  for delete to authenticated
  using ((select public.es_admin()));

-- ---------------------------------------------------------------------------
-- resumen_etiquetas
-- ---------------------------------------------------------------------------

create function public.resumen_etiquetas(p_ahora timestamptz default null)
returns table (
  id uuid,
  nombre text,
  seguida boolean,
  productos integer,
  piezas integer,
  unidades integer,
  vendidas_mes integer,
  vendidas_total integer
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  -- Mismo mes calendario de Buenos Aires que resumen_panel (D-23).
  v_local timestamp := date_trunc('month', coalesce(p_ahora, now()) at time zone 'America/Argentina/Buenos_Aires');
  v_desde timestamptz := v_local at time zone 'America/Argentina/Buenos_Aires';
  v_hasta timestamptz := (v_local + interval '1 month') at time zone 'America/Argentina/Buenos_Aires';
begin
  if not public.es_admin() then
    raise exception 'no_autorizado' using errcode = '42501';
  end if;

  -- productos: todos los que la usan (para el selector). piezas y unidades: solo activos.
  -- Ventas: unidades de pedidos vendidos, con las etiquetas actuales del producto.
  return query
  with ventas as (
    select
      i.product_id,
      sum(i.cantidad) filter (where o.vendido_at >= v_desde and o.vendido_at < v_hasta) as mes,
      sum(i.cantidad) as total
    from public.order_items i
    join public.orders o on o.id = i.order_id
    where o.estado = 'vendido'
    group by i.product_id
  )
  select
    t.id,
    t.nombre,
    exists (select 1 from public.etiquetas_seguidas s where s.tag_id = t.id),
    count(p.id)::integer,
    (count(p.id) filter (where p.activo and p.stock > 0))::integer,
    coalesce(sum(p.stock) filter (where p.activo), 0)::integer,
    coalesce(sum(v.mes), 0)::integer,
    coalesce(sum(v.total), 0)::integer
  from public.tags t
  left join public.product_tags pt on pt.tag_id = t.id
  left join public.products p on p.id = pt.product_id
  left join ventas v on v.product_id = p.id
  group by t.id, t.nombre
  order by t.nombre;
end;
$$;

comment on function public.resumen_etiquetas(timestamptz) is
  'Solo administradora. Por etiqueta: productos, piezas y unidades en stock (activos) y unidades vendidas en el mes y en total.';

-- ---------------------------------------------------------------------------
-- guardar_etiquetas_seguidas
-- ---------------------------------------------------------------------------

create function public.guardar_etiquetas_seguidas(p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'no_autorizado' using errcode = '42501';
  end if;

  -- Reemplaza el conjunto entero; los ids que ya no existen se ignoran.
  delete from public.etiquetas_seguidas where tag_id is not null;

  insert into public.etiquetas_seguidas (tag_id)
  select t.id
  from public.tags t
  where t.id = any (coalesce(p_ids, '{}'))
  on conflict do nothing;
end;
$$;

comment on function public.guardar_etiquetas_seguidas(uuid[]) is
  'Solo administradora. Reemplaza las etiquetas que se siguen en el Resumen.';

-- ---------------------------------------------------------------------------
-- renombrar_etiqueta: al unir, la etiqueta que queda hereda "seguida"
-- ---------------------------------------------------------------------------

create or replace function public.renombrar_etiqueta(p_id uuid, p_nombre text)
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

    -- Si se seguía la que desaparece, se sigue la que queda.
    insert into public.etiquetas_seguidas (tag_id)
    select v_otra
    where exists (select 1 from public.etiquetas_seguidas s where s.tag_id = p_id)
    on conflict do nothing;

    delete from public.tags where id = p_id;
    return jsonb_build_object('resultado', 'unida', 'id', v_otra);
  end if;

  update public.tags set nombre = v_nombre where id = p_id;
  return jsonb_build_object('resultado', 'renombrada', 'id', p_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Permisos (create or replace conserva los de renombrar_etiqueta)
-- ---------------------------------------------------------------------------

revoke execute on function public.resumen_etiquetas(timestamptz) from public, anon, authenticated;
revoke execute on function public.guardar_etiquetas_seguidas(uuid[]) from public, anon, authenticated;

grant execute on function public.resumen_etiquetas(timestamptz) to authenticated;
grant execute on function public.guardar_etiquetas_seguidas(uuid[]) to authenticated;
