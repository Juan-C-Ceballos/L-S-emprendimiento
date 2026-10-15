import { Link } from 'react-router'
import { Logo } from '@/components/Logo'

const claseIcono =
  'flex size-11 items-center justify-center rounded-full text-tinta transition-colors hover:bg-rosa-suave'

/** Header del sitio público (prototipo: `.hd`). El contador del carrito llega en la etapa 5. */
export function HeaderCliente() {
  return (
    <header className="sticky top-0 z-10 flex h-[60px] items-center justify-between border-b border-borde bg-crema px-2 lg:h-[72px] lg:px-8">
      {/* Lugar del botón "Volver" (etapa 4). */}
      <div className="size-11" />
      <Link
        to="/"
        aria-label="L&S, ir al catálogo"
        className="flex min-h-11 items-center px-2.5 py-1 text-tinta no-underline"
      >
        <Logo />
      </Link>
      <div className="flex size-11 items-center justify-center">
        <Link to="/carrito" aria-label="Carrito vacío" className={claseIcono}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 8h14l-1.2 12H6.2L5 8z" />
            <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
          </svg>
        </Link>
      </div>
    </header>
  )
}
