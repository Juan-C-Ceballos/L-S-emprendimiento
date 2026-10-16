import { useEffect } from 'react'

export const TITULO_SITIO = 'L&S · Accesorios'

/** Título de la pestaña mientras la pantalla está montada; al salir vuelve al del sitio. */
export function useTituloDocumento(titulo: string) {
  useEffect(() => {
    document.title = titulo
    return () => {
      document.title = TITULO_SITIO
    }
  }, [titulo])
}
