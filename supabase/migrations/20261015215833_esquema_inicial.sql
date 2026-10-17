-- Esquema inicial de L&S: tablas, índices, permisos y RLS.
-- Toda tabla nace con RLS y sus políticas en esta misma migración.
-- Inmutable una vez mergeada: para cambiar algo, migración nueva.

-- ---------------------------------------------------------------------------
-- Rol
-- ---------------------------------------------------------------------------

-- D-13: la administradora tiene app_metadata.role = 'admin' (solo se cambia con
-- service_role o por SQL, nunca desde el navegador).
create function public.es_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

comment on function public.es_admin() is
  'true si el JWT de quien consulta tiene app_metadata.role = admin (D-13).';

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger: actualiza updated_at en cada update.';

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  descripcion text not null default '',
  precio integer not null check (precio >= 0),
  stock integer not null default 0 check (stock >= 0),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is
  'Productos. Nunca se borran: se desactivan (activo = false). El costo vive en product_costs.';

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  path text not null,
  path_miniatura text not null,
  orden integer not null check (orden >= 0),
  created_at timestamptz not null default now()
);

comment on table public.product_images is
  'Imágenes de producto (D-05): path del detalle y de la miniatura. La portada es orden = 0.';

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique
    check (nombre = lower(btrim(nombre)) and char_length(nombre) between 1 and 40),
  created_at timestamptz not null default now()
);

comment on table public.tags is 'Etiquetas libres, en minúsculas y sin espacios a los costados.';

create table public.product_tags (
  product_id uuid not null references public.products (id),
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (product_id, tag_id)
);

comment on table public.product_tags is 'Relación muchos a muchos entre productos y etiquetas.';

create table public.product_costs (
  product_id uuid primary key references public.products (id),
  costo integer not null check (costo >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.product_costs is
  'Costo de cada producto. Solo la administradora puede leerlo o escribirlo.';

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity unique,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'vendido', 'cancelado')),
  cliente text not null check (char_length(btrim(cliente)) between 2 and 80),
  telefono text not null
    check (char_length(regexp_replace(telefono, '\D', '', 'g')) between 8 and 15),
  total bigint not null check (total >= 0),
  created_at timestamptz not null default now(),
  vendido_at timestamptz,
  cancelado_at timestamptz,
  constraint orders_estado_fechas_check check (
    (estado = 'pendiente' and vendido_at is null and cancelado_at is null)
    or (estado = 'vendido' and vendido_at is not null and cancelado_at is null)
    or (estado = 'cancelado' and cancelado_at is not null)
  )
);

comment on table public.orders is
  'Pedidos. Los crea crear_pedido; cambian de estado con marcar_vendido y cancelar_pedido (D-04).';

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario integer not null check (precio_unitario >= 0),
  costo_unitario integer not null check (costo_unitario >= 0),
  unique (order_id, product_id)
);

comment on table public.order_items is
  'Ítems del pedido con el precio y el costo vigentes al crearlo. costo_unitario: solo administradora.';

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger product_costs_set_updated_at
  before update on public.product_costs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------

create index products_activo_idx on public.products (activo);
create index product_images_product_id_orden_idx on public.product_images (product_id, orden);
create index product_tags_tag_id_idx on public.product_tags (tag_id);
create index orders_estado_created_at_idx on public.orders (estado, created_at desc);
create index orders_vendido_at_idx on public.orders (vendido_at) where estado = 'vendido';
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- Permisos (defensa en profundidad, además de RLS)
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.products, public.product_images, public.tags, public.product_tags
  to anon;

grant select, insert, update on
  public.products, public.product_images, public.tags, public.product_tags,
  public.product_costs, public.orders, public.order_items
  to authenticated;

-- Los productos nunca se borran: no hay delete sobre products para nadie.
grant delete on public.product_images, public.product_tags, public.tags to authenticated;

-- Funciones: nada se ejecuta sin un grant explícito.
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.es_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.tags enable row level security;
alter table public.product_tags enable row level security;
alter table public.product_costs enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- products: el cliente ve solo los activos; la administradora, todos.
create policy products_select on public.products
  for select to anon, authenticated
  using (activo or (select public.es_admin()));

create policy products_insert on public.products
  for insert to authenticated
  with check ((select public.es_admin()));

create policy products_update on public.products
  for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

-- product_images: legibles si el producto está activo (D-15).
create policy product_images_select on public.product_images
  for select to anon, authenticated
  using (
    (select public.es_admin())
    or exists (select 1 from public.products p where p.id = product_id and p.activo)
  );

create policy product_images_insert on public.product_images
  for insert to authenticated
  with check ((select public.es_admin()));

create policy product_images_update on public.product_images
  for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

create policy product_images_delete on public.product_images
  for delete to authenticated
  using ((select public.es_admin()));

-- tags: legibles por cualquiera (D-15).
create policy tags_select on public.tags
  for select to anon, authenticated
  using (true);

create policy tags_insert on public.tags
  for insert to authenticated
  with check ((select public.es_admin()));

create policy tags_update on public.tags
  for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

create policy tags_delete on public.tags
  for delete to authenticated
  using ((select public.es_admin()));

-- product_tags: como product_images, así no se deducen etiquetas de inactivos.
create policy product_tags_select on public.product_tags
  for select to anon, authenticated
  using (
    (select public.es_admin())
    or exists (select 1 from public.products p where p.id = product_id and p.activo)
  );

create policy product_tags_insert on public.product_tags
  for insert to authenticated
  with check ((select public.es_admin()));

create policy product_tags_update on public.product_tags
  for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

create policy product_tags_delete on public.product_tags
  for delete to authenticated
  using ((select public.es_admin()));

-- product_costs: solo la administradora. Ninguna política para anon.
create policy product_costs_select on public.product_costs
  for select to authenticated
  using ((select public.es_admin()));

create policy product_costs_insert on public.product_costs
  for insert to authenticated
  with check ((select public.es_admin()));

create policy product_costs_update on public.product_costs
  for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

-- orders y order_items: solo la administradora lee y actualiza.
-- Sin política de insert: los inserta crear_pedido (security definer).
create policy orders_select on public.orders
  for select to authenticated
  using ((select public.es_admin()));

create policy orders_update on public.orders
  for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

create policy order_items_select on public.order_items
  for select to authenticated
  using ((select public.es_admin()));

create policy order_items_update on public.order_items
  for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));
