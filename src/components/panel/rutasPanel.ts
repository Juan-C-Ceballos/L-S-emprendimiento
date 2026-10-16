import type { Params } from 'react-router'

/** Datos de cada ruta del panel, en el `handle` de la ruta (`src/router.tsx`). */
export type RutaPanel = {
  /** Título centrado del header. */
  titulo: (params: Params) => string
  /** En móvil, las tabs solo se ven en las cuatro secciones (prototipo: `showTabs`). */
  tabs?: boolean
  /** Si está, el header muestra "Volver" hacia esa ruta. */
  volver?: string
  /** Acción a la derecha del header. */
  accion?: 'salir' | 'nuevo-producto'
}

export function esRutaPanel(handle: unknown): handle is RutaPanel {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    'titulo' in handle &&
    typeof handle.titulo === 'function'
  )
}
