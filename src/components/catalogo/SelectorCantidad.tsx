import { cn } from '@/lib/utils'

type Props = {
  valor: number
  /** Tope de unidades (el stock disponible). */
  max: number
  onCambiar: (valor: number) => void
  /** `sm`: 44 px de alto, para las líneas del carrito (prototipo: `.step.sm`). */
  tamano?: 'normal' | 'sm'
  className?: string
}

/** Stepper − cantidad + (prototipo: `.step`). Mínimo 1. Se reutiliza en el carrito (etapa 5). */
export function SelectorCantidad({ valor, max, onCambiar, tamano = 'normal', className }: Props) {
  const claseBoton = cn(
    'flex items-center justify-center rounded-full p-0 disabled:cursor-not-allowed disabled:text-borde-fuerte',
    tamano === 'sm' ? 'size-[42px] text-lg' : 'h-[50px] w-[46px] text-xl',
  )
  return (
    <div
      className={cn(
        'flex flex-none items-center rounded-full border border-borde-fuerte bg-white',
        tamano === 'sm' ? 'h-11' : 'h-[52px]',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Restar una unidad"
        disabled={valor <= 1}
        className={claseBoton}
        onClick={() => {
          onCambiar(Math.max(1, valor - 1))
        }}
      >
        −
      </button>
      <span className="min-w-[26px] text-center font-bold tabular-nums" aria-live="polite">
        {valor}
      </span>
      <button
        type="button"
        aria-label="Sumar una unidad"
        disabled={valor >= max}
        className={claseBoton}
        onClick={() => {
          onCambiar(Math.min(max, valor + 1))
        }}
      >
        +
      </button>
    </div>
  )
}
