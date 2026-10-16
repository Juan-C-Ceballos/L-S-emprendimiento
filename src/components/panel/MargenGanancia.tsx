import { formatearPrecio } from '@/lib/formato'
import { calcularMargen } from '@/lib/productos'
import { cn } from '@/lib/utils'

/** Caja "Ganancia por unidad" en vivo (prototipo: `.mg`, `.mg.pos`, `.mg.neg`). */
export function MargenGanancia({ precio, costo }: { precio: number | null; costo: number | null }) {
  const margen = calcularMargen(precio, costo)
  const subtitulo =
    margen === null
      ? 'Completá precio y costo para calcularla'
      : margen.negativo
        ? 'Ojo: el precio está por debajo del costo'
        : `${margen.porcentaje}% del precio`
  const valor =
    margen === null ? '—' : `${margen.negativo ? '−' : ''}${formatearPrecio(Math.abs(margen.ganancia))}`

  return (
    <div
      aria-live="polite"
      className={cn(
        'mt-3.5 flex items-center justify-between gap-3 rounded-alerta px-3.5 py-3',
        margen === null && 'bg-margen-neutro',
        margen !== null && !margen.negativo && 'bg-ok-fondo text-ok-texto',
        margen?.negativo === true && 'bg-peligro-fondo text-peligro-texto',
      )}
    >
      <span>
        <span className="text-[13px] font-bold">Ganancia por unidad</span>
        <span className="mt-0.5 block text-xs">{subtitulo}</span>
      </span>
      <span className="text-right font-display text-[22px] font-semibold tabular-nums">{valor}</span>
    </div>
  )
}
