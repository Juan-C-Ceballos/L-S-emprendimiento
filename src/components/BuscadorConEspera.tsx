import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { claseBotonIcono } from '@/components/estilos'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export const ESPERA_BUSQUEDA_MS = 350

type Props = {
  /** Búsqueda vigente (la de la URL). Si cambia desde afuera, el input se actualiza. */
  valor: string
  /** Se llama 350 ms después de la última tecla, o enseguida al borrar con la cruz. */
  onBuscar: (valor: string) => void
  /** Avisa mientras hay una búsqueda esperando (para mostrar "Buscando…"). */
  onEsperando?: (esperando: boolean) => void
  placeholder: string
  ariaLabel: string
  className?: string
}

/** Buscador con espera (prototipo: `.search` + `typeSearch`). Se reutiliza en las etapas 4 y 6. */
export function BuscadorConEspera({
  valor,
  onBuscar,
  onEsperando,
  placeholder,
  ariaLabel,
  className,
}: Props) {
  const [texto, setTexto] = useState(valor)
  const [valorPrevio, setValorPrevio] = useState(valor)
  const temporizador = useRef<number | undefined>(undefined)
  // El temporizador llama a la versión más reciente de los callbacks: si el padre cambió algo
  // mientras se tipeaba (por ejemplo, el filtro), la búsqueda no lo pisa con datos viejos.
  const callbacks = useRef({ onBuscar, onEsperando })
  useLayoutEffect(() => {
    callbacks.current = { onBuscar, onEsperando }
  })

  // Si la búsqueda cambia desde afuera (por ejemplo, volver atrás), se refleja en el input.
  if (valor !== valorPrevio) {
    setValorPrevio(valor)
    setTexto(valor)
  }

  useEffect(
    () => () => {
      window.clearTimeout(temporizador.current)
    },
    [],
  )

  function programar(nuevo: string) {
    window.clearTimeout(temporizador.current)
    onEsperando?.(true)
    temporizador.current = window.setTimeout(() => {
      callbacks.current.onEsperando?.(false)
      callbacks.current.onBuscar(nuevo)
    }, ESPERA_BUSQUEDA_MS)
  }

  function borrar() {
    window.clearTimeout(temporizador.current)
    onEsperando?.(false)
    setTexto('')
    onBuscar('')
  }

  return (
    <div className={cn('relative block', className)}>
      <span className="pointer-events-none absolute top-1/2 left-3.5 flex -translate-y-1/2 text-texto-suave">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4 4" />
        </svg>
      </span>
      <Input
        type="search"
        value={texto}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="pr-[46px] pl-[42px] [&::-webkit-search-cancel-button]:hidden"
        onChange={(e) => {
          setTexto(e.target.value)
          programar(e.target.value)
        }}
      />
      {texto !== '' && (
        <button
          type="button"
          aria-label="Borrar búsqueda"
          className={cn(claseBotonIcono, 'absolute top-[3px] right-[3px]')}
          onClick={borrar}
        >
          <svg
            width="16"
            height="16"
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
        </button>
      )}
    </div>
  )
}
