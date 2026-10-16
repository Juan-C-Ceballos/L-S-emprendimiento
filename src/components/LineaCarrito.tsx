import { SelectorCantidad } from '@/components/catalogo/SelectorCantidad'
import { claseLink } from '@/components/estilos'
import { PIEZA_NO_DISPONIBLE } from '@/lib/carritoReglas'
import { formatearPrecio } from '@/lib/formato'
import type { LineaCarrito as Linea, ProblemaCarrito, ProductoCarrito } from '@/types/dominio'

type Props = {
  linea: Linea
  /** `undefined` si la pieza ya no se puede leer (se desactivó). */
  producto: ProductoCarrito | undefined
  problema: ProblemaCarrito | undefined
  onCambiar: (cantidad: number) => void
  onQuitar: () => void
}

/** Línea del carrito (prototipo: `.line`): miniatura, nombre, subtotal, precio unitario, stepper y Quitar. */
export function LineaCarrito({ linea, producto, problema, onCambiar, onQuitar }: Props) {
  const nombre = producto?.nombre ?? PIEZA_NO_DISPONIBLE
  return (
    <li className="flex gap-3.5 border-b border-borde py-[18px]">
      <span className="relative block h-[94px] w-[76px] flex-none overflow-hidden rounded-imagen bg-img-fondo">
        {producto?.miniaturaUrl != null && (
          <img
            src={producto.miniaturaUrl}
            alt=""
            width={76}
            height={94}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2.5">
          <span className="text-[15px] leading-[1.3] font-semibold">{nombre}</span>
          {producto !== undefined && (
            <span className="font-bold whitespace-nowrap tabular-nums">
              {formatearPrecio(producto.precio * linea.cantidad)}
            </span>
          )}
        </div>
        {producto !== undefined && (
          <span className="text-[13px] text-texto-suave">{formatearPrecio(producto.precio)} c/u</span>
        )}
        <div className="mt-2 flex items-center justify-between">
          {producto !== undefined && producto.stock > 0 ? (
            <SelectorCantidad
              tamano="sm"
              valor={linea.cantidad}
              max={Math.max(linea.cantidad, producto.stock)}
              onCambiar={onCambiar}
            />
          ) : (
            <span />
          )}
          <button
            type="button"
            className={claseLink}
            aria-label={`Quitar ${nombre} del carrito`}
            onClick={onQuitar}
          >
            Quitar
          </button>
        </div>
        {problema !== undefined && (
          <p className="mt-2 mb-0 text-[13px] font-semibold text-peligro">{problema.texto}</p>
        )}
      </div>
    </li>
  )
}
