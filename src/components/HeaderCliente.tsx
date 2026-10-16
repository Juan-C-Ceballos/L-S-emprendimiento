import { Link, useLocation, useNavigate } from 'react-router'
import { Logo } from '@/components/Logo'
import { textoPiezas } from '@/lib/carritoReglas'
import { useCarrito } from '@/lib/useCarrito'

const claseIcono =
  'flex size-11 items-center justify-center rounded-full text-tinta transition-colors hover:bg-champan-suave'

/** Header del sitio público (prototipo: `.hd`): Volver, marca y carrito con contador. */
export function HeaderCliente() {
  const location = useLocation()
  const navigate = useNavigate()
  const { piezas } = useCarrito()
  // "Volver" vuelve a la pantalla anterior (el catálogo conserva sus filtros en la URL); si se
  // entró directo por un link, o desde el pedido ya confirmado, va al catálogo.
  const volver = () => {
    if (location.key === 'default' || location.pathname === '/pedido/confirmado') void navigate('/')
    else void navigate(-1)
  }

  return (
    <header className="sticky top-0 z-10 flex h-[60px] items-center justify-between border-b border-borde bg-crema px-2 lg:h-[72px] lg:px-8">
      <div className="flex size-11 items-center justify-center">
        {location.pathname !== '/' && (
          <button type="button" aria-label="Volver" className={claseIcono} onClick={volver}>
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
          </button>
        )}
      </div>
      <Link
        to="/"
        aria-label="L&S, ir al catálogo"
        className="flex min-h-11 items-center px-2.5 py-1 text-tinta no-underline"
      >
        <Logo />
      </Link>
      <div className="flex size-11 items-center justify-center">
        <Link
          to="/carrito"
          aria-label={piezas > 0 ? `Carrito, ${textoPiezas(piezas)}` : 'Carrito vacío'}
          className={`${claseIcono} relative`}
        >
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
          {piezas > 0 && (
            <span className="absolute top-[3px] right-px flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] bg-bronce px-[5px] text-[11px] leading-none font-bold text-white tabular-nums">
              {piezas}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
