-- Semillas de DESARROLLO (producción arranca vacía). Salen de seed() en prototype/src/main.html.
-- UUID fijos para usarlos en las pruebas:
--   productos  00000000-0000-4000-8000-0000000000NN  (NN = id del prototipo)
--   etiquetas  00000000-0000-4000-a000-0000000000NN
--   pedidos    00000000-0000-4000-b000-0000000000NN  (NN = número del pedido)
-- Imágenes: SVG estáticos en public/seed/ (D-27), generados con scripts/generar-placeholders.mjs.

-- Fecha "hace N días a las HH:MM" en hora de Buenos Aires (nunca en el futuro).
create function pg_temp.hace(dias integer, hora time)
returns timestamptz
language sql
as $$
  select least(
    (((now() at time zone 'America/Argentina/Buenos_Aires')::date - dias) + hora)
      at time zone 'America/Argentina/Buenos_Aires',
    now()
  )
$$;

create function pg_temp.pid(n integer)
returns uuid
language sql
as $$ select ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $$;

insert into public.products (id, nombre, descripcion, precio, stock, activo) values
  (pg_temp.pid(1), 'Argollas clásicas doradas', 'Argollas de acero quirúrgico con baño dorado. Livianas y cómodas para usar todo el día. 2,5 cm de diámetro.', 14500, 12, true),
  (pg_temp.pid(2), 'Aros perla mini', 'Perlitas de 6 mm sobre poste plateado. Un clásico que va con todo.', 11900, 8, true),
  (pg_temp.pid(3), 'Aros gota martillada', 'Gotas con textura martillada y baño dorado. Livianos aunque se vean grandes.', 16800, 0, true),
  (pg_temp.pid(4), 'Abridores de acero', 'Argollitas mini de acero quirúrgico, ideales para orejas sensibles o segundo agujero.', 8900, 6, true),
  (pg_temp.pid(5), 'Pulsera eslabón fino', 'Cadena de eslabón fino con baño dorado y cierre mosquetón. Ajustable de 16 a 19 cm.', 18900, 2, true),
  (pg_temp.pid(6), 'Esclava rígida plateada', 'Esclava abierta, se ajusta apretándola suave. Queda linda sola o en capas.', 21500, 5, true),
  (pg_temp.pid(7), 'Pulsera de dijes', 'Cadena de acero con tres dijes chiquitos: luna, estrella y corazón.', 15700, 9, true),
  (pg_temp.pid(8), 'Collar corazón', 'Dije de corazón liso en cadena fina plateada de 45 cm.', 19800, 7, true),
  (pg_temp.pid(9), 'Collar inicial', 'Dije con la letra que elijas sobre cadena dorada de 42 cm. Avisanos la inicial por WhatsApp.', 22400, 10, true),
  (pg_temp.pid(10), 'Collar de perlas corto', 'Perlas de río irregulares con cierre dorado. Largo gargantilla, 38 cm.', 26900, 4, true),
  (pg_temp.pid(11), 'Cadena veneciana 50 cm', 'Cadena veneciana de acero, firme y brillante. Sirve para colgar cualquier dije.', 17600, 15, true),
  (pg_temp.pid(12), 'Cadena barbada 45 cm', 'Barbada de 4 mm con baño dorado. Presencia sin ser pesada.', 24900, 6, true),
  (pg_temp.pid(13), 'Anillo sello', 'Sello liso de acero dorado. Talles 14 a 18.', 13400, 11, true),
  (pg_temp.pid(14), 'Anillo piedra verde', 'Anillo fino con piedra verde facetada. Sin reposición por ahora.', 15900, 5, false);

insert into public.product_costs (product_id, costo) values
  (pg_temp.pid(1), 5200),
  (pg_temp.pid(2), 4100),
  (pg_temp.pid(3), 6000),
  (pg_temp.pid(4), 2900),
  (pg_temp.pid(5), 7100),
  (pg_temp.pid(6), 8400),
  (pg_temp.pid(7), 5900),
  (pg_temp.pid(8), 7000),
  (pg_temp.pid(9), 8800),
  (pg_temp.pid(10), 10500),
  (pg_temp.pid(11), 6300),
  (pg_temp.pid(12), 9700),
  (pg_temp.pid(13), 4800),
  (pg_temp.pid(14), 5600);

insert into public.tags (id, nombre) values
  ('00000000-0000-4000-a000-000000000001', 'aros'),
  ('00000000-0000-4000-a000-000000000002', 'pulseras'),
  ('00000000-0000-4000-a000-000000000003', 'collares'),
  ('00000000-0000-4000-a000-000000000004', 'cadenas'),
  ('00000000-0000-4000-a000-000000000005', 'anillos'),
  ('00000000-0000-4000-a000-000000000006', 'dorado'),
  ('00000000-0000-4000-a000-000000000007', 'plateado'),
  ('00000000-0000-4000-a000-000000000008', 'acero'),
  ('00000000-0000-4000-a000-000000000009', 'perlas'),
  ('00000000-0000-4000-a000-000000000010', 'dijes');

insert into public.product_tags (product_id, tag_id)
select pg_temp.pid(x.producto), t.id
from (values
  (1, array['aros', 'dorado', 'acero']),
  (2, array['aros', 'plateado', 'perlas']),
  (3, array['aros', 'dorado']),
  (4, array['aros', 'acero']),
  (5, array['pulseras', 'dorado', 'acero']),
  (6, array['pulseras', 'plateado']),
  (7, array['pulseras', 'acero', 'dijes']),
  (8, array['collares', 'plateado', 'dijes']),
  (9, array['collares', 'dorado', 'dijes']),
  (10, array['collares', 'perlas', 'dorado']),
  (11, array['cadenas', 'plateado', 'acero']),
  (12, array['cadenas', 'dorado', 'acero']),
  (13, array['anillos', 'dorado', 'acero']),
  (14, array['anillos', 'dorado'])
) as x (producto, etiquetas)
cross join lateral unnest(x.etiquetas) as e (nombre)
join public.tags t on t.nombre = e.nombre;

-- Cantidad de imágenes por producto (una por tono en seed()).
insert into public.product_images (product_id, path, path_miniatura, orden)
select
  pg_temp.pid(x.producto),
  format('/seed/p%s-%s.svg', lpad(x.producto::text, 2, '0'), i),
  format('/seed/p%s-%s.svg', lpad(x.producto::text, 2, '0'), i),
  i
from (values (1, 3), (2, 2), (3, 2), (4, 1), (5, 3), (6, 2), (7, 1),
             (8, 4), (9, 3), (10, 2), (11, 2), (12, 3), (13, 2), (14, 1)) as x (producto, imagenes)
cross join lateral generate_series(0, x.imagenes - 1) as i;

-- Pedidos en orden, así numero queda de 1 a 6. Precios y costos unitarios son los del pedido
-- (el #1 tiene 13.900 en "Argollas clásicas", distinto del precio actual, a propósito).
insert into public.orders (id, cliente, telefono, total, estado, created_at, vendido_at, cancelado_at) values
  ('00000000-0000-4000-b000-000000000001', 'Camila Ríos', '351 612-4488', 31500, 'vendido',
    pg_temp.hace(23, '15:20'), pg_temp.hace(22, '11:00'), null);
insert into public.orders (id, cliente, telefono, total, estado, created_at, vendido_at, cancelado_at) values
  ('00000000-0000-4000-b000-000000000002', 'Martina Gómez', '351 455-9012', 21500, 'cancelado',
    pg_temp.hace(13, '11:05'), null, pg_temp.hace(12, '10:00'));
insert into public.orders (id, cliente, telefono, total, estado, created_at, vendido_at, cancelado_at) values
  ('00000000-0000-4000-b000-000000000003', 'Sofía Herrera', '3543 41-2290', 43700, 'vendido',
    pg_temp.hace(10, '18:40'), pg_temp.hace(9, '10:30'), null);
insert into public.orders (id, cliente, telefono, total, estado, created_at, vendido_at, cancelado_at) values
  ('00000000-0000-4000-b000-000000000004', 'Valentina Paz', '351 790-3321', 38300, 'vendido',
    pg_temp.hace(4, '12:15'), pg_temp.hace(4, '17:45'), null);
insert into public.orders (id, cliente, telefono, total, estado, created_at, vendido_at, cancelado_at) values
  ('00000000-0000-4000-b000-000000000005', 'Lucía Benítez', '351 228-7710', 38700, 'pendiente',
    pg_temp.hace(1, '20:32'), null, null);
insert into public.orders (id, cliente, telefono, total, estado, created_at, vendido_at, cancelado_at) values
  ('00000000-0000-4000-b000-000000000006', 'Julieta Ortiz', '11 5932-0418', 29000, 'pendiente',
    pg_temp.hace(0, '09:12'), null, null);

insert into public.order_items (order_id, product_id, cantidad, precio_unitario, costo_unitario)
select ('00000000-0000-4000-b000-' || lpad(x.pedido::text, 12, '0'))::uuid, pg_temp.pid(x.producto),
  x.cantidad, x.precio, x.costo
from (values
  (1, 1, 1, 13900, 5000),
  (1, 11, 1, 17600, 6300),
  (2, 6, 1, 21500, 8400),
  (3, 9, 1, 19900, 8100),
  (3, 2, 2, 11900, 4100),
  (4, 12, 1, 24900, 9700),
  (4, 13, 1, 13400, 4800),
  (5, 5, 1, 18900, 7100),
  (5, 8, 1, 19800, 7000),
  (6, 1, 2, 14500, 5200)
) as x (pedido, producto, cantidad, precio, costo);
