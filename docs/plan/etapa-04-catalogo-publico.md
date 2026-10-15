# Etapa 4 · Catálogo público

> Leé antes `CLAUDE.md`. Este archivo alcanza para ejecutar la etapa.

## Objetivo
Cualquier persona, sin cuenta, ve la vidriera con los productos activos, busca por nombre, filtra por etiquetas en modo **todas** (Y, por defecto) o **alguna** (O) con contadores, y comparte el filtro porque vive en la URL. Abre el detalle de un producto con galería de fotos, etiquetas y estado de stock. Los agotados se ven al final con el badge "Agotado". El link del catálogo tiene vista previa (título e imagen fija). El botón "Agregar al carrito" queda visible pero se conecta en la etapa 5.

## Rama
`feature/04-catalogo-publico` desde `develop`.

## Dependencias
- Etapa 1 (RLS de lectura anónima, semillas con imágenes en `public/seed/`).
- Etapa 3 recomendable (servicio de imágenes `urlPublica` y productos reales), pero no imprescindible: si se adelanta, crear `urlPublica` acá.

## Pantallas del prototipo que implementa
Referencia: `prototype/src/main.html`, bloques `c.isCatalog` y `c.isDetail`, CSS `.hero`, `.fl`, `.seg`, `.chips`, `.chip`, `.grid`, `.card`, `.badge`, `.empty`, `.gal`, `.dots`, `.db`, `.tagrow`, `.note`, `.desk .catb`, `.desk .detw`; lógica en `renderVals()` bloques `cat` y `d`.
- **Catálogo** `/`: hero ("Vidriera" / "Accesorios para usar todos los días."), panel de filtros (buscador por nombre con espera de 350 ms; fila "Etiquetas" + select "Que tenga todas / Que tenga alguna"; chips seleccionadas con ×; buscador de etiquetas "Buscar etiqueta: dorado, aros…" con Enter; chips disponibles con contador y atenuadas si cuentan 0; "No hay otras etiquetas que coincidan con «x»."; contador "N piezas en la vidriera" / "N de M piezas" / "Buscando…" + link "Limpiar filtros"), grilla 2 columnas (4 en `lg`, filtros en columna sticky de 288 px), tarjetas 4:5 con nombre y precio, agotados con imagen desaturada y badge. Vacío "No encontramos piezas" con la pista dinámica y botones "Que tenga alguna" (si modo todas y > 1 etiqueta) y "Limpiar filtros".
- **Detalle** `/producto/:id`: galería con scroll-snap horizontal, contador "1 / 3", puntos navegables, badge "Agotado"; etiquetas como botones (llevan a `/?tags=<etiqueta>`); nombre, precio, descripción; nota "Última unidad disponible" / "Últimas N unidades" (stock ≤ 3, color aviso) o "Esta pieza está agotada por ahora." (rojo); en escritorio, dos columnas (galería 1,15fr / info 1fr). Producto inexistente o inactivo → "Esta pieza ya no está disponible" + "Ver catálogo".
- La barra inferior de agregar al carrito y el stepper se maquetan, pero el botón queda **deshabilitado con el texto "Agregar al carrito"** hasta la etapa 5 (o se oculta; elegí lo más simple y anotalo en el PR).

## Tareas
1. **`src/services/productos.ts`** (parte pública):
   - `listarCatalogo(): Promise<ProductoCatalogo[]>`: una consulta con `select` anidado (`id, nombre, precio, stock, product_images(path_miniatura, orden), product_tags(tags(nombre))`) sobre productos activos; devuelve `{ id, nombre, precio, stock, agotado, portadaUrl, etiquetas[] }` con la portada = imagen de menor `orden`. RLS ya oculta inactivos, pero filtrar igual por `activo = true` (claridad).
   - `obtenerProductoPublico(id)`: producto + todas las imágenes (URL de detalle, ordenadas) + etiquetas. Si no existe o no es visible → `null`.
   - Nunca pedir columnas de costo (no existen en `products`; la prueba de RLS de la etapa 1 cubre `product_costs`).
2. **`src/lib/filtros.ts`** (D-11), funciones puras con pruebas:
   - `leerFiltrosDeURL(searchParams) → { q, etiquetas: string[], modo: 'todas' | 'alguna' }` (tolerante: etiquetas desconocidas se ignoran al aplicar, modo inválido → `todas`).
   - `escribirFiltrosEnURL(filtros) → URLSearchParams`: omite valores por defecto (`modo=todas`, `q` vacío, sin etiquetas), etiquetas separadas por coma y codificadas.
   - `aplicarFiltros(productos, filtros)`: búsqueda por nombre sin tildes; Y/O por etiquetas; **agotados al final** manteniendo el orden.
   - `contarEtiquetas(productos, filtros)`: reproduce la regla del prototipo: etiquetas usadas por algún activo y no seleccionadas; en modo `todas` con selección cuentan sobre el resultado actual, si no sobre los activos que pasan la búsqueda por nombre. Respeta el filtro del buscador de etiquetas.
   - `pistaVacio(filtros)`: el texto de `emptyHint` del prototipo.
3. **URL como fuente de verdad**: `useSearchParams` para `q`, `tags` y `modo`; el input de búsqueda tiene estado local y escribe en la URL después de 350 ms (`replace: true` para no llenar el historial al tipear; `push` al tocar chips o cambiar el modo).
4. **Componentes**: `Hero`, `FiltrosCatalogo`, `ChipEtiqueta`, `SelectorModo` (select nativo con estilo `.sel`), `GrillaProductos`, `TarjetaProducto`, `EstadoVacio`, `Galeria` (scroll-snap + `IntersectionObserver` o `scrollLeft` para el índice; puntos con `aria-label="Ver foto N de M"`), `EtiquetasProducto`, `NotaStock`, `SelectorCantidad` (se reutiliza en la etapa 5). Imágenes con `loading="lazy"` (excepto las 4 primeras de la grilla), `decoding="async"`, `width`/`height` o `aspect-ratio` para evitar saltos, `alt` = nombre del producto, fondo `img-fondo` mientras carga.
5. **Estados de carga y error**: esqueletos simples en la grilla; si falla la carga, "No pudimos cargar la vidriera." + "Reintentar".
6. **Vista previa del link** (D-21): en `index.html`, `og:title` "L&S · Accesorios", `og:description` "Cadenas, pulseras, collares, aros y anillos. Pedí por WhatsApp.", `og:image` `/og.jpg` (1200 × 630, generá una imagen simple con la marca y los colores del prototipo; puede ser un JPG exportado de un SVG hecho a mano), `og:type` website, `twitter:card` summary_large_image. Nota: `og:image` debería ser una URL absoluta; dejá la relativa y anotá en `PLAN.md` que la etapa 8 la completa con el dominio de producción (o agregá `VITE_SITE_URL` si preferís; anotalo en `docs/decisions.md`).
7. `<title>` por página: "L&S · Accesorios" en el catálogo; "{nombre} · L&S" en el detalle.

## Archivos que se espera tocar
`src/services/productos.ts` (+ test), `src/lib/filtros.ts` (+ test), `src/pages/{CatalogoPage,ProductoPage}.tsx` (+ tests), `src/components/catalogo/*`, `index.html`, `public/og.jpg`, `PLAN.md`.

## Criterios de aceptación
- [ ] El anónimo ve los 13 productos activos de las semillas; "Anillo piedra verde" (inactivo) no aparece ni abre por URL.
- [ ] "Aros gota martillada" (stock 0) aparece **al final**, desaturado y con "Agotado".
- [ ] `/?tags=aros,dorado` muestra solo los que tienen ambas; `/?tags=aros,dorado&modo=alguna`, los que tienen alguna. Recargar o pegar la URL en otra pestaña reproduce el filtro.
- [ ] Los contadores de las chips siguen la regla del prototipo y las chips en 0 se ven atenuadas.
- [ ] La búsqueda "perla" (o "PERLA", "pérla") encuentra "Aros perla mini".
- [ ] Vacío con la pista y los botones correctos.
- [ ] Detalle: galería con varias fotos navegable con dedo y con los puntos; nota de stock bajo en "Pulsera eslabón fino" (stock 2): "Últimas 2 unidades".
- [ ] Tocar una etiqueta del detalle lleva al catálogo filtrado por esa etiqueta.
- [ ] Diseño fiel al prototipo en 390 px y ≥ 1024 px.
- [ ] Al compartir la URL del sitio (probar con un validador de Open Graph cuando esté desplegado) se ve título e imagen.
- [ ] Lint, typecheck, tests, build en verde.

## Pruebas requeridas
- `src/lib/filtros.test.ts`: URL ida y vuelta, Y, O, búsqueda sin tildes, agotados al final, contadores en ambos modos, pista de vacío.
- `src/services/productos.test.ts`: mapeo de `listarCatalogo` (portada = menor orden, etiquetas planas, `agotado`).
- `src/pages/CatalogoPage.test.tsx`: con el servicio simulado, tocar una chip actualiza la URL y la grilla; cambiar el modo cambia resultados.

## Riesgos
- **Rendimiento con muchas fotos**: usar siempre la miniatura en la grilla y la de detalle solo en la galería.
- **Contadores confusos**: la regla del prototipo es sutil; cubrirla con pruebas antes de maquetar.
- **SPA y rastreadores**: la vista previa por producto no funciona (esperado, fuera del MVP; ver etapa 9).

## Definición de terminado
Criterios cumplidos, PR con CI en verde, squash merge a `develop`, `develop` en verde, `PLAN.md` actualizado.
