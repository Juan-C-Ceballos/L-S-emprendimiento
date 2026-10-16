import { claseChip, claseChipActiva } from '@/components/estilos'
import { cn } from '@/lib/utils'

type Props =
  | { tipo: 'disponible'; nombre: string; cantidad: number; onClick: () => void; className?: string }
  | { tipo: 'elegida'; nombre: string; onClick: () => void }

/**
 * Chip de etiqueta del catálogo (prototipo: `.chip`). Disponible: con contador y atenuada si
 * cuenta 0. Elegida: oscura, con × para quitarla.
 */
export function ChipEtiqueta(props: Props) {
  if (props.tipo === 'elegida') {
    return (
      <button
        type="button"
        aria-label={`Quitar filtro ${props.nombre}`}
        className={cn(claseChip, claseChipActiva)}
        onClick={props.onClick}
      >
        {props.nombre}
        <span className="-mr-1 flex">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </svg>
        </span>
      </button>
    )
  }
  return (
    <button
      type="button"
      aria-label={`${props.nombre}, ${props.cantidad === 1 ? '1 pieza' : `${props.cantidad} piezas`}`}
      className={cn(
        claseChip,
        'transition-[opacity,border-color]',
        props.cantidad === 0 && 'opacity-[0.36]',
        props.className,
      )}
      onClick={props.onClick}
    >
      {props.nombre}
      <span className="text-xs text-texto-suave tabular-nums">{props.cantidad}</span>
    </button>
  )
}
