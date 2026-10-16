import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { claseBotonIcono } from '@/components/estilos'

type Props = {
  titulo: string
  /** Ruta del botón "Volver"; sin ella, el lugar queda vacío. */
  volver?: string
  /** Botón de ícono a la derecha (Salir, Nuevo producto). */
  accion?: ReactNode
}

/** Header del panel (prototipo: `.hd` + `.atitle`). */
export function HeaderPanel({ titulo, volver, accion }: Props) {
  return (
    <header className="sticky top-0 z-10 flex h-[60px] items-center justify-between border-b border-borde bg-crema px-2 lg:h-[72px] lg:px-8">
      <div className="flex size-11 items-center justify-center">
        {volver !== undefined && (
          <Link to={volver} aria-label="Volver" className={claseBotonIcono}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
        )}
      </div>
      <h1 className="m-0 flex-1 text-center font-display text-[19px] font-semibold tracking-[-0.01em]">
        {titulo}
      </h1>
      <div className="flex size-11 items-center justify-center">{accion}</div>
    </header>
  )
}
