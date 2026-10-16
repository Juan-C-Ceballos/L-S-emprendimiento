import { Link } from 'react-router'
import { formatearPrecio } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { ProductoVidriera } from '@/types/dominio'

export const claseBadge =
  'absolute top-2 left-2 z-[1] rounded-[2px] bg-white px-2 py-[5px] text-[10px] font-bold tracking-[0.12em] text-tinta uppercase'

type Props = {
  producto: ProductoVidriera
  /** Las primeras de la grilla cargan enseguida; el resto, al acercarse. */
  prioritaria: boolean
}

/** Tarjeta del catálogo (prototipo: `.card`): foto 4:5, nombre y precio; agotada, desaturada. */
export function TarjetaProducto({ producto, prioritaria }: Props) {
  const precio = formatearPrecio(producto.precio)
  return (
    <Link
      to={`/producto/${producto.id}`}
      aria-label={`${producto.nombre}, ${precio}${producto.agotado ? ', agotado' : ''}`}
      className="group flex flex-col gap-1 text-tinta no-underline hover:text-tinta"
    >
      <span className="relative mb-2 block aspect-[4/5] overflow-hidden rounded-imagen bg-img-fondo group-hover:shadow-[0_0_0_1px_var(--color-tinta)]">
        {producto.portadaUrl !== null && (
          <img
            src={producto.portadaUrl}
            alt={producto.nombre}
            width={400}
            height={500}
            loading={prioritaria ? 'eager' : 'lazy'}
            decoding="async"
            className={cn(
              'absolute inset-0 size-full object-cover',
              producto.agotado && 'opacity-55 grayscale-[0.7]',
            )}
          />
        )}
        {producto.agotado && <span className={claseBadge}>Agotado</span>}
      </span>
      <span className="block text-sm leading-[1.3]">{producto.nombre}</span>
      <span
        className={cn(
          'block text-sm tabular-nums',
          producto.agotado ? 'font-medium text-texto-suave' : 'font-bold',
        )}
      >
        {precio}
      </span>
    </Link>
  )
}
