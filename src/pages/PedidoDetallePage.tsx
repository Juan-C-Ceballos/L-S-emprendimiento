import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import { AvisoDelta } from '@/components/panel/AvisoDelta'
import { ConfirmacionInline } from '@/components/panel/ConfirmacionInline'
import { PillEstado } from '@/components/panel/PillEstado'
import { useRefrescarPendientes } from '@/components/panel/usePanel'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import { formatearFechaCorta, formatearNumeroPedido, formatearPrecio } from '@/lib/formato'
import {
  faltantesDeStock,
  telefonoParaWhatsApp,
  textoConfirmacionCancelar,
  textoUnidades,
} from '@/lib/pedidos'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/utils'
import { ErrorServicio, MENSAJE_GENERICO } from '@/services/errores'
import { cancelarPedido, marcarVendido, obtenerPedido } from '@/services/pedidos'
import type { CambioStock, PedidoDetalle } from '@/types/dominio'

const claseTarjeta = 'my-3 mb-[18px] rounded-tarjeta border border-borde bg-white px-4 py-0.5'
const claseKv = 'flex min-h-12 items-center justify-between gap-3 border-b border-divisor text-sm'
const claseHint = 'm-0 text-[13px] leading-[1.45] text-texto-suave'
const claseLink = 'font-semibold text-bronce underline underline-offset-[3px] hover:text-bronce-hover'

type Delta = { pedidoId: string; tipo: 'vendido' | 'repuesto'; cambios: CambioStock[] }

function Detalle({ pedido, recargar }: { pedido: PedidoDetalle; recargar: () => void }) {
  const { mostrarToast } = useToast()
  const refrescarPendientes = useRefrescarPendientes()
  const [confirmando, setConfirmando] = useState(false)
  const [procesando, setProcesando] = useState<'vender' | 'cancelar' | null>(null)
  const [delta, setDelta] = useState<Delta | null>(null)

  const numero = formatearNumeroPedido(pedido.numero)
  const pendiente = pedido.estado === 'pendiente'
  const faltantes = pendiente ? faltantesDeStock(pedido.items) : []
  const unidades = pedido.items.reduce((total, i) => total + i.cantidad, 0)
  const deltaVigente = delta?.pedidoId === pedido.id ? delta : null

  async function accion(tipo: 'vender' | 'cancelar') {
    setProcesando(tipo)
    const estabaVendido = pedido.estado === 'vendido'
    try {
      if (tipo === 'vender') {
        const cambios = await marcarVendido(pedido.id)
        setDelta({ pedidoId: pedido.id, tipo: 'vendido', cambios })
        mostrarToast(`Pedido ${numero} vendido. Stock actualizado.`)
      } else {
        const cambios = await cancelarPedido(pedido.id)
        setDelta(estabaVendido ? { pedidoId: pedido.id, tipo: 'repuesto', cambios } : null)
        mostrarToast(`Pedido ${numero} cancelado.${estabaVendido ? ' Stock repuesto.' : ''}`)
      }
    } catch (e) {
      // Otra pestaña ya lo cambió, o el stock bajó: se avisa y se recarga lo que hay en la base.
      mostrarToast(e instanceof ErrorServicio ? e.message : MENSAJE_GENERICO)
    }
    setConfirmando(false)
    setProcesando(null)
    recargar()
    refrescarPendientes()
  }

  return (
    <div className="mx-auto max-w-[720px] px-5 pt-[18px] pb-8 lg:max-w-[760px] lg:px-8 lg:pt-8 lg:pb-12">
      <div className="flex items-center gap-2.5">
        <span className="font-display text-[30px] font-semibold tracking-[-0.02em] tabular-nums">{numero}</span>
        <PillEstado estado={pedido.estado} />
      </div>
      <p className="mt-1 mb-0 text-[12.5px] text-texto-suave tabular-nums">
        Recibido el {formatearFechaCorta(pedido.creadoEn)}
      </p>

      <div className={claseTarjeta}>
        <div className={claseKv}>
          <span className="text-texto-suave">Cliente</span>
          <strong>{pedido.cliente}</strong>
        </div>
        <div className={cn(claseKv, 'border-b-0')}>
          <span className="text-texto-suave">Teléfono</span>
          <span className="flex flex-wrap items-center justify-end gap-x-3 text-right">
            <a href={`tel:${pedido.telefono.replace(/[^\d+]/g, '')}`} className="flex min-h-11 items-center font-bold text-tinta">
              {pedido.telefono}
            </a>
            <a
              href={`https://wa.me/${telefonoParaWhatsApp(pedido.telefono)}`}
              target="_blank"
              rel="noopener"
              className={cn(claseLink, 'flex min-h-11 items-center text-[13px]')}
            >
              Escribir por WhatsApp
            </a>
          </span>
        </div>
      </div>

      <h2 className="m-0 mb-1 font-display text-lg font-semibold">Ítems</h2>
      <div className={claseTarjeta}>
        <ul className="m-0 list-none p-0">
          {pedido.items.map((item) => {
            const falta = pendiente && item.stockActual < item.cantidad
            return (
              <li key={item.productoId} className="flex items-start gap-3 border-b border-divisor py-3.5">
                <span className="relative block h-[58px] w-12 flex-none overflow-hidden rounded-imagen bg-img-fondo">
                  {item.miniaturaUrl !== null && (
                    <img
                      src={item.miniaturaUrl}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover"
                    />
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px] leading-[1.3] font-semibold">
                    {item.cantidad} × {item.nombre}
                  </span>
                  <span className="text-[13px] text-texto-suave">
                    {formatearPrecio(item.precioUnitario)} c/u al momento del pedido
                  </span>
                  {item.precioActual !== item.precioUnitario && (
                    <span className="text-[13px] text-texto-suave">
                      Precio actual: {formatearPrecio(item.precioActual)}
                    </span>
                  )}
                  <span className={cn('text-[13px]', falta ? 'font-semibold text-peligro' : 'text-texto-suave')}>
                    Stock actual: {item.stockActual}
                  </span>
                </div>
                <span className="font-bold whitespace-nowrap tabular-nums">{formatearPrecio(item.subtotal)}</span>
              </li>
            )
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-[18px] pb-2 font-semibold">
          <span>Total</span>
          <span className="font-display text-[26px] font-semibold tabular-nums">{formatearPrecio(pedido.total)}</span>
        </div>
        <div className={cn(claseKv, 'min-h-9 border-b-0 pb-2')}>
          <span className="text-texto-suave">Ganancia estimada</span>
          <span className="font-semibold text-tinta tabular-nums">{formatearPrecio(pedido.ganancia)}</span>
        </div>
      </div>

      {deltaVigente !== null && <AvisoDelta tipo={deltaVigente.tipo} cambios={deltaVigente.cambios} />}

      {pendiente && (
        <>
          {faltantes.length > 0 && (
            <div
              role="alert"
              className="mb-3.5 rounded-alerta border border-peligro-borde bg-peligro-fondo p-4 text-sm text-peligro-texto"
            >
              <p className="m-0 text-[15px] font-bold">No alcanza el stock</p>
              <p className="mt-1 mb-0">
                No hay unidades suficientes de {faltantes.map((f) => f.nombre).join(', ')}. Actualizá el stock
                desde Productos o cancelá el pedido.
              </p>
            </div>
          )}
          <div className="flex">
            <Button
              disabled={faltantes.length > 0 || procesando !== null}
              onClick={() => void accion('vender')}
            >
              {procesando === 'vender' ? 'Marcando como vendido…' : 'Marcar como vendido'}
            </Button>
          </div>
          <p className={cn(claseHint, 'mt-2 mb-3.5 text-center')}>
            Descuenta {textoUnidades(unidades)} del stock en una sola acción.
          </p>
        </>
      )}

      {pedido.estado === 'vendido' && (
        <p className={cn(claseHint, 'mb-3.5')}>
          {pedido.vendidoEn !== null ? `Vendido el ${formatearFechaCorta(pedido.vendidoEn)}` : 'Vendido'}. Si lo
          cancelás, el stock se repone.
        </p>
      )}

      {pedido.estado !== 'cancelado' &&
        (confirmando ? (
          <ConfirmacionInline
            titulo={`¿Cancelar el pedido ${numero}?`}
            texto={textoConfirmacionCancelar(pedido.estado, unidades)}
            confirmar="Sí, cancelar"
            confirmando="Cancelando…"
            procesando={procesando === 'cancelar'}
            onVolver={() => {
              setConfirmando(false)
            }}
            onConfirmar={() => void accion('cancelar')}
          />
        ) : (
          <div className="flex">
            <Button
              variant="danger"
              disabled={procesando !== null}
              onClick={() => {
                setConfirmando(true)
              }}
            >
              Cancelar pedido
            </Button>
          </div>
        ))}

      {pedido.estado === 'cancelado' && (
        <div className="rounded-tarjeta border border-borde bg-white px-4 py-3.5">
          <p className={claseHint}>Este pedido está cancelado. Un pedido cancelado no se puede volver a vender.</p>
        </div>
      )}
    </div>
  )
}

/** Detalle de un pedido (prototipo: `a.isOrder`). Después de cada acción se relee de la base. */
export function PedidoDetallePage() {
  const { numero = '' } = useParams()
  const n = Number(numero)
  const valido = Number.isInteger(n) && n > 0
  const cargar = useCallback(() => (valido ? obtenerPedido(n) : Promise.resolve(null)), [valido, n])
  const pedido = useAsync(cargar)
  // Al recargar después de vender o cancelar se sigue mostrando el pedido anterior (sin parpadeo).
  const [ultimo, setUltimo] = useState<PedidoDetalle | null | undefined>(undefined)
  if (pedido.estado === 'listo' && pedido.datos !== ultimo) setUltimo(pedido.datos)
  const datos = pedido.estado === 'listo' ? pedido.datos : ultimo

  if (pedido.estado === 'error' && datos === undefined) {
    return (
      <div role="alert" className="mx-5 my-6 flex flex-col items-start gap-3 lg:mx-8">
        <p className="m-0 text-sm text-peligro">
          {pedido.error instanceof ErrorServicio ? pedido.error.message : MENSAJE_GENERICO}
        </p>
        <Button variant="ghost" size="sm" onClick={pedido.recargar}>
          Reintentar
        </Button>
      </div>
    )
  }

  if (datos === undefined) {
    return (
      <p className={cn(claseHint, 'px-5 pt-6 lg:px-8')} aria-live="polite">
        Cargando el pedido…
      </p>
    )
  }

  if (datos === null) {
    return (
      <div className="mx-5 my-6 flex flex-col items-center gap-2 rounded-input border border-dashed border-borde-fuerte px-5 py-7 text-center lg:mx-8">
        <p className="m-0 font-display text-[19px] font-semibold">No encontramos este pedido</p>
        <Link to="/admin/pedidos" className={cn(claseLink, 'flex min-h-11 items-center text-sm')}>
          Ver pedidos
        </Link>
      </div>
    )
  }

  return <Detalle key={datos.id} pedido={datos} recargar={pedido.recargar} />
}
