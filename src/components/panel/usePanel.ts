import { useOutletContext } from 'react-router'

/** Lo que `PanelLayout` comparte con sus pantallas por el contexto del `<Outlet>`. */
export type ContextoPanel = {
  /** Vuelve a contar los pedidos pendientes (badge de la tab Pedidos). */
  refrescarPendientes: () => void
}

const sinAccion = () => undefined

/** Fuera de `PanelLayout` (por ejemplo, en pruebas de una pantalla sola) no hace nada. */
export function useRefrescarPendientes(): () => void {
  const contexto = useOutletContext<ContextoPanel | undefined>()
  return contexto?.refrescarPendientes ?? sinAccion
}
