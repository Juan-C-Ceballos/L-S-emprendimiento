import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  titulo: string
  texto: string
  /** Botones debajo del texto (prototipo: `.erow`). */
  acciones?: ReactNode
  className?: string
  /** Si es lo único en la pantalla, el título es el `h1`. */
  principal?: boolean
}

/** Caja punteada de "no hay resultados" (prototipo: `.empty`). */
export function EstadoVacio({ titulo, texto, acciones, className, principal = false }: Props) {
  const Titulo = principal ? 'h1' : 'h2'
  return (
    <div
      className={cn(
        'mx-5 mt-4 mb-7 flex flex-col items-center gap-2 rounded-input border border-dashed border-borde-fuerte px-5 py-7 text-center',
        className,
      )}
    >
      <Titulo className="m-0 font-display text-[19px] font-semibold tracking-[-0.01em]">{titulo}</Titulo>
      <p className="m-0 max-w-[290px] text-sm text-texto-suave">{texto}</p>
      {acciones !== undefined && <div className="mt-2 flex flex-wrap justify-center gap-2">{acciones}</div>}
    </div>
  )
}
