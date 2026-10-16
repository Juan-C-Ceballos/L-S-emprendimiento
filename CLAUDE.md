# CLAUDE.md · L&S

## Al empezar cualquier sesión
1. Leé `PLAN.md`: estado actual, etapa en curso y la nota "Dónde quedé" si existe.
2. Leé el archivo de la etapa en curso en `docs/plan/etapa-NN-*.md`. Es autocontenido: con este archivo y ese alcanza.
3. Verificá la rama: `git status` y `git branch --show-current`. Cada etapa tiene su rama `feature/NN-…` creada desde `develop`.
4. Consultá `docs/decisions.md` antes de decidir algo que pueda estar decidido.
5. **Todo el estado vive en el repositorio**, no en la conversación. Si te estás quedando sin contexto: parate en un punto estable, commiteá, y escribí en `PLAN.md` una nota "Dónde quedé y qué sigue" con precisión suficiente para retomar (archivo, función, próximo paso, comandos).

## Contexto
L&S es un emprendimiento que vende accesorios (cadenas, pulseras, collares, aros, anillos). El sistema es un catálogo público donde el cliente anónimo arma un pedido que se guarda en la base y se envía por WhatsApp, y un panel privado para **una única administradora** (productos, imágenes, etiquetas, stock, costos y pedidos). Sin pagos online. **Todo el texto de la interfaz va en español rioplatense** (vos, "tocá", "mirá").

Fuentes de verdad: `docs/ls-mvp.html` (funcional) y `prototype/` (visual: pantallas, textos, tokens). Si se contradicen, manda el documento en lo funcional y el prototipo en lo visual. Cada contradicción va a `docs/decisions.md`; no se resuelve en silencio. El mapa de pantallas, rutas, componentes y servicios está en `docs/prototype-analysis.md`.

## Decisiones cerradas (no se discuten)
- Frontend: React + Vite + TypeScript **estricto** (SPA), React Router, Tailwind + shadcn/ui, Zod para formularios.
- Backend: Supabase (Postgres, Auth, Storage, RLS). El navegador habla directo con Supabase con `supabase-js`.
- Hosting: Cloudflare, plan gratuito, sitio estático, subdominio gratuito de Cloudflare.
- Dos entornos: Supabase de desarrollo y de producción, sincronizados con migraciones del Supabase CLI.
- La lógica de negocio va en `src/services/` (productos, etiquetas, pedidos, auth, imágenes, resumen). **Las pantallas solo consumen servicios. Nada de consultas a Supabase dentro de componentes ni páginas.**
- Sin sobreingeniería: ninguna librería o capa que no esté listada sin justificarla en `docs/decisions.md`.
- Fuera del MVP: pagos online, cuentas de cliente, envíos, topes por pedido, captcha, límite por IP, vistas previas por producto, reportes. Se dejan previstos los puntos de extensión, pero no se implementan.

## Reglas no negociables
- **Roles**: cliente anónimo (solo lectura de productos activos con imágenes y etiquetas; puede llamar a `crear_pedido`) y una única administradora con login (`app_metadata.role = 'admin'`, ver `es_admin()`). Registro público desactivado.
- **RLS activado en TODAS las tablas** desde la primera migración. Toda tabla nueva nace con RLS y sus políticas en la misma migración.
- **Costos** solo en `product_costs`, accesible solo por la administradora. RLS filtra filas, no columnas: el cliente nunca puede leer costos (ni por `order_items.costo_unitario`).
- **El cliente nunca envía precios**: manda producto y cantidad. `crear_pedido` (SQL, `security definer`, `set search_path = ''`) busca precios y costos reales, valida producto activo y stock suficiente, calcula el total e inserta pedido e ítems guardando `precio_unitario` y `costo_unitario`.
- **Stock**: se descuenta al marcar vendido, no al crear. `marcar_vendido` y `cancelar_pedido` son funciones SQL atómicas. Cancelar un vendido repone stock. Un cancelado no vuelve a venderse.
- **Los productos nunca se borran**: se desactivan.
- **Etiquetas** libres, muchos a muchos (`product_tags`). Filtro del catálogo con modo `todas` (Y, por defecto) o `alguna` (O), estado en la URL: `/?q=&tags=a,b&modo=todas`.
- **El pedido se guarda en la base antes de abrir WhatsApp** (`wa.me` con mensaje prearmado y número de pedido). Número y plantilla del mensaje en la tabla `settings`, editables en Ajustes (D-34).
- **Fotos** achicadas en el navegador antes de subir: detalle 1600 px de lado largo, calidad 0,85; miniatura 400 px; JPEG. La original no se guarda.
- **Secretos**: la clave `service_role` jamás aparece en el frontend ni en el repositorio. Secretos en `.env.local` (ignorado) y en las variables del hosting. `.env.example` solo con nombres.
- Contra la pausa de Supabase gratis: Cron Trigger de Cloudflare con una consulta liviana todos los días (etapa 8, D-41).

## Convenciones de código
- TypeScript estricto: sin `any` (usá `unknown` y estrechá), sin `@ts-ignore`. Tipos de la base en `src/types/database.ts` (generados, no se editan a mano); tipos de dominio en `src/types/`.
- Estructura:
  - `src/pages/` pantallas (una por ruta, sufijo `Page`: `CatalogoPage.tsx`).
  - `src/components/` componentes reutilizables; `src/components/ui/` es de shadcn.
  - `src/services/` acceso a datos y reglas de negocio; cada función devuelve datos de dominio o lanza `ErrorServicio` con un `codigo` y un mensaje para mostrar.
  - `src/lib/` utilidades puras (formatos, filtros, whatsapp, imágenes, cliente de Supabase en `src/lib/supabase.ts`, que **solo** importan los servicios).
- Nombres de dominio en español (`producto`, `pedido`, `etiqueta`, `crearPedido`); términos técnicos en inglés cuando son estándar (`hook`, `props`).
- Formularios: estado controlado + esquema Zod en el mismo módulo o en `src/lib/esquemas.ts`. Mensajes de error copiados del prototipo.
- Estilos: utilidades de Tailwind con los tokens definidos en `src/index.css` (`@theme`). No hardcodear colores fuera de los tokens.
- Accesibilidad: objetivos táctiles ≥ 44 px, `aria-label` en botones de ícono, foco visible (`outline` bronce), textos de estado con `aria-live`.
- SQL: nombres en español y `snake_case`; funciones con `set search_path = ''` y nombres calificados (`public.products`); cada migración es inmutable una vez mergeada (para cambiar algo, migración nueva).
- Pruebas junto al código (`*.test.ts(x)`) para frontend; `supabase/tests/*.test.sql` para la base.

## Estrategia de ramas
- `main` = producción (solo merges desde `develop` por PR de release, **merge commit**).
- `develop` = integración (Supabase de desarrollo + vista previa de Cloudflare).
- `feature/NN-nombre-corto` desde `develop` (NN = etapa); `fix/nombre-corto` para arreglos. Entran a `develop` por PR con **squash merge**.
- **Nunca** push directo a `main` ni a `develop`.
- Conventional Commits: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`. Terminar los mensajes con la línea `Co-Authored-By` que indique la sesión.
- Antes de cada merge: (1) `git merge origin/develop` en la rama y resolver conflictos ahí; (2) `npm run lint && npm run typecheck && npm test && npm run build` (+ `npm run db:test` si se tocó la base); (3) CI en verde en el PR; (4) recién ahí mergear. Después del merge, verificar que `develop` siga en verde. Antes de `develop` → `main`, correr `docs/release-checklist.md`.
- Plantilla de PR: `.github/pull_request_template.md`.

## Comandos habituales
```bash
npm run dev          # servidor de desarrollo (http://localhost:5173)
npm run lint         # ESLint
npm run typecheck    # tsc sin emitir
npm test             # Vitest (una pasada)
npm run build        # compila a dist/
npm run db:start     # Supabase local (Docker)
npm run db:reset     # migraciones + seed en local
npm run db:test      # pruebas pgTAP
npm run db:types     # regenera src/types/database.ts
npx supabase migration new <nombre>
npx supabase db push --linked   # aplica migraciones al proyecto vinculado (dev o prod), solo según la etapa 8
```

## Al terminar una etapa
1. Criterios de aceptación y "definición de terminado" del archivo de la etapa cumplidos.
2. Verificaciones locales en verde.
3. Actualizar `PLAN.md`: casilla `[x]`, registro de avance (qué se terminó, rama, qué quedó pendiente), y "Estado actual" apuntando a la etapa siguiente.
4. Commit y PR contra `develop` con la plantilla completa. Si no hay remoto configurado, dejar la rama lista y anotarlo en `PLAN.md`.

## Qué no hacer
- No crear cuentas ni cargar credenciales en servicios externos: pedírselas al usuario con instrucciones precisas y seguir con lo que no dependa de eso.
- No frenar el trabajo por dudas menores: elegir lo más simple, anotarlo en `docs/decisions.md` y seguir.
- No empezar la etapa siguiente sin cerrar (o dejar nota de) la actual.
