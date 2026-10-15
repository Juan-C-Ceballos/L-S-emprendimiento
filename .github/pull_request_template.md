## Etapa

<!-- Ej.: Etapa 04 · Catálogo público (docs/plan/etapa-04-catalogo-publico.md). Para un fix: "fix" y el motivo. -->
Etapa NN · 

## Qué cambia

<!-- Resumen en 3 a 6 viñetas. Pantallas del prototipo que implementa, migraciones nuevas, servicios nuevos. -->
- 

## Cómo se probó

<!-- Comandos corridos y pasos manuales (dispositivo/ancho, usuario anónimo o administradora). -->
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run db:test` (si se tocó `supabase/`)
- Pasos manuales:

## Checklist de integración

- [ ] La rama sale de `develop` y tiene el nombre `feature/NN-…` o `fix/…`.
- [ ] Traje `develop` a la rama (`git merge origin/develop`) y resolví los conflictos acá.
- [ ] Lint, typecheck, tests y build en verde en local.
- [ ] CI en verde en este PR.
- [ ] Commits con Conventional Commits.
- [ ] `PLAN.md` actualizado (casilla, registro de avance, estado actual).
- [ ] Decisiones nuevas anotadas en `docs/decisions.md`.
- [ ] Si hay migraciones: son nuevas (no edité migraciones ya mergeadas) y regeneré `src/types/database.ts`.
- [ ] La app no queda rota al mergear (se puede usar lo que ya existía).
- [ ] Merge a `develop` con **squash** (o, si es release `develop` → `main`, con **merge commit** y `docs/release-checklist.md` completo).

## Checklist de seguridad

- [ ] **RLS**: toda tabla nueva tiene RLS activado y políticas en la misma migración, y hay pruebas pgTAP para anónimo y administradora.
- [ ] **Costos**: el cliente anónimo no puede leer `product_costs` ni `order_items.costo_unitario` (pruebas en verde).
- [ ] **Precios**: el cliente nunca envía precios; los calcula `crear_pedido`.
- [ ] **Funciones SQL**: las `security definer` tienen `set search_path = ''` y `execute` revocado a `public` y otorgado solo a quien corresponde.
- [ ] **Secretos**: no hay claves en el código ni en el diff; solo variables `VITE_` públicas; `service_role` no aparece.
- [ ] **Componentes**: ninguna página o componente consulta Supabase directo (todo pasa por `src/services/`).
- [ ] **Storage**: subir y borrar imágenes solo puede la administradora.
