import { Link } from 'react-router'
import { cn } from '@/lib/utils'

type Props = {
  to: string
  etiqueta: string
  valor: string
  detalle: string
  /** La tarjeta ancha y oscura (ventas del mes): ocupa dos columnas en móvil. */
  destacada?: boolean
}

/** Tarjeta de número del Resumen (prototipo: `.stat`, `.stat.wide`): lleva a la lista filtrada. */
export function Stat({ to, etiqueta, valor, detalle, destacada = false }: Props) {
  return (
    <Link
      to={to}
      className={cn(
        'flex min-h-[104px] flex-col justify-between gap-1.5 rounded-tarjeta border p-3.5 text-left no-underline transition-colors',
        destacada
          ? 'col-span-2 border-tinta bg-tinta text-white hover:bg-tinta-hover hover:text-white lg:col-span-1'
          : 'border-borde bg-white text-tinta hover:border-tinta hover:text-tinta',
      )}
    >
      <span
        className={cn(
          'text-xs font-bold tracking-[0.04em]',
          destacada ? 'text-texto-chip-activo' : 'text-texto-suave',
        )}
      >
        {etiqueta}
      </span>
      <span className="font-display text-[32px] leading-none font-semibold tracking-[-0.02em] tabular-nums">
        {valor}
      </span>
      <span className={cn('text-xs', destacada ? 'text-texto-chip-activo' : 'text-texto-suave')}>{detalle}</span>
    </Link>
  )
}
