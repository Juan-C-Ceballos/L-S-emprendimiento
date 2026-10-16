import { Link } from 'react-router'
import { PillInactivo, PillStock } from '@/components/panel/PillStock'
import { formatearPrecio } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { Producto } from '@/types/dominio'

type Props = {
  producto: Producto
  /** De dónde se abre la edición (`?desde=resumen` hace que "Volver" regrese al Resumen). */
  desde?: string
  /** `resumen`: solo nombre, precio y stock (prototipo: "Para reponer"). */
  variante?: 'lista' | 'resumen'
}

/** Fila de la lista de productos del panel (prototipo: `.row`, `prow`). */
export function FilaProducto({ producto, desde, variante = 'lista' }: Props) {
  const portada = producto.imagenes[0]
  const destino = `/admin/productos/${producto.id}${desde === undefined ? '' : `?desde=${desde}`}`
  return (
    <Link
      to={destino}
      aria-label={`Editar ${producto.nombre}`}
      className="flex min-h-[68px] w-full items-center gap-3 border-b border-divisor bg-white px-3.5 py-3 text-left text-tinta no-underline last:border-b-0 hover:bg-fila-hover"
    >
      <span
        className={cn(
          'relative block h-[58px] w-12 flex-none overflow-hidden rounded-imagen bg-img-fondo',
          !producto.activo && 'opacity-50',
        )}
      >
        {portada !== undefined && (
          <img
            src={portada.urlMiniatura}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        )}
      </span>
      <span className={cn('flex min-w-0 flex-1 flex-col gap-px', !producto.activo && 'opacity-50')}>
        <span className="truncate text-[15px] font-semibold">{producto.nombre}</span>
        {variante === 'resumen' ? (
          <span className="text-[12.5px] text-texto-suave tabular-nums">{formatearPrecio(producto.precio)}</span>
        ) : (
          <>
            <span className="text-[12.5px] text-texto-suave tabular-nums">
              {formatearPrecio(producto.precio)} · costo{' '}
              {producto.costo === null ? 'sin cargar' : formatearPrecio(producto.costo)}
            </span>
            <span className="text-[12.5px] text-texto-suave">
              {producto.etiquetas.length > 0 ? producto.etiquetas.join(' · ') : 'Sin etiquetas'}
            </span>
          </>
        )}
      </span>
      <span className="flex flex-none flex-col items-end gap-[5px]">
        <PillStock stock={producto.stock} />
        {!producto.activo && <PillInactivo />}
      </span>
    </Link>
  )
}
