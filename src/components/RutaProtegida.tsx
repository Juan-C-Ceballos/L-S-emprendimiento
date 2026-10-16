import { Navigate, Outlet, useLocation } from 'react-router'
import { PantallaCargando } from '@/components/PantallaCargando'
import { useSesion } from '@/lib/useSesion'

/** Guardia de `/admin/*`: sin sesión de administradora manda al login con `volver`. */
export function RutaProtegida() {
  const { estado } = useSesion()
  const { pathname, search } = useLocation()

  if (estado === 'cargando') return <PantallaCargando />
  if (estado === 'sin-sesion') {
    // Las barras quedan legibles: /admin/ingresar?volver=/admin/productos
    const volver = encodeURIComponent(pathname + search).replaceAll('%2F', '/')
    return <Navigate to={`/admin/ingresar?volver=${volver}`} replace />
  }
  return <Outlet />
}
