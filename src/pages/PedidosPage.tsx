import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { BuscadorConEspera } from '@/components/BuscadorConEspera'
import { claseChip, claseChipActiva } from '@/components/estilos'
import { FilaPedido } from '@/components/panel/FilaPedido'
import { Button } from '@/components/ui/button'
import {
  contarPorEstado,
  esFiltroPedidos,
  FILTROS_PEDIDOS,
  filtrarPedidos,
  textoVacioPedidos,
  type FiltroPedidos,
} from '@/lib/pedidos'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/utils'
import { ErrorServicio, MENSAJE_GENERICO } from '@/services/errores'
import { listarPedidosAdmin } from '@/services/pedidos'

/**
 * Lista de pedidos del panel (prototipo: `a.isOrders`). Estado y búsqueda en la URL:
 * `/admin/pedidos?estado=vendido&q=lucia` (sin `estado` = pendientes).
 */
export function PedidosPage() {
  const pedidos = useAsync(listarPedidosAdmin)
  const [params, setParams] = useSearchParams()
  const [esperando, setEsperando] = useState(false)

  const crudo = params.get('estado')
  const estado: FiltroPedidos = esFiltroPedidos(crudo) ? crudo : 'pendiente'
  const q = (params.get('q') ?? '').trim()

  function actualizar(cambios: { estado?: FiltroPedidos; q?: string }) {
    const siguientes = new URLSearchParams(params)
    const nuevoEstado = cambios.estado ?? estado
    const nuevaQ = (cambios.q ?? q).trim()
    if (nuevoEstado === 'pendiente') siguientes.delete('estado')
    else siguientes.set('estado', nuevoEstado)
    if (nuevaQ === '') siguientes.delete('q')
    else siguientes.set('q', nuevaQ)
    setParams(siguientes, { replace: true })
  }

  const lista = pedidos.estado === 'listo' ? filtrarPedidos(pedidos.datos, { estado, q }) : []
  const contadores = pedidos.estado === 'listo' ? contarPorEstado(pedidos.datos, q) : undefined
  const contador = esperando
    ? 'Buscando…'
    : `${lista.length === 1 ? '1 pedido' : `${lista.length} pedidos`}${q !== '' ? ` para «${q}»` : ''}`
  const vacio = textoVacioPedidos(estado, q)

  return (
    <div className="pb-6">
      <div className="px-4 pt-3.5 pb-1.5 lg:px-8">
        <BuscadorConEspera
          valor={q}
          onBuscar={(valor) => {
            actualizar({ q: valor })
          }}
          onEsperando={setEsperando}
          placeholder="Cliente o nº de pedido"
          ariaLabel="Buscar pedidos por cliente o número"
          className="mb-3 lg:max-w-[520px]"
        />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
          {FILTROS_PEDIDOS.map((f) => (
            <button
              key={f.valor}
              type="button"
              aria-pressed={estado === f.valor}
              className={cn(claseChip, 'min-h-11 flex-none', estado === f.valor && claseChipActiva)}
              onClick={() => {
                actualizar({ estado: f.valor })
              }}
            >
              {f.texto}
              {contadores !== undefined && (
                <span
                  className={cn(
                    'text-xs tabular-nums',
                    estado === f.valor ? 'text-texto-chip-activo' : 'text-texto-suave',
                  )}
                >
                  {contadores[f.valor]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {pedidos.estado === 'cargando' && (
        <p className="m-0 px-4 pt-0.5 pb-2.5 text-[13px] text-texto-suave lg:px-8" aria-live="polite">
          Cargando pedidos…
        </p>
      )}

      {pedidos.estado === 'error' && (
        <div role="alert" className="mx-4 my-4 flex flex-col items-start gap-3 lg:mx-8">
          <p className="m-0 text-sm text-peligro">
            {pedidos.error instanceof ErrorServicio ? pedidos.error.message : MENSAJE_GENERICO}
          </p>
          <Button variant="ghost" size="sm" onClick={pedidos.recargar}>
            Reintentar
          </Button>
        </div>
      )}

      {pedidos.estado === 'listo' && (
        <>
          <p className="m-0 px-4 pt-0.5 pb-2.5 text-[13px] text-texto-suave lg:px-8" aria-live="polite">
            {contador}
          </p>
          {lista.length > 0 ? (
            <div className="mx-4 mb-6 overflow-hidden rounded-tarjeta border border-borde bg-white lg:mx-8">
              {lista.map((p) => (
                <FilaPedido key={p.id} pedido={p} />
              ))}
            </div>
          ) : (
            <div className="mx-4 my-4 flex flex-col items-center gap-2 rounded-input border border-dashed border-borde-fuerte px-5 py-7 text-center lg:mx-8">
              <p className="m-0 font-display text-[19px] font-semibold tracking-[-0.01em]">{vacio.titulo}</p>
              <p className="m-0 max-w-[290px] text-sm text-texto-suave">{vacio.texto}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
