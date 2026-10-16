/** Pantalla neutra mientras se sabe si hay sesión (evita que el login parpadee al recargar). */
export function PantallaCargando() {
  return (
    <div className="min-h-dvh bg-crema" aria-busy="true">
      <p className="sr-only" aria-live="polite">
        Cargando…
      </p>
    </div>
  )
}
