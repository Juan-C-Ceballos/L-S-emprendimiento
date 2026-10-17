import { Link } from 'react-router'
import { BarraCarrito } from '@/components/BarraCarrito'
import { EstadoVacio } from '@/components/catalogo/EstadoVacio'
import { clasePagina, claseTituloPagina } from '@/components/estilos'
import { LineaCarrito } from '@/components/LineaCarrito'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import { calcularTotal, detectarProblemas, PIEZA_NO_DISPONIBLE } from '@/lib/carritoReglas'
import { formatearPrecio } from '@/lib/formato'
import { useCarrito } from '@/lib/useCarrito'
import { useProductosDelCarrito } from '@/lib/useProductosDelCarrito'
import { useTituloDocumento } from '@/lib/useTituloDocumento'
import { ErrorServicio, MENSAJE_GENERICO } from '@/services/errores'

/** Carrito (prototipo: `c.isCart`). Precios y stock se leen de la base al mostrar. */
export function CarritoPage() {
  useTituloDocumento('Tu carrito · L&S')
  const carrito = useCarrito()
  const { mostrarToast } = useToast()
  const { productos, error, recargar } = useProductosDelCarrito(carrito.lineas)

  if (carrito.lineas.length === 0) {
    return (
      <div className={clasePagina}>
        <h1 className={claseTituloPagina}>Tu carrito</h1>
        <EstadoVacio
          titulo="Tu carrito está vacío"
          texto="Mirá la vidriera y tocá una pieza para agregarla."
          acciones={
            <Button asChild size="sm">
              <Link to="/">Ver catálogo</Link>
            </Button>
          }
          className="mx-0 mt-5 mb-0"
        />
      </div>
    )
  }

  if (productos === null) {
    return (
      <div className={clasePagina}>
        <h1 className={claseTituloPagina}>Tu carrito</h1>
        {error === undefined ? (
          <p className="mt-4 text-sm text-texto-suave" aria-live="polite">
            Cargando tu carrito…
          </p>
        ) : (
          <div role="alert" className="mt-4 flex flex-col items-start gap-3">
            <p className="m-0 text-sm text-peligro">
              {error instanceof ErrorServicio ? error.message : MENSAJE_GENERICO}
            </p>
            <Button variant="ghost" size="sm" onClick={recargar}>
              Reintentar
            </Button>
          </div>
        )}
      </div>
    )
  }

  const porId = new Map(productos.map((p) => [p.id, p]))
  const problemas = new Map(detectarProblemas(carrito.lineas, productos).map((p) => [p.productoId, p]))
  const total = calcularTotal(carrito.lineas, productos)

  return (
    <div className="pb-20 lg:pb-0">
      <div className={clasePagina}>
        <h1 className={claseTituloPagina}>Tu carrito</h1>
        <ul className="m-0 list-none p-0">
          {carrito.lineas.map((linea) => {
            const producto = porId.get(linea.productoId)
            return (
              <LineaCarrito
                key={linea.productoId}
                linea={linea}
                producto={producto}
                problema={problemas.get(linea.productoId)}
                onCambiar={(cantidad) => {
                  carrito.cambiarCantidad(linea.productoId, cantidad)
                }}
                onQuitar={() => {
                  carrito.quitar(linea.productoId)
                  mostrarToast(`Quitaste ${producto?.nombre ?? PIEZA_NO_DISPONIBLE} del carrito.`)
                }}
              />
            )
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-[18px] pb-2 font-semibold">
          <span>Total</span>
          <span className="font-display text-[26px] font-semibold tabular-nums">{formatearPrecio(total)}</span>
        </div>
        <p className="m-0 text-[13px] leading-[1.45] text-texto-suave">
          Después de confirmar vas a poder enviarnos el pedido por WhatsApp para coordinar.
        </p>
        <div className="mt-[22px] hidden lg:flex">
          <Button asChild className="justify-between">
            <Link to="/confirmar">
              <span>Continuar</span>
              <span className="tabular-nums">{formatearPrecio(total)}</span>
            </Link>
          </Button>
        </div>
      </div>
      <BarraCarrito to="/confirmar" texto="Continuar" total={total} />
    </div>
  )
}
