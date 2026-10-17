import { Link, Outlet, useMatches } from 'react-router'
import { BotonSalir } from '@/components/panel/BotonSalir'
import { claseBotonIcono } from '@/components/estilos'
import { HeaderPanel } from '@/components/panel/HeaderPanel'
import { NavPanel } from '@/components/panel/NavPanel'
import { esRutaPanel } from '@/components/panel/rutasPanel'
import type { ContextoPanel } from '@/components/panel/usePanel'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/utils'
import { contarPendientes } from '@/services/pedidos'

/** Estructura de `/admin/*`: header con el título de la ruta, tabs o barra lateral, y contenido. */
export function PanelLayout() {
  const actual = useMatches().at(-1)
  const ruta = actual !== undefined && esRutaPanel(actual.handle) ? actual.handle : undefined
  const tabs = ruta?.tabs ?? false
  // Se cuenta al entrar al panel y cada vez que una pantalla vende o cancela un pedido.
  const pendientes = useAsync(contarPendientes)
  const contexto: ContextoPanel = { refrescarPendientes: pendientes.recargar }

  return (
    <div className={cn('min-h-dvh lg:pb-0 lg:pl-[220px]', tabs && 'pb-[68px]')}>
      <HeaderPanel
        titulo={ruta !== undefined && actual !== undefined ? ruta.titulo(actual.params) : 'Panel'}
        volver={ruta?.volver}
        accion={
          ruta?.accion === 'salir' ? (
            <BotonSalir />
          ) : ruta?.accion === 'nuevo-producto' ? (
            <Link
              to="/admin/productos/nuevo"
              aria-label="Nuevo producto"
              className={claseBotonIcono}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </Link>
          ) : undefined
        }
      />
      <main>
        <Outlet context={contexto} />
      </main>
      <NavPanel
        visibleEnMovil={tabs}
        pendientes={pendientes.estado === 'listo' ? pendientes.datos : undefined}
      />
    </div>
  )
}
