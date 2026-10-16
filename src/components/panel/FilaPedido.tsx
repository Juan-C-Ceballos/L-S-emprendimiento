import { Link } from 'react-router'
import { PillEstado } from '@/components/panel/PillEstado'
import { formatearFechaCorta, formatearNumeroPedido, formatearPrecio } from '@/lib/formato'
import { TEXTO_ESTADO } from '@/lib/pedidos'
import type { PedidoResumen } from '@/types/dominio'

/** Fila de la lista de pedidos (prototipo: `.row`, `orow`). */
export function FilaPedido({ pedido }: { pedido: PedidoResumen }) {
  const numero = formatearNumeroPedido(pedido.numero)
  return (
    <Link
      to={`/admin/pedidos/${pedido.numero}`}
      aria-label={`Pedido ${numero} de ${pedido.cliente}, ${TEXTO_ESTADO[pedido.estado]}`}
      className="flex min-h-[68px] w-full items-center gap-3 border-b border-divisor bg-white px-3.5 py-3 text-left text-tinta no-underline last:border-b-0 hover:bg-fila-hover"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-[15px] font-semibold">
          {numero} · {pedido.cliente}
        </span>
        <span className="text-[12.5px] text-texto-suave tabular-nums">{pedido.telefono}</span>
        <span className="text-[12.5px] text-texto-suave tabular-nums">{formatearFechaCorta(pedido.creadoEn)}</span>
      </span>
      <span className="flex flex-none flex-col items-end gap-[5px]">
        <span className="font-bold tabular-nums">{formatearPrecio(pedido.total)}</span>
        <PillEstado estado={pedido.estado} />
      </span>
    </Link>
  )
}
