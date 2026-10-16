import { clasePill } from '@/components/panel/PillStock'
import { TEXTO_ESTADO } from '@/lib/pedidos'
import { cn } from '@/lib/utils'
import type { EstadoPedido } from '@/types/dominio'

const COLORES: Record<EstadoPedido, string> = {
  pendiente: 'bg-pill-pendiente text-pill-pendiente-texto',
  vendido: 'bg-pill-vendido text-pill-vendido-texto',
  cancelado: 'bg-pill-cancelado text-pill-cancelado-texto',
}

/** Estado del pedido (prototipo: `.pill.pendiente/.vendido/.cancelado`). */
export function PillEstado({ estado }: { estado: EstadoPedido }) {
  return <span className={cn(clasePill, COLORES[estado])}>{TEXTO_ESTADO[estado]}</span>
}
