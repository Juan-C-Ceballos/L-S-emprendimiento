# Etapa 3 · Panel de productos

> Leé antes `CLAUDE.md`. Este archivo alcanza para ejecutar la etapa.

## Objetivo
La administradora gestiona el catálogo desde el panel: lista con búsqueda y filtros, alta y edición de productos con precio, **costo** y margen, stock, etiquetas con autocompletado, imágenes comprimidas en el navegador (detalle 1600 px y miniatura 400 px, JPEG 0,85) con orden y portada, y activar/desactivar. Los productos nunca se borran.

## Rama
`feature/03-panel-productos` desde `develop`.

## Dependencias
- Etapa 1 (tablas, RLS, `es_admin()`, semillas con UUID fijos).
- Etapa 2 (sesión, `RutaProtegida`, `PanelLayout`).

## Pantallas del prototipo que implementa
Referencia: `prototype/src/main.html`, bloques `a.isProducts` y `a.isForm`; lógica en `saveProduct()`, `addImg()`, `moveImg()`, `coverImg()`, `addTag()`, y en `renderVals()` los bloques `pl` y `f`.
- **Productos** (`/admin/productos?filtro=todos|activos|inactivos|stock-bajo&q=`): buscador "Nombre o etiqueta" (con espera de 350 ms y "Buscando…"), chips Todos/Activos/Inactivos/Stock bajo con contador, contador "N productos [para «q»]", `FilaProducto` (miniatura 48 × 58, nombre, "precio · costo $X", etiquetas "aros · dorado" o "Sin etiquetas", pill de stock "Agotado"/"Quedan N"/"N en stock", pill "Inactivo" y fila atenuada si está inactivo), vacíos con los textos del prototipo, botón "Nuevo producto" (y "+" en el header).
- **Formulario** (`/admin/productos/nuevo`, `/admin/productos/:id`): secciones Nombre + Descripción; "Precio y stock" (Precio y Costo con `$` adentro del input, solo dígitos; hint "El costo solo se ve en el panel, nunca en el catálogo."; caja **Ganancia por unidad** con `{p}% del precio` en verde u "Ojo: el precio está por debajo del costo" en rojo, o "Completá precio y costo para calcularla"; Stock); "Imágenes" (grilla de 3, portada con borde y badge "Portada", flechas mover antes/después, quitar, tocar una imagen la hace portada con el toast "Listo, esa imagen es la nueva portada.", tarjeta punteada "Agregar imagen"); "Etiquetas" (chips seleccionadas con ×, input "Agregar etiqueta", sugerencias con contador de uso, chip punteada "Crear «x»", Enter agrega la exacta o la primera sugerencia); interruptor **Activo: visible en el catálogo** con su hint; barra inferior "Cancelar" + "Crear producto"/"Guardar cambios". Errores con los textos exactos del prototipo (ver `docs/prototype-analysis.md` §4).

## Tareas
1. **Migración `…_storage_y_guardar_producto.sql`**:
   - Bucket público `productos` (`insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('productos','productos', true, 2097152, '{image/jpeg}') on conflict do nothing`).
   - Políticas en `storage.objects` para `bucket_id = 'productos'`: `insert`, `update` y `delete` solo con `public.es_admin()`. Lectura: el bucket es público (D-15), no hace falta política de `select` para servir archivos; no agregues una que permita listar a `anon`.
   - **RPC `guardar_producto(p jsonb) returns jsonb`** (D-16), `security invoker`, `set search_path = ''`, `grant execute` solo a `authenticated`, primera línea `if not public.es_admin() then raise exception 'no_autorizado' using errcode = '42501'`. Entrada:
     ```json
     {"id": "uuid (generado en el navegador)", "nombre": "…", "descripcion": "…", "precio": 14500, "costo": 5200,
      "stock": 12, "activo": true, "etiquetas": ["aros", "dorado"],
      "imagenes": [{"path": "<id>/<img>.jpg", "path_miniatura": "<id>/<img>-min.jpg"}]}
     ```
     En una transacción: upsert de `products` (por `id`), upsert de `product_costs`, normalizar etiquetas (`lower(btrim())`, espacios múltiples → uno), crear las que no existan (`on conflict (nombre) do nothing`), reemplazar `product_tags` del producto, y sincronizar `product_images` (borrar las filas cuyo `path` ya no está, upsert del resto con `orden` = posición en el array). Validaciones: al menos una imagen; precio, costo y stock enteros ≥ 0. Devuelve `{"id": "…", "paths_quitados": ["…", "…"]}` (rutas de detalle y miniatura de las imágenes eliminadas, para borrarlas de Storage).
   - Pruebas pgTAP `07_storage_y_guardar_producto.test.sql`: anónimo y no admin no pueden ejecutar `guardar_producto` ni insertar en `storage.objects` del bucket; admin crea producto con costo, etiquetas nuevas y existentes e imágenes; editar reordena imágenes y devuelve `paths_quitados`; sin imágenes → error; nunca hace `delete` sobre `products`.
2. **`src/lib/imagenes.ts`** (compresión en el navegador, D-05):
   - `calcularDimensiones(ancho, alto, ladoMax)` pura (no agranda imágenes chicas).
   - `comprimirImagen(file): Promise<{ detalle: Blob; miniatura: Blob }>`: `createImageBitmap(file, { imageOrientation: 'from-image' })` (respeta la rotación EXIF de fotos de celular), canvas, `toBlob('image/jpeg', 0.85)`; detalle 1600 px de lado largo, miniatura 400 px. Si el navegador no puede decodificar (por ejemplo HEIC en escritorio), `ErrorServicio('formato', 'No pudimos leer esa foto. Probá con JPG o PNG, o sacala de nuevo desde el celular.')`. Aceptar `image/*` en el input (`<input type="file" accept="image/*" multiple>`; en celular ofrece cámara y galería).
3. **`src/services/imagenes.ts`**: `subirImagen(productoId, file)` → comprime y sube los dos archivos al bucket `productos` con las rutas `{productoId}/{uuid}.jpg` y `{productoId}/{uuid}-min.jpg` (el `path` guardado es la ruta dentro del bucket) (`contentType: 'image/jpeg'`, `upsert: false`), devuelve `{ path, pathMiniatura }`; `borrarArchivos(paths)`; `urlPublica(path)` (D-27: si empieza con `/seed/`, devolverlo tal cual).
4. **`src/services/productos.ts`** (parte admin): `listarProductosAdmin()` (productos + costo + etiquetas + portada, ordenados por nombre), `obtenerProductoAdmin(id)`, `guardarProducto(datos)` → RPC y luego `borrarArchivos(paths_quitados)` (si falla el borrado, no se rompe el guardado: se registra en consola). `src/services/etiquetas.ts`: `listarEtiquetasConUso()`.
5. **Funciones puras** en `src/lib/productos.ts` con pruebas: `filtrarProductosAdmin(lista, filtro, q)` y `contarPorFiltro` (stock bajo = activo y stock ≤ `STOCK_BAJO` de `src/lib/constantes.ts`, D-22; la búsqueda mira nombre y etiquetas sin tildes), `calcularMargen(precio, costo)`, `sugerirEtiquetas(todas, elegidas, q)`.
6. **Esquema Zod** del formulario en `src/lib/esquemas.ts`: nombre obligatorio, precio entero > 0 (D-06), costo entero ≥ 0 obligatorio, stock entero ≥ 0 obligatorio, al menos una imagen. Mensajes del prototipo.
7. **Páginas y componentes**: `ProductosPage`, `ProductoFormPage`, `FilaProducto`, `PillStock`, `MargenGanancia`, `EditorImagenes` (sube al elegir el archivo y muestra la miniatura cuando termina; durante la subida, una tarjeta con "Subiendo…" y el botón de guardar deshabilitado), `EditorEtiquetas`, `InterruptorActivo`, `BuscadorConEspera` (reutilizable para las etapas 4 y 6). Al crear: `id = crypto.randomUUID()` en el estado del formulario desde el principio. Al guardar: toast "Producto creado y visible en el catálogo." / "Producto creado (inactivo)." / "Cambios guardados." y volver a la lista (o al Resumen si se llegó desde ahí, `?desde=resumen`). "Cancelar" con imágenes nuevas ya subidas y sin guardar: borrarlas de Storage antes de salir.
8. Estado de filtro y búsqueda en la URL (`?filtro=&q=`), así el Resumen (etapa 7) puede linkear a `?filtro=stock-bajo`.

## Archivos que se espera tocar
`supabase/migrations/*_storage_y_guardar_producto.sql`, `supabase/tests/07_storage_y_guardar_producto.test.sql`, `src/types/database.ts` (regenerado), `src/types/dominio.ts`, `src/lib/{imagenes,productos,esquemas,constantes}.ts` (+ tests), `src/services/{productos,imagenes,etiquetas}.ts` (+ tests), `src/pages/{ProductosPage,ProductoFormPage}.tsx`, `src/components/panel/*`, `src/components/BuscadorConEspera.tsx`, `PLAN.md`.

## Criterios de aceptación
- [ ] Crear un producto con 2 fotos de celular: en Storage quedan 4 archivos JPEG (2 de ≤ 1600 px y 2 de ≤ 400 px de lado largo), ninguno es la original, cada detalle pesa típicamente 100–300 KB.
- [ ] La primera imagen es la portada; cambiar portada y orden se refleja al reabrir.
- [ ] Quitar una imagen y guardar borra la fila y los dos archivos.
- [ ] Etiquetas: autocompletado con conteo, crear una nueva con Enter o con "Crear «x»", normalizadas en minúsculas.
- [ ] Margen calculado en vivo, con estilo positivo/negativo.
- [ ] Desactivar un producto lo muestra atenuado con "Inactivo"; **no hay botón de borrar** en ningún lado.
- [ ] Filtros y búsqueda de la lista funcionan y quedan en la URL.
- [ ] Un usuario anónimo no puede subir a `productos` (pgTAP y prueba manual desde la consola).
- [ ] Lint, typecheck, tests, build y pgTAP en verde.

## Pruebas requeridas
- `src/lib/imagenes.test.ts`: `calcularDimensiones` (horizontal, vertical, cuadrada, más chica que el máximo).
- `src/lib/productos.test.ts`: filtros, contadores, margen, sugerencias.
- `src/services/productos.test.ts`: `guardarProducto` llama a la RPC con el payload esperado y luego borra `paths_quitados`; si la RPC falla, no borra nada.
- `src/pages/ProductoFormPage.test.tsx`: errores de validación con los textos del prototipo; interruptor activo.
- pgTAP `07_…`.

## Riesgos
- **Imágenes huérfanas** si el guardado falla después de subir (D-16): aceptado; se mitiga borrando al cancelar.
- **HEIC / fotos enormes**: `createImageBitmap` puede fallar o consumir mucha memoria en celulares viejos; procesar las fotos de a una.
- **`storage.buckets` en CI**: requiere el servicio de Storage levantado (el job `base-de-datos` usa `supabase start`, no solo `db start`).
- **Caché de imágenes**: los nombres son UUID nuevos en cada subida, así que no hay problemas de caché al reemplazar.

## Definición de terminado
Criterios cumplidos, PR con CI en verde, squash merge a `develop`, `develop` en verde, migración aplicada al proyecto de desarrollo si está vinculado, `PLAN.md` actualizado.
