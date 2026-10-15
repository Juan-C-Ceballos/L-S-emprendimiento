-- Funciones de pedidos: crear_pedido, marcar_vendido y cancelar_pedido.
-- Cada una es un único bloque plpgsql = una transacción: ante un error no queda ningún cambio parcial.

-- ---------------------------------------------------------------------------
-- crear_pedido
-- ---------------------------------------------------------------------------

create function public.crear_pedido(
  p_items jsonb,
  p_cliente text,
  p_telefono text,
  p_total_esperado bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cliente text := btrim(coalesce(p_cliente, ''));
  v_telefono text := btrim(coalesce(p_telefono, ''));
  v_item jsonb;
  v_lineas jsonb;
  v_errores jsonb;
  v_total bigint;
  v_pedido public.orders;
begin
  -- 1. Validar la entrada.
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'datos_invalidos: el pedido no tiene productos' using errcode = '22023';
  end if;

  for v_item in select e from jsonb_array_elements(p_items) as e loop
    if jsonb_typeof(v_item) is distinct from 'object'
      or jsonb_typeof(v_item -> 'producto_id') is distinct from 'string'
      or (v_item ->> 'producto_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then
      raise exception 'datos_invalidos: producto_id inválido' using errcode = '22023';
    end if;

    if jsonb_typeof(v_item -> 'cantidad') is distinct from 'number'
      or (v_item ->> 'cantidad') !~ '^[0-9]{1,6}$'
      or (v_item ->> 'cantidad')::integer < 1
    then
      raise exception 'datos_invalidos: cantidad inválida' using errcode = '22023';
    end if;
  end loop;

  if char_length(v_cliente) not between 2 and 80 then
    raise exception 'datos_invalidos: nombre' using errcode = '22023';
  end if;

  if char_length(regexp_replace(v_telefono, '\D', '', 'g')) not between 8 and 15 then
    raise exception 'datos_invalidos: telefono' using errcode = '22023';
  end if;

  -- 2 y 3. Agrupar líneas repetidas y leer precios, stock y costos reales en una sola lectura.
  --        Todo lo que sigue usa v_lineas, así los chequeos y lo insertado ven los mismos datos.
  with pedidas as (
    select
      (e.valor ->> 'producto_id')::uuid as producto_id,
      sum((e.valor ->> 'cantidad')::integer) as cantidad,
      min(e.orden) as orden
    from jsonb_array_elements(p_items) with ordinality as e (valor, orden)
    group by 1
  )
  select jsonb_agg(
    jsonb_build_object(
      'producto_id', x.producto_id,
      'cantidad', x.cantidad,
      'existe', p.id is not null,
      'nombre', p.nombre,
      'activo', p.activo,
      'stock', p.stock,
      'precio', p.precio,
      'costo', coalesce(c.costo, 0)
    )
    order by x.orden
  )
  into v_lineas
  from pedidas x
  left join public.products p on p.id = x.producto_id
  left join public.product_costs c on c.product_id = x.producto_id;

  select coalesce(jsonb_agg(err order by ord), '[]'::jsonb)
  into v_errores
  from (
    select
      l.ord,
      case
        when not (l.v ->> 'existe')::boolean then
          jsonb_build_object('tipo', 'inexistente', 'producto_id', l.v -> 'producto_id')
        when not (l.v ->> 'activo')::boolean then
          jsonb_build_object('tipo', 'inactivo', 'producto_id', l.v -> 'producto_id',
            'nombre', l.v -> 'nombre')
        when (l.v ->> 'stock')::bigint < (l.v ->> 'cantidad')::bigint then
          jsonb_build_object('tipo', 'stock_insuficiente', 'producto_id', l.v -> 'producto_id',
            'nombre', l.v -> 'nombre', 'disponible', l.v -> 'stock', 'pedido', l.v -> 'cantidad')
      end as err
    from jsonb_array_elements(v_lineas) with ordinality as l (v, ord)
  ) s
  where err is not null;

  if jsonb_array_length(v_errores) > 0 then
    return jsonb_build_object('ok', false, 'errores', v_errores);
  end if;

  -- 4. Total con los precios de la base. p_total_esperado solo detecta cambios (D-24).
  select sum((l ->> 'precio')::bigint * (l ->> 'cantidad')::bigint)
  into v_total
  from jsonb_array_elements(v_lineas) as l;

  if p_total_esperado is not null and p_total_esperado <> v_total then
    return jsonb_build_object(
      'ok', false,
      'errores', jsonb_build_array(jsonb_build_object('tipo', 'precio_cambiado')),
      'precios', (
        select jsonb_agg(jsonb_build_object('producto_id', l -> 'producto_id', 'precio', l -> 'precio'))
        from jsonb_array_elements(v_lineas) as l
      ),
      'total_actual', v_total
    );
  end if;

  -- 5. Insertar pedido e ítems. El stock no se toca: se descuenta al marcar vendido.
  insert into public.orders (cliente, telefono, total)
  values (v_cliente, v_telefono, v_total)
  returning * into v_pedido;

  insert into public.order_items (order_id, product_id, cantidad, precio_unitario, costo_unitario)
  select
    v_pedido.id,
    (l ->> 'producto_id')::uuid,
    (l ->> 'cantidad')::integer,
    (l ->> 'precio')::integer,
    (l ->> 'costo')::integer
  from jsonb_array_elements(v_lineas) as l;

  -- 6. Respuesta sin costos.
  return jsonb_build_object(
    'ok', true,
    'pedido', jsonb_build_object(
      'id', v_pedido.id,
      'numero', v_pedido.numero,
      'total', v_pedido.total,
      'cliente', v_pedido.cliente,
      'items', (
        select jsonb_agg(
          jsonb_build_object(
            'producto_id', l.v -> 'producto_id',
            'nombre', l.v -> 'nombre',
            'cantidad', (l.v ->> 'cantidad')::integer,
            'precio_unitario', (l.v ->> 'precio')::integer,
            'subtotal', (l.v ->> 'precio')::bigint * (l.v ->> 'cantidad')::bigint
          )
          order by l.ord
        )
        from jsonb_array_elements(v_lineas) with ordinality as l (v, ord)
      )
    )
  );
end;
$$;

comment on function public.crear_pedido(jsonb, text, text, bigint) is
  'Crea un pedido pendiente con precios y costos reales de la base. El cliente solo manda producto y '
  'cantidad; p_total_esperado solo detecta cambios de precio (D-24). No toca el stock ni devuelve costos.';

-- ---------------------------------------------------------------------------
-- marcar_vendido
-- ---------------------------------------------------------------------------

create function public.marcar_vendido(p_pedido_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_estado text;
  v_faltantes jsonb;
  v_cambios jsonb;
begin
  if not public.es_admin() then
    raise exception 'no_autorizado' using errcode = '42501';
  end if;

  select o.estado into v_estado
  from public.orders o
  where o.id = p_pedido_id
  for update;

  if not found then
    raise exception 'pedido_inexistente' using errcode = 'P0002';
  end if;

  if v_estado <> 'pendiente' then
    raise exception 'estado_invalido' using errcode = 'P0001', detail = v_estado;
  end if;

  -- Bloquear los productos siempre en el mismo orden (por id) evita deadlocks.
  perform 1
  from public.products p
  where p.id in (select i.product_id from public.order_items i where i.order_id = p_pedido_id)
  order by p.id
  for update;

  select jsonb_agg(
    jsonb_build_object('producto_id', p.id, 'nombre', p.nombre,
      'disponible', p.stock, 'pedido', i.cantidad)
    order by p.nombre
  )
  into v_faltantes
  from public.order_items i
  join public.products p on p.id = i.product_id
  where i.order_id = p_pedido_id and p.stock < i.cantidad;

  if v_faltantes is not null then
    raise exception 'stock_insuficiente' using errcode = 'P0001', detail = v_faltantes::text;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object('producto_id', p.id, 'nombre', p.nombre,
      'desde', p.stock, 'hasta', p.stock - i.cantidad)
    order by p.nombre
  ), '[]'::jsonb)
  into v_cambios
  from public.order_items i
  join public.products p on p.id = i.product_id
  where i.order_id = p_pedido_id;

  update public.products p
  set stock = p.stock - i.cantidad
  from public.order_items i
  where i.order_id = p_pedido_id and p.id = i.product_id;

  update public.orders
  set estado = 'vendido', vendido_at = now()
  where id = p_pedido_id;

  return jsonb_build_object('ok', true, 'cambios', v_cambios);
end;
$$;

comment on function public.marcar_vendido(uuid) is
  'Solo administradora. Pasa un pedido pendiente a vendido y descuenta el stock, todo o nada.';

-- ---------------------------------------------------------------------------
-- cancelar_pedido
-- ---------------------------------------------------------------------------

create function public.cancelar_pedido(p_pedido_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_estado text;
  v_cambios jsonb := '[]'::jsonb;
begin
  if not public.es_admin() then
    raise exception 'no_autorizado' using errcode = '42501';
  end if;

  select o.estado into v_estado
  from public.orders o
  where o.id = p_pedido_id
  for update;

  if not found then
    raise exception 'pedido_inexistente' using errcode = 'P0002';
  end if;

  if v_estado = 'cancelado' then
    raise exception 'estado_invalido' using errcode = 'P0001', detail = v_estado;
  end if;

  if v_estado = 'vendido' then
    perform 1
    from public.products p
    where p.id in (select i.product_id from public.order_items i where i.order_id = p_pedido_id)
    order by p.id
    for update;

    select coalesce(jsonb_agg(
      jsonb_build_object('producto_id', p.id, 'nombre', p.nombre,
        'desde', p.stock, 'hasta', p.stock + i.cantidad)
      order by p.nombre
    ), '[]'::jsonb)
    into v_cambios
    from public.order_items i
    join public.products p on p.id = i.product_id
    where i.order_id = p_pedido_id;

    update public.products p
    set stock = p.stock + i.cantidad
    from public.order_items i
    where i.order_id = p_pedido_id and p.id = i.product_id;
  end if;

  -- Si estaba vendido, vendido_at se conserva como historial.
  update public.orders
  set estado = 'cancelado', cancelado_at = now()
  where id = p_pedido_id;

  return jsonb_build_object('ok', true, 'repuesto', v_estado = 'vendido', 'cambios', v_cambios);
end;
$$;

comment on function public.cancelar_pedido(uuid) is
  'Solo administradora. Cancela un pedido pendiente o vendido; si estaba vendido, repone el stock.';

-- ---------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------

revoke execute on function public.crear_pedido(jsonb, text, text, bigint) from public, anon, authenticated;
revoke execute on function public.marcar_vendido(uuid) from public, anon, authenticated;
revoke execute on function public.cancelar_pedido(uuid) from public, anon, authenticated;

grant execute on function public.crear_pedido(jsonb, text, text, bigint) to anon, authenticated;
grant execute on function public.marcar_vendido(uuid) to authenticated;
grant execute on function public.cancelar_pedido(uuid) to authenticated;
