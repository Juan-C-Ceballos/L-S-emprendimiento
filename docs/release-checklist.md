# Checklist de release (`develop` → `main`)

Correrlo **completo** sobre el deploy de vista previa de `develop` (que apunta al Supabase de desarrollo) antes de abrir el PR de release. Copiar la lista en la descripción del PR y tildarla.

> Primera versión creada en la preparación del repositorio. La etapa 8 la completa con las URL reales y los pasos de producción.

## Antes de empezar
- [ ] `develop` tiene el CI en verde en el último commit.
- [ ] Todas las migraciones nuevas desde la última release están en `supabase/migrations/` y pasaron `npm run db:test`.
- [ ] `PLAN.md` refleja lo que entra en esta release.

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
- [ ] `npx supabase db push` contra el proyecto de producción (ver runbook en el README) **antes** o junto con el deploy.
- [ ] El deploy de `main` terminó bien y el sitio de producción carga.
- [ ] Un pedido de prueba en producción y luego cancelarlo.
- [ ] El Cron Trigger anti-pausa figura con su última ejecución correcta.
