import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { BuscadorConEspera } from '@/components/BuscadorConEspera'
import { claseChip, claseChipActiva } from '@/components/estilos'
import { FilaProducto } from '@/components/panel/FilaProducto'
import { Button } from '@/components/ui/button'
import { useAsync } from '@/lib/useAsync'
import {
  contarPorFiltro,
  esFiltroProductos,
  FILTROS_PRODUCTOS,
  filtrarProductosAdmin,
  type FiltroProductos,
} from '@/lib/productos'
import { cn } from '@/lib/utils'
import { ErrorServicio, MENSAJE_GENERICO } from '@/services/errores'
import { listarProductosAdmin } from '@/services/productos'

function textoVacio(q: string, filtro: FiltroProductos): string {
  if (q !== '') {
    return `No hay productos con «${q}» en el nombre o las etiquetas${filtro !== 'todos' ? ' en este estado' : ''}. Probá con otra palabra o cambiá el filtro.`
  }
  if (filtro === 'inactivos') return 'No hay productos desactivados. Cuando desactives uno, lo vas a ver acá.'
  if (filtro === 'stock-bajo') return 'Todos los productos activos tienen más de 3 unidades.'
  return 'Todavía no cargaste productos. Tocá «Nuevo producto» para empezar.'
}

/** Lista de productos del panel (prototipo: `a.isProducts`). Filtro y búsqueda en la URL. */
export function ProductosPage() {
  const productos = useAsync(listarProductosAdmin)
  const [params, setParams] = useSearchParams()
  const [esperando, setEsperando] = useState(false)

  const crudo = params.get('filtro')
  const filtro: FiltroProductos = esFiltroProductos(crudo) ? crudo : 'todos'
  const q = (params.get('q') ?? '').trim()

  function actualizar(cambios: { filtro?: FiltroProductos; q?: string }) {
    const siguientes = new URLSearchParams(params)
    const nuevoFiltro = cambios.filtro ?? filtro
    const nuevaQ = (cambios.q ?? q).trim()
    if (nuevoFiltro === 'todos') siguientes.delete('filtro')
    else siguientes.set('filtro', nuevoFiltro)
    if (nuevaQ === '') siguientes.delete('q')
    else siguientes.set('q', nuevaQ)
    setParams(siguientes, { replace: true })
  }

  const lista = productos.estado === 'listo' ? filtrarProductosAdmin(productos.datos, filtro, q) : []
  const contadores = productos.estado === 'listo' ? contarPorFiltro(productos.datos, q) : undefined
  const contador = esperando
    ? 'Buscando…'
    : `${lista.length === 1 ? '1 producto' : `${lista.length} productos`}${q !== '' ? ` para «${q}»` : ''}`

  return (
    <div className="pb-6">
      <div className="px-4 pt-3.5 pb-1.5 lg:px-8">
        <BuscadorConEspera
          valor={q}
          onBuscar={(valor) => {
            actualizar({ q: valor })
          }}
          onEsperando={setEsperando}
          placeholder="Nombre o etiqueta"
          ariaLabel="Buscar productos por nombre o etiqueta"
          className="mb-3 lg:max-w-[520px]"
        />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
          {FILTROS_PRODUCTOS.map((f) => (
            <button
              key={f.valor}
              type="button"
              aria-pressed={filtro === f.valor}
              className={cn(
                claseChip,
                'min-h-11 flex-none',
                filtro === f.valor && claseChipActiva,
              )}
              onClick={() => {
                actualizar({ filtro: f.valor })
              }}
            >
              {f.texto}
              {contadores !== undefined && (
                <span
                  className={cn(
                    'text-xs tabular-nums',
                    filtro === f.valor ? 'text-texto-chip-activo' : 'text-texto-suave',
                  )}
                >
                  {contadores[f.valor]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {productos.estado === 'cargando' && (
        <p className="m-0 px-4 pt-0.5 pb-2.5 text-[13px] text-texto-suave lg:px-8" aria-live="polite">
          Cargando productos…
        </p>
      )}

      {productos.estado === 'error' && (
        <div role="alert" className="mx-4 my-4 flex flex-col items-start gap-3 lg:mx-8">
          <p className="m-0 text-sm text-peligro">
            {productos.error instanceof ErrorServicio ? productos.error.message : MENSAJE_GENERICO}
          </p>
          <Button variant="ghost" size="sm" onClick={productos.recargar}>
            Reintentar
          </Button>
        </div>
      )}

      {productos.estado === 'listo' && (
        <>
          <p className="m-0 px-4 pt-0.5 pb-2.5 text-[13px] text-texto-suave lg:px-8" aria-live="polite">
            {contador}
          </p>
          {lista.length > 0 ? (
            <div className="mx-4 mb-2 overflow-hidden rounded-tarjeta border border-borde bg-white lg:mx-8">
              {lista.map((p) => (
                <FilaProducto key={p.id} producto={p} />
              ))}
            </div>
          ) : (
            <div className="mx-4 my-4 flex flex-col items-center gap-2 rounded-input border border-dashed border-borde-fuerte px-5 py-7 text-center lg:mx-8">
              <p className="m-0 max-w-[290px] text-sm text-texto-suave">{textoVacio(q, filtro)}</p>
            </div>
          )}
        </>
      )}

      <div className="flex justify-center px-4 pt-3 lg:px-8">
        <Button asChild variant="ghost" className="lg:max-w-[260px]">
          <Link to="/admin/productos/nuevo">Nuevo producto</Link>
        </Button>
      </div>
    </div>
  )
}
