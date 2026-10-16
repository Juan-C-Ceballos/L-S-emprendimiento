-- Ajustes de WhatsApp (tabla settings): lectura pública, edición solo de la administradora.
begin;
select plan(13);

-- Como cliente anónimo
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select is((select count(*) from public.settings), 1::bigint, 'anon lee la única fila de ajustes');
select ok(
  (select strpos(whatsapp_mensaje, '{items}') > 0 from public.settings),
  'el mensaje por defecto incluye {items}'
);
select throws_ok(
  $$ update public.settings set whatsapp_numero = '5491112345678' $$,
  '42501', null,
  'anon no puede cambiar los ajustes'
);
select throws_ok(
  $$ insert into public.settings (id, whatsapp_mensaje) values (true, '{items}') $$,
  '42501', null,
  'anon no puede insertar ajustes'
);

-- Como usuario logueado que NO es admin: el update no falla, pero RLS no deja tocar la fila.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000b001","role":"authenticated","app_metadata":{}}';

update public.settings set whatsapp_numero = '5491112345678';
select is((select whatsapp_numero from public.settings), '', 'el no admin no cambia el número');

-- Como administradora
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-00000000a001","role":"authenticated","app_metadata":{"role":"admin"}}';

select lives_ok(
  $$ update public.settings set whatsapp_numero = '5491112345678', whatsapp_mensaje = 'Pedido {pedido}: {items}' $$,
  'la administradora cambia número y mensaje'
);
select is((select whatsapp_numero from public.settings), '5491112345678', 'el número quedó guardado');
select is((select whatsapp_mensaje from public.settings), 'Pedido {pedido}: {items}', 'el mensaje quedó guardado');
select lives_ok(
  $$ update public.settings set whatsapp_numero = '' $$,
  'el número puede quedar vacío (sin configurar)'
);

select throws_ok(
  $$ update public.settings set whatsapp_numero = '+54 9 11 1234-5678' $$,
  '23514', null,
  'el número se guarda solo con dígitos'
);
select throws_ok(
  $$ update public.settings set whatsapp_mensaje = 'Hola, quiero hacer un pedido' $$,
  '23514', null,
  'el mensaje tiene que incluir {items}'
);
select throws_ok(
  $$ update public.settings set id = false $$,
  '42501', null,
  'nadie cambia el id de la fila'
);
select throws_ok(
  $$ delete from public.settings $$,
  '42501', null,
  'ni la administradora borra la fila de ajustes'
);

select * from finish();
rollback;
