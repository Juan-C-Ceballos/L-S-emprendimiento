# Etapa 0 · Fundación

> Leé antes `CLAUDE.md`. Este archivo alcanza para ejecutar la etapa.

## Objetivo
Dejar el proyecto compilando y probándose: scaffold de Vite + React + TypeScript estricto, Tailwind con los tokens del prototipo, shadcn/ui, React Router con todas las rutas como páginas vacías, Vitest + Testing Library, ESLint, la capa `src/services/` con el cliente de Supabase, y CI en GitHub Actions. Al terminar, la app arranca y muestra el header de L&S con las fuentes y colores reales.

## Rama
`feature/00-fundacion` (ya existe, creada desde `develop`).

## Dependencias
Ninguna. No necesita Supabase en marcha (el cliente se crea, pero ninguna pantalla consulta datos todavía).

## Pantallas del prototipo que implementa
Ninguna completa. Solo el **esqueleto visual**: `HeaderCliente` (logo "L&S" con el `&` en vino, ícono de carrito sin contador) en `/`, y páginas vacías con su título para el resto de las rutas. Referencia: `prototype/src/main.html`, clases `.hd`, `.mark`, `.ib`.

## Tareas
1. **Scaffold** en la raíz (la carpeta ya tiene archivos: no pisar `README.md`, `CLAUDE.md`, `PLAN.md`, `docs/`, `prototype/`, `.gitignore`, `.env.example`). Generá con `npm create vite@latest` en una carpeta temporal con la plantilla `react-ts` y copiá a la raíz: `package.json`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `src/main.tsx`, `src/vite-env.d.ts`. Borrá el contenido de ejemplo (`App.css`, logos, contador).
   - `package.json`: `"name": "ls-pedidos"`, `"private": true`, `"engines": { "node": ">=22" }`.
   - `index.html`: `lang="es"`, `<title>L&S · Accesorios</title>`, `<meta name="theme-color" content="#FBF4F1">`, y el `<link>` a Google Fonts (D-09): `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap` con los `preconnect`.
2. **TypeScript estricto**: en `tsconfig.app.json` sumá `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`, `"noFallthroughCasesInSwitch": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`, y el alias `"paths": { "@/*": ["./src/*"] }` (también en `tsconfig.json` para shadcn). En `vite.config.ts`, el alias `@` → `src`.
3. **Tailwind v4** con `@tailwindcss/vite`. En `src/index.css`: `@import "tailwindcss";` y un bloque `@theme` con los tokens de `docs/prototype-analysis.md` §3 (colores `--color-crema`, `--color-tinta`, `--color-vino`, etc.; `--font-display: "Bricolage Grotesque", Georgia, serif`; `--font-sans: "Hanken Grotesk", system-ui, sans-serif`; radios). Estilos base: `body` con fondo crema, color tinta, `font-size: 15px`, `line-height: 1.45`, `-webkit-font-smoothing: antialiased`; foco visible `outline: 2px solid var(--color-vino); outline-offset: 2px`.
4. **shadcn/ui**: `npx shadcn@latest init` (estilo por defecto, color base neutral, CSS variables). Mapeá las variables de shadcn (`--background`, `--foreground`, `--primary`, `--ring`, `--border`, `--destructive`…) a los tokens del prototipo, así los componentes salen con el look de L&S. Agregá solo `button`, `input`, `label` y `textarea`. Ajustá `button` con variantes que reflejen el prototipo: `default` (tinta, 52 px, pill), `ghost` (borde `borde-fuerte`), `wa` (verde), `danger` (borde peligro), `dangerSolid`, y el tamaño `sm` (44 px).
5. **React Router** (paquete `react-router`, modo librería con `createBrowserRouter`). En `src/router.tsx` definí todas las rutas de `docs/prototype-analysis.md` §2 con páginas placeholder en `src/pages/` (cada una muestra su título en `h1`):
   - Cliente (layout `LayoutCliente` con `HeaderCliente`): `/` `CatalogoPage`, `/producto/:id` `ProductoPage`, `/carrito` `CarritoPage`, `/confirmar` `ConfirmarPage`, `/pedido/confirmado` `PedidoConfirmadoPage`.
   - Panel: `/admin/ingresar` `IngresarPage`; `/admin` `ResumenPage`, `/admin/productos` `ProductosPage`, `/admin/productos/nuevo` y `/admin/productos/:id` `ProductoFormPage`, `/admin/pedidos` `PedidosPage`, `/admin/pedidos/:numero` `PedidoDetallePage`, `/admin/ajustes` `AjustesPage`. (La guardia y el layout del panel llegan en la etapa 2.)
   - `*` → `NoEncontradaPage` ("No encontramos esta página" + link al catálogo).
6. **Componentes base**: `src/components/HeaderCliente.tsx` (logo como link a `/`, botón de carrito con `aria-label="Carrito vacío"`), `src/components/Logo.tsx`, `src/components/Toast.tsx` + `ToastProvider` y hook `useToast()` (D-09; estilo `.toast` del prototipo, 2,8 s, `role="status"`).
7. **Capa de servicios**:
   - `src/lib/env.ts`: lee y valida con Zod `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WHATSAPP_NUMBER` (este último opcional hasta la etapa 5). Si faltan, error claro en consola y pantalla "Falta configurar el sitio" (no romper con pantalla blanca).
   - `src/lib/supabase.ts`: `createClient` tipado con `Database` de `src/types/database.ts`. Hasta la etapa 1 creá un `src/types/database.ts` mínimo (`export type Database = { public: { Tables: {}; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {} } }`) que la etapa 1 reemplaza con el generado.
   - `src/services/errores.ts`: clase `ErrorServicio extends Error` con `codigo: string` y `detalle?: unknown`; helper `desdeErrorSupabase(e)`.
   - `src/services/README.md` (corto): reglas de la capa (solo los servicios importan `@/lib/supabase`; cada servicio devuelve tipos de dominio).
   - Regla de ESLint que lo haga cumplir: `no-restricted-imports` que prohíba `@/lib/supabase` y `@supabase/supabase-js` fuera de `src/services/**` y `src/lib/supabase.ts`.
   - `src/lib/formato.ts`: `formatearPrecio(n)` → `$14.500`, `formatearNumeroPedido(n)` → `#0007`, `formatearFechaCorta(iso)` → `15 oct, 09:12`, `normalizarTexto(s)` (minúsculas, sin tildes, trim), `normalizarEtiqueta(s)`. Con pruebas.
   - `src/lib/useAsync.ts` (D-10).
8. **Vitest + Testing Library**: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`. Config en `vite.config.ts` (`test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', css: false }`). Pruebas mínimas: `formato.test.ts` y `router.test.tsx` (renderiza `/` y ve el logo; renderiza `/ruta-inexistente` y ve "No encontramos esta página").
9. **ESLint**: partir de la config de Vite (flat config, `typescript-eslint`, `react-hooks`, `react-refresh`); usar `tseslint.configs.strictTypeChecked` sobre `src/`. Ignorar `dist`, `prototype`, `src/components/ui` (código de shadcn) y `src/types/database.ts`.
10. **Scripts** en `package.json`:
    ```json
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc -b --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
    ```
    (Los `db:*` se agregan en la etapa 1.) Verificá que `typecheck` funcione con las referencias de proyecto de Vite; si `tsc -b --noEmit` da problemas, usá `tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit`.
11. **CI** `.github/workflows/ci.yml`:
    - `on: pull_request` (a `develop` y `main`) y `push` a `develop` y `main`.
    - Job `frontend` (nombre exacto, se usa en la protección de ramas): `ubuntu-latest`, `actions/checkout@v4`, `actions/setup-node@v4` con `node-version-file: .nvmrc` y `cache: npm`, `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Variables dummy para el build: `VITE_SUPABASE_URL: http://127.0.0.1:54321`, `VITE_SUPABASE_ANON_KEY: ci-dummy`.
    - `concurrency` por rama con `cancel-in-progress: true`.
12. `.vscode/extensions.json` opcional (ESLint, Tailwind). No es obligatorio.
13. Actualizá `PLAN.md` y abrí el PR.

## Archivos que se espera tocar
`package.json`, `package-lock.json`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `components.json`, `src/main.tsx`, `src/router.tsx`, `src/index.css`, `src/pages/*.tsx`, `src/components/{HeaderCliente,Logo,Toast,LayoutCliente}.tsx`, `src/components/ui/*`, `src/lib/{env,supabase,formato,useAsync,utils}.ts`, `src/services/{errores.ts,README.md}`, `src/types/database.ts`, `src/test/setup.ts`, `.github/workflows/ci.yml`, `PLAN.md`. Borrar los `.gitkeep` de las carpetas que dejen de estar vacías.

## Criterios de aceptación
- [ ] `npm ci && npm run lint && npm run typecheck && npm test && npm run build` pasa en limpio.
- [ ] `npm run dev` muestra en `/` el header con "L&S" en Bricolage Grotesque, el `&` en `#9A4E5E`, fondo `#FBF4F1`.
- [ ] Todas las rutas del §2 de `prototype-analysis.md` existen y muestran su título. Una ruta inexistente muestra la página 404.
- [ ] Sin `.env.local`, la app muestra "Falta configurar el sitio" en lugar de una pantalla en blanco.
- [ ] Importar `@/lib/supabase` desde `src/pages/` hace fallar `npm run lint`.
- [ ] `tsconfig.app.json` tiene `strict` y `noUncheckedIndexedAccess`.
- [ ] El workflow `ci.yml` existe con el job `frontend` y corre en el PR.

## Pruebas requeridas
- `src/lib/formato.test.ts`: precios (`0`, `14500`, `1234567`), número de pedido (`7` → `#0007`, `12345` → `#12345`), normalización (`"  Ároś "` → `"aros"`).
- `src/router.test.tsx`: `/` y 404.
- `src/components/Toast.test.tsx`: aparece y desaparece (timers falsos).

## Riesgos
- **Versiones**: shadcn y Tailwind v4 cambian seguido. Seguí la guía oficial de shadcn para Vite vigente; si `shadcn init` pide algo distinto a lo descripto, priorizá la guía y anotá la diferencia en `docs/decisions.md`.
- **Pisar archivos**: el scaffold en una carpeta no vacía puede sobrescribir `README.md` o `.gitignore`. Por eso se genera en una carpeta temporal y se copia.
- **Windows**: los scripts deben funcionar en PowerShell y en bash (no usar `rm -rf` ni `&&` dentro de scripts de npm que requieran bash; si hace falta, usar Node).

## Definición de terminado
Criterios de aceptación cumplidos, CI en verde en el PR `feature/00-fundacion` → `develop`, `PLAN.md` con la casilla de la etapa 0 marcada y una entrada en el registro de avance, PR mergeado con **squash** y `develop` en verde después del merge.
