# Checklist de release (`develop` → `main`)

Correrlo **completo** sobre el deploy de vista previa de `develop` (que apunta al Supabase de desarrollo) antes de abrir el PR de release. Copiar la lista en la descripción del PR y tildarla.

> Vista previa: `https://develop.ls-accesorios.pages.dev` (Supabase `ls-dev`). Producción: `https://ls-accesorios.pages.dev` (Supabase `ls-prod`, ref `tcpbmenfkakzlhyidxli`). Runbook en el README.

## Antes de empezar
- [ ] `develop` tiene el CI en verde en el último commit.
- [ ] Todas las migraciones nuevas desde la última release están en `supabase/migrations/` y pasaron `npm run db:test`.
- [ ] `PLAN.md` refleja lo que entra en esta release.
- [ ] El último deploy de `develop` en Cloudflare Pages terminó bien.
- [ ] En la vista previa, la pestaña Red del navegador muestra pedidos a `nhsjichuumyflklqkhxw.supabase.co` (`ls-dev`), no a producción.
- [ ] Recargar directo en `/producto/<id>` y en `/admin/pedidos` no da 404.
- [ ] `grep -r service_role dist/` después de `npm run build` no encuentra nada.

## Humo · cliente anónimo (celular, ~390 px)
- [ ] El catálogo carga, muestra solo productos activos y los agotados al final con el badge "Agotado".
- [ ] Filtro por etiquetas en modo "todas" y "alguna"; los contadores cambian; la URL se actualiza; al recargar o compartir la URL se ve el mismo filtro.
- [ ] Búsqueda por nombre.
- [ ] Detalle: galería con varias fotos, etiquetas que llevan al catálogo filtrado, nota de stock bajo.
- [ ] Agregar al carrito respeta el stock; el contador del carrito se actualiza; el carrito sobrevive a recargar la página.
- [ ] Confirmar con nombre o teléfono inválidos muestra los errores del prototipo.
- [ ] Confirmar un pedido válido: aparece la pantalla de éxito con el número `#NNNN` y el botón de WhatsApp abre `wa.me` con el mensaje correcto y el número de la tienda.
- [ ] Con dos pestañas: bajar el stock desde el panel después de armar el carrito → al confirmar aparece el aviso de stock y no se guarda el pedido.

## Humo · seguridad (anónimo)
- [ ] Desde la consola del navegador con la clave anon: `select` a `product_costs`, `orders` y `order_items` devuelve vacío o error.
- [ ] Un producto inactivo no aparece ni se puede abrir por URL.
- [ ] `insert` directo en `orders` falla.
- [ ] Subir un archivo al bucket de imágenes sin sesión falla.

## Humo · administradora (celular y escritorio)
- [ ] Login correcto e incorrecto; cerrar sesión; `/admin` sin sesión redirige a `/admin/ingresar`.
- [ ] Crear producto con 2 fotos de celular (se achican: revisar en Storage que pesen ~100–200 KB y la miniatura ~400 px), etiquetas nuevas y existentes, costo; aparece en el catálogo.
- [ ] Editar: cambiar portada y orden, quitar una imagen, cambiar precio; desactivar y verificar que desaparece del catálogo.
- [ ] Pedido pendiente → marcar vendido: descuenta stock y muestra el delta. Cancelar un vendido: repone stock. Un cancelado no ofrece vender.
- [ ] Marcar vendido con stock insuficiente: botón deshabilitado y aviso.
- [ ] Resumen: pendientes, stock bajo y ventas del mes coinciden con los datos.
- [ ] Ajustes: crear, renombrar (y unir) y eliminar etiquetas.

## Producción (después del merge a `main`)
- [ ] Si la release trae migraciones: `npx supabase db push --db-url $env:DB_PROD --dry-run` y después sin `--dry-run` (README → "Aplicar migraciones a producción"), **antes** de probar el sitio.
- [ ] El deploy de `main` terminó bien y el sitio de producción carga.
- [ ] La pestaña Red muestra pedidos al Supabase de **producción** (`ls-prod`), no a `ls-dev`.
- [ ] Recargar directo en `/admin/pedidos` no da 404 y los headers de `_headers` están (por ejemplo `X-Frame-Options: DENY` en la respuesta del documento).
- [ ] `og:image` del HTML de producción es una URL absoluta (ver código fuente de la página).
- [ ] Un pedido de prueba en producción (nombre "Prueba release", teléfono ficticio) y luego cancelarlo desde el panel.
- [ ] El Worker `ls-keepalive` figura con su última ejecución correcta (*Trigger Events → View events*).
