# Configuración de GitHub

En la sesión de preparación **no había `gh` CLI instalado**, así que estos pasos quedan para hacer a mano (o con `gh` cuando esté instalado y autenticado). Una vez hechos, marcá las casillas y anotá la fecha.

## Estado verificado (2026-10-15, después de mergear la etapa 1, con la API pública de GitHub)

El repositorio se borró y se volvió a crear para eliminar del historial un dato sensible del prototipo. Configuración actual:

- [x] Repositorio **público**. Ramas remotas: `main` y `develop` (las `feature/…` se borran al mergear).
- [x] Rama por defecto: `develop`.
- [x] Ruleset `proteger-main-develop` (id 25198032) **activo** sobre `main` y `develop`: impide borrar las ramas, bloquea force push, exige PR (0 aprobaciones, conversaciones resueltas).
- [x] Checks requeridos: `frontend` (desde la etapa 0) y `base-de-datos` (desde la etapa 1).
- [x] *Require branches to be up to date before merging*: activado (`strict: true`).
- [x] Métodos de merge del ruleset: **`squash` y `merge`** (rebase desactivado). Como el ruleset es uno solo para las dos ramas, GitHub no distingue cuál va con cuál: **la regla se sigue a mano** al mergear (botón "Squash and merge" hacia `develop`; "Create a merge commit" en las releases `develop` → `main`). Si una release se squashea, `main` y `develop` divergen y cada release siguiente arrastra conflictos.
- [ ] Mejora opcional: dividir en dos rulesets con las mismas reglas, uno sobre `develop` con *solo squash* y otro sobre `main` con *solo merge* (Settings → Rules → Rulesets: duplicar `proteger-main-develop`, dejar cada uno con una sola rama y ajustar *Allowed merge methods*). Así GitHub lo hace cumplir solo.
- [?] Tipos de merge del repositorio (sección 2) y lista de bypass: la API pública no los muestra; revisarlos a mano.
- Historial: el PR #1 (etapa 0) entró a `develop` con *merge commit* (antes de restringir los métodos); el PR #2 (etapa 1), con squash. No hace falta corregir nada.

## 1. Crear el repositorio y subir las ramas

1. Repositorio creado por el usuario: **https://github.com/Juan-C-Ceballos/L-S-emprendimiento** (verificar en Settings si es público o privado; ver la nota de la sección 3).
2. En la carpeta del proyecto (ya hecho en la sesión de preparación, si el push funcionó):

```bash
git remote add origin https://github.com/Juan-C-Ceballos/L-S-emprendimiento.git
git push -u origin main
git push -u origin develop
git push -u origin feature/00-fundacion
```

3. En **Settings → General → Default branch**, poner `develop` como rama por defecto. Así los PR apuntan a `develop` sin pensarlo.

- [ ] Repositorio creado y ramas subidas (fecha: ____ )

## 2. Tipos de merge permitidos

**Settings → General → Pull Requests**:

- [x] Allow merge commits (para `develop` → `main`).
- [x] Allow squash merging (para feature/fix → `develop`). Default message: *Pull request title and description*.
- [ ] Allow rebase merging → **desactivado**.
- [x] Automatically delete head branches.

En la configuración del repositorio no se puede fijar el tipo de merge por rama, pero sí con **un ruleset por rama** (*Allowed merge methods*): `develop` solo squash y `main` solo merge commit. Ver "Estado verificado" arriba. La regla también está en la plantilla de PR.

## 3. Protección de ramas (`main` y `develop`)

> **Estado (2026-10-15):** el repositorio es **público**, así que las reglas de protección funcionan con GitHub Free. Consecuencias de que sea público: el prototipo, los documentos y los datos de ejemplo quedan visibles; **nunca** subir respaldos de datos como artifacts (opción A de la etapa 8 descartada mientras sea público); los secretos siguen yendo solo en *Settings → Secrets*.
>
> **Si se pasa a privado:** en repositorios **privados** con plan **GitHub Free**, las reglas de protección y los *rulesets* **no se aplican**. Opciones: (a) repositorio público (el código no tiene secretos, pero el prototipo y los documentos quedarían visibles), (b) GitHub Pro (individual) o Team, o (c) seguir con la regla como acuerdo de trabajo sin enforcement. Verificá las condiciones vigentes en la documentación de GitHub. Recomendado: (b) si el presupuesto lo permite; si no, (c) y respetar la regla por disciplina.

Con un plan que lo permita: **Settings → Rules → Rulesets → New branch ruleset**:

- Nombre: `proteger-main-develop`. Enforcement: **Active**.
- Target branches: `main` y `develop`.
- Reglas:
  - [x] Restrict deletions.
  - [x] Block force pushes.
  - [x] Require a pull request before merging (Required approvals: **0**, porque hay una sola persona; activar *Require conversation resolution*).
  - [x] Require status checks to pass → agregar `frontend` (y `base-de-datos` cuando exista, desde la etapa 1). Activar *Require branches to be up to date before merging*.
- Bypass list: vacía.

Con `gh` instalado (`winget install GitHub.cli` y `gh auth login`), la regla equivalente se puede crear desde la terminal:

```bash
gh api -X POST repos/Juan-C-Ceballos/L-S-emprendimiento/rulesets --input - <<'JSON'
{
  "name": "proteger-main-develop",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/main", "refs/heads/develop"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true } },
    { "type": "required_status_checks", "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [ { "context": "frontend" } ] } }
  ]
}
JSON
```

- [ ] Protección configurada (fecha: ____ ). Si no se pudo, anotar la opción elegida: ____

## 4. Secretos de GitHub Actions (desde la etapa 8)

**Settings → Secrets and variables → Actions**. Solo si se usa el respaldo programado (etapa 8):

- `SUPABASE_DB_URL_PROD`: cadena de conexión de solo lectura (o la del pooler) del proyecto de producción.

Nunca se guarda la clave `service_role` en GitHub.
