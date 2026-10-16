import { estadoStock } from '@/lib/productos'
import { cn } from '@/lib/utils'

export const clasePill = 'rounded-full px-2 py-1 text-[11px] leading-[1.1] font-bold whitespace-nowrap'

const COLORES = {
  agotado: 'bg-pill-agotado text-pill-agotado-texto',
  bajo: 'bg-pill-pendiente text-pill-pendiente-texto',
  ok: 'bg-pill-ok text-pill-ok-texto',
} as const

/** "Agotado" / "Quedan N" / "N en stock" (prototipo: `.pill.out/.low/.ok`). */
export function PillStock({ stock }: { stock: number }) {
  const { texto, tipo } = estadoStock(stock)
  return <span className={cn(clasePill, COLORES[tipo])}>{texto}</span>
}

export function PillInactivo() {
  return <span className={cn(clasePill, 'bg-pill-cancelado text-pill-cancelado-texto')}>Inactivo</span>
}
