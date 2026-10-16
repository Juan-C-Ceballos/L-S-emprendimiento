-- Ajustes de la tienda editables desde el panel: número y mensaje de WhatsApp (D-34, reemplaza D-01).
-- Una sola fila (id = true). La tabla nace con RLS y sus políticas en esta misma migración.
-- Inmutable una vez mergeada: para cambiar algo, migración nueva.

create table public.settings (
  id boolean primary key default true check (id),
  -- Solo dígitos, con código de país (ej. 5491100000000). Vacío = todavía no configurado.
  whatsapp_numero text not null default ''
    check (whatsapp_numero ~ '^([0-9]{10,15})?$'),
  -- Plantilla del mensaje; {items} es obligatorio para que diga qué piezas se pidieron.
  whatsapp_mensaje text not null
    check (char_length(btrim(whatsapp_mensaje)) between 1 and 1000
           and strpos(whatsapp_mensaje, '{items}') > 0),
  updated_at timestamptz not null default now()
);

comment on table public.settings is
  'Ajustes de la tienda (una sola fila). Lectura pública: el número y el mensaje se usan para armar el link de WhatsApp. Solo la administradora edita.';

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

insert into public.settings (id, whatsapp_numero, whatsapp_mensaje) values (
  true,
  '',
  E'¡Hola! Te escribo por mi pedido {pedido} de L&S.\n\n{items}\n\nTotal: {total}\nNombre: {nombre}\n\n¡Gracias!'
);

-- Permisos: todos leen; solo se actualizan las dos columnas editables. Nadie inserta ni borra
-- (la fila la crea esta migración). Supabase da todos los permisos a las tablas nuevas por
-- defecto, así que primero se revocan.
revoke all on public.settings from anon, authenticated;
grant select on public.settings to anon, authenticated;
grant update (whatsapp_numero, whatsapp_mensaje) on public.settings to authenticated;

alter table public.settings enable row level security;

create policy settings_select on public.settings
  for select to anon, authenticated
  using (true);

create policy settings_update on public.settings
  for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));
