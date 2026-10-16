import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import { EstadoVacio } from '@/components/catalogo/EstadoVacio'
import { EtiquetasProducto } from '@/components/catalogo/EtiquetasProducto'
import { Galeria } from '@/components/catalogo/Galeria'
import { NotaStock } from '@/components/catalogo/NotaStock'
import { SelectorCantidad } from '@/components/catalogo/SelectorCantidad'
import { Button } from '@/components/ui/button'
import { formatearPrecio } from '@/lib/formato'
import { useAsync } from '@/lib/useAsync'
import { TITULO_SITIO, useTituloDocumento } from '@/lib/useTituloDocumento'
import { obtenerProductoPublico } from '@/services/productos'
import type { ProductoCatalogo } from '@/types/dominio'

/**
 * Stepper y botón de agregar (prototipo: `.bar` en móvil, `.dadd` en escritorio). El botón
 * queda deshabilitado hasta que exista el carrito (etapa 5).
 */
function AgregarAlCarrito({ producto, className }: { producto: ProductoCatalogo; className?: string }) {
  const [cantidad, setCantidad] = useState(1)
  if (producto.stock <= 0) {
    return (
      <div className={className}>
        <Button disabled>Agotado</Button>
      </div>
    )
  }
  return (
    <div className={className}>
      <SelectorCantidad valor={cantidad} max={producto.stock} onCambiar={setCantidad} />
      <Button disabled className="lg:w-auto lg:min-w-[240px] lg:flex-none">
        Agregar al carrito
      </Button>
    </div>
  )
}

function Detalle({ producto }: { producto: ProductoCatalogo }) {
  return (
    <div className="pb-20 lg:pb-0">
      <div className="mx-auto max-w-[720px] lg:grid lg:max-w-[1180px] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-14 lg:px-10 lg:pt-9 lg:pb-14">
        <Galeria
          key={producto.id}
          imagenes={producto.imagenes}
          nombre={producto.nombre}
          agotado={producto.stock <= 0}
        />
        <div className="px-5 pt-3 pb-7 lg:p-0 lg:pt-2">
          <EtiquetasProducto etiquetas={producto.etiquetas} />
          <h1 className="m-0 font-display text-[28px] leading-[1.08] font-semibold tracking-[-0.02em] lg:text-[42px]">
            {producto.nombre}
          </h1>
          <p className="mt-2 mb-0 text-[21px] font-bold tabular-nums lg:text-2xl">
            {formatearPrecio(producto.precio)}
          </p>
          {producto.descripcion !== '' && (
            <p className="mt-3 mb-0 text-[15px] leading-[1.55] whitespace-pre-line text-texto-medio">
              {producto.descripcion}
            </p>
          )}
          <NotaStock stock={producto.stock} />
          <AgregarAlCarrito
            key={producto.id}
            producto={producto}
            className="mt-7 hidden flex-wrap items-center gap-2.5 lg:flex"
          />
        </div>
      </div>
      <AgregarAlCarrito
        key={producto.id}
        producto={producto}
        className="fixed inset-x-0 bottom-0 z-[5] flex min-h-20 items-center gap-2.5 border-t border-borde bg-crema px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))] lg:hidden"
      />
    </div>
  )
}

/** Detalle público de un producto (prototipo: `c.isDetail`). */
export function ProductoPage() {
  const { id = '' } = useParams()
  const cargar = useCallback(() => obtenerProductoPublico(id), [id])
  const producto = useAsync(cargar)
  useTituloDocumento(producto.estado === 'listo' && producto.datos !== null ? `${producto.datos.nombre} · L&S` : TITULO_SITIO)

  if (producto.estado === 'cargando') {
    return (
      <div className="mx-auto max-w-[720px] lg:grid lg:max-w-[1180px] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14 lg:px-10 lg:pt-9" aria-busy="true">
        <div className="aspect-[1/1.1] animate-pulse bg-img-fondo lg:aspect-square lg:rounded-[4px]" />
        <div className="flex flex-col gap-3 px-5 pt-5 lg:p-0 lg:pt-2">
          <span className="block h-8 w-3/4 animate-pulse rounded-sm bg-img-fondo" />
          <span className="block h-6 w-1/4 animate-pulse rounded-sm bg-img-fondo" />
        </div>
      </div>
    )
  }

  if (producto.estado === 'error') {
    return (
      <EstadoVacio
        titulo="No pudimos cargar esta pieza."
        texto="Revisá tu conexión y probá de nuevo."
        acciones={
          <Button size="sm" onClick={producto.recargar}>
            Reintentar
          </Button>
        }
        className="mt-8 sm:mx-auto sm:max-w-[440px]"
        principal
      />
    )
  }

  if (producto.datos === null) {
    return (
      <EstadoVacio
        titulo="Esta pieza ya no está disponible"
        texto="Puede que la hayan sacado de la vidriera. Mirá las demás en el catálogo."
        acciones={
          <Button asChild size="sm">
            <Link to="/">Ver catálogo</Link>
          </Button>
        }
        className="mt-8 sm:mx-auto sm:max-w-[440px]"
        principal
      />
    )
  }

  return <Detalle producto={producto.datos} />
}
