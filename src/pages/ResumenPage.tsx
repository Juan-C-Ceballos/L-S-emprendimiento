import { SeccionPendiente } from '@/components/panel/SeccionPendiente'

// El título lo muestra el header del panel (handle de la ruta en src/router.tsx).
export function ResumenPage() {
  return <SeccionPendiente etapa={7} />
}
