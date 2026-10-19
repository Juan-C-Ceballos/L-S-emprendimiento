import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { BarraCarrito } from '@/components/BarraCarrito'
import { EstadoVacio } from '@/components/catalogo/EstadoVacio'
import { FiltrosCatalogo } from '@/components/catalogo/FiltrosCatalogo'
import { GrillaCargando, GrillaProductos } from '@/components/catalogo/GrillaProductos'
import { Hero } from '@/components/catalogo/Hero'
import { Button } from '@/components/ui/button'
import {
  aplicarFiltros,
  escribirFiltrosEnURL,
  hayFiltros,
  leerFiltrosDeURL,
  pistaVacio,
  quitarEtiquetasDesconocidas,
  SIN_FILTROS,
  textoResultado,
  type FiltrosCatalogo as Filtros,
} from '@/lib/filtros'
import { calcularTotal, textoPiezas } from '@/lib/carritoReglas'
import { useAsync } from '@/lib/useAsync'
import { useCarrito } from '@/lib/useCarrito'
import { TITULO_SITIO, useTituloDocumento } from '@/lib/useTituloDocumento'
import { listarCatalogo, ultimaVidriera } from '@/services/productos'

/** Catálogo público (prototipo: `c.isCatalog`). Los filtros viven en la URL (D-11). */
export function CatalogoPage() {
  useTituloDocumento(TITULO_SITIO)
  const vidriera = useAsync(listarCatalogo)
  // Al volver de un producto se pinta la última vidriera mientras llega la nueva: así la página
  // ya tiene su alto y `ScrollRestoration` puede devolver el scroll (D-42).
  const datos = vidriera.estado === 'listo' ? vidriera.datos : ultimaVidriera()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [buscando, setBuscando] = useState(false)
  const [etiquetaBuscada, setEtiquetaBuscada] = useState('')
  const carrito = useCarrito()

  const etiquetasUsadas = datos?.etiquetas ?? []
  const desdeURL = leerFiltrosDeURL(params)
  // Hasta que carga no se sabe qué etiquetas existen: se muestran las de la URL tal cual.
  const filtros = datos !== undefined ? quitarEtiquetasDesconocidas(desdeURL, etiquetasUsadas) : desdeURL

  function cambiar(nuevos: Filtros, { reemplazar }: { reemplazar: boolean }) {
    if (!hayFiltros(nuevos)) setEtiquetaBuscada('')
    // `navigate` y no `setSearchParams`, que codificaría las comas de `tags=aros,dorado`.
    void navigate({ search: escribirFiltrosEnURL(nuevos) }, { replace: reemplazar, preventScrollReset: true })
  }

  const productos = datos?.productos ?? []
  const resultado = aplicarFiltros(productos, filtros)
  const hayCarrito = carrito.piezas > 0

  return (
    <div className={hayCarrito ? 'pb-20 lg:pb-0' : undefined}>
      <Hero />
      <div className="mx-auto max-w-[720px] lg:grid lg:max-w-none lg:grid-cols-[288px_minmax(0,1fr)] lg:items-start lg:gap-11 lg:px-10 lg:pt-8 lg:pb-14">
        <FiltrosCatalogo
          filtros={filtros}
          productos={productos}
          etiquetasUsadas={etiquetasUsadas}
          onCambiar={cambiar}
          onEsperando={setBuscando}
          buscada={etiquetaBuscada}
          onBuscada={setEtiquetaBuscada}
          textoResultado={
            datos !== undefined
              ? textoResultado(resultado.length, productos.length, filtros, buscando)
              : 'Cargando la vidriera…'
          }
          className="lg:sticky lg:top-24 lg:p-0"
        />
        <div className="min-w-0">
          {vidriera.estado === 'cargando' && datos === undefined && <GrillaCargando />}

          {vidriera.estado === 'error' && datos === undefined && (
            <EstadoVacio
              titulo="No pudimos cargar la vidriera."
              texto="Revisá tu conexión y probá de nuevo."
              acciones={
                <Button size="sm" onClick={vidriera.recargar}>
                  Reintentar
                </Button>
              }
              className="lg:mx-0 lg:mt-3"
            />
          )}

          {datos !== undefined && productos.length === 0 && (
            <EstadoVacio
              titulo="Todavía no hay piezas"
              texto="Estamos preparando la vidriera. Volvé a mirar en unos días."
              className="lg:mx-0 lg:mt-3"
            />
          )}

          {productos.length > 0 && resultado.length === 0 && (
            <EstadoVacio
              titulo="No encontramos piezas"
              texto={pistaVacio(filtros)}
              acciones={
                <>
                  {filtros.modo === 'todas' && filtros.etiquetas.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        cambiar({ ...filtros, modo: 'alguna' }, { reemplazar: false })
                      }}
                    >
                      Que tenga alguna
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      cambiar({ ...SIN_FILTROS, orden: filtros.orden }, { reemplazar: false })
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </>
              }
              className="lg:mx-0 lg:mt-3"
            />
          )}

          {resultado.length > 0 && <GrillaProductos productos={resultado} />}
        </div>
      </div>
      {hayCarrito && (
        <BarraCarrito
          to="/carrito"
          texto={`Ver carrito · ${textoPiezas(carrito.piezas)}`}
          // Total con los precios de la vidriera (el carrito nunca guarda precios).
          total={calcularTotal(carrito.lineas, productos)}
        />
      )}
    </div>
  )
}
