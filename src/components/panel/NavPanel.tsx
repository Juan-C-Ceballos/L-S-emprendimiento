import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

type Props = {
  /** En móvil, las tabs se ocultan en formularios y detalle; en escritorio la barra se ve siempre. */
  visibleEnMovil: boolean
  /** Pedidos pendientes para el badge de Pedidos. */
  pendientes?: number
}

type Seccion = { ruta: string; texto: string; icono: ReactNode; exacta?: boolean }

const propsIcono = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

const SECCIONES: Seccion[] = [
  {
    ruta: '/admin',
    texto: 'Resumen',
    exacta: true,
    icono: (
      <svg {...propsIcono}>
        <path d="M4 4h7v9H4z" />
        <path d="M13 4h7v5h-7z" />
        <path d="M13 11h7v9h-7z" />
        <path d="M4 15h7v5H4z" />
      </svg>
    ),
  },
  {
    ruta: '/admin/productos',
    texto: 'Productos',
    icono: (
      <svg {...propsIcono}>
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
        <path d="M4 7.5l8 4.5 8-4.5" />
        <path d="M12 12v9" />
      </svg>
    ),
  },
  {
    ruta: '/admin/pedidos',
    texto: 'Pedidos',
    icono: (
      <svg {...propsIcono} strokeLinecap="round">
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
      </svg>
    ),
  },
  {
    ruta: '/admin/ajustes',
    texto: 'Ajustes',
    icono: (
      <svg {...propsIcono} strokeLinecap="round">
        <path d="M4 7h10" />
        <path d="M18 7h2" />
        <path d="M4 17h4" />
        <path d="M12 17h8" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="10" cy="17" r="2" />
      </svg>
    ),
  },
]

/** Secciones del panel (prototipo: `.tabs`): tabs abajo en móvil, barra lateral de 220 px en `lg`. */
export function NavPanel({ visibleEnMovil, pendientes = 0 }: Props) {
  return (
    <nav
      aria-label="Secciones del panel"
      className={cn(
        'fixed inset-x-0 bottom-0 z-20 h-[68px] border-t border-borde bg-white',
        'lg:top-0 lg:right-auto lg:flex lg:h-auto lg:w-[220px] lg:flex-col lg:justify-start lg:gap-1 lg:border-t-0 lg:border-r lg:px-3 lg:py-[22px]',
        visibleEnMovil ? 'flex' : 'hidden',
      )}
    >
      {/* Solo en escritorio: logo de la marca arriba de las secciones. */}
      <span className="hidden flex-col items-center gap-1.5 px-3.5 pb-[22px] lg:flex">
        <img src="/logo-sello.webp" alt="L&S" width={96} height={96} className="size-24" />
        <span className="text-[11px] font-semibold tracking-[0.14em] text-texto-suave uppercase">Panel</span>
      </span>
      {SECCIONES.map((seccion) => (
        <NavLink
          key={seccion.ruta}
          to={seccion.ruta}
          end={seccion.exacta}
          className={({ isActive }) =>
            cn(
              'relative flex flex-1 flex-col items-center justify-center gap-[3px] text-xs font-semibold text-texto-tab no-underline',
              'lg:min-h-[46px] lg:w-full lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:rounded-input lg:px-3.5 lg:text-sm lg:hover:bg-crema',
              isActive &&
                'text-tinta before:absolute before:inset-x-[30%] before:top-0 before:h-0.5 before:bg-bronce lg:bg-champan-suave lg:before:hidden lg:hover:bg-champan-suave',
            )
          }
        >
          {seccion.icono}
          {seccion.texto}
          {seccion.ruta === '/admin/pedidos' && pendientes > 0 && (
            <span className="absolute top-2 left-[calc(50%+8px)] flex h-[17px] min-w-[17px] items-center justify-center rounded-[9px] bg-bronce px-1 text-[10px] leading-none font-bold text-white lg:static lg:ml-auto">
              {pendientes}
              <span className="sr-only"> pendientes</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
