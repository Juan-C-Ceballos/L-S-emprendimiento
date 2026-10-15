import { useParams } from 'react-router'
import { TituloPagina } from '@/components/TituloPagina'
import { formatearNumeroPedido } from '@/lib/formato'

export function PedidoDetallePage() {
  const { numero } = useParams()
  const n = Number(numero)
  return (
    <TituloPagina>
      {Number.isInteger(n) && n > 0 ? `Pedido ${formatearNumeroPedido(n)}` : 'Pedido'}
    </TituloPagina>
  )
}
