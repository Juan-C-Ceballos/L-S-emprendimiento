# `src/services/`

Capa de acceso a datos y reglas de negocio. Las pantallas solo hablan con esta capa.

- **Solo los servicios importan `@/lib/supabase`** (y `@supabase/supabase-js`). ESLint falla si una página o componente lo hace (`no-restricted-imports` en `eslint.config.js`).
- Cada función devuelve **tipos de dominio** (`src/types/`), nunca filas crudas de Supabase.
- Ante un error, lanza `ErrorServicio` (`errores.ts`) con un `codigo` estable y un mensaje en español rioplatense listo para mostrar. Para errores de supabase-js, usá `desdeErrorSupabase(e)`.
- El cliente nunca envía precios ni costos: los calcula la base (`crear_pedido`).
- Pruebas: junto al archivo (`productos.test.ts`), con `@/lib/supabase` simulado (`vi.mock`).
