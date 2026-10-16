import { STOCK_BAJO } from '@/lib/constantes'

/** Aviso de stock del detalle (prototipo: `.note.low` / `.note.out`). Nada si hay más de 3. */
export function NotaStock({ stock }: { stock: number }) {
  if (stock <= 0) {
    return <p className="mt-3.5 mb-0 text-[13px] font-semibold text-peligro">Esta pieza está agotada por ahora.</p>
  }
  if (stock > STOCK_BAJO) return null
  return (
    <p className="mt-3.5 mb-0 text-[13px] font-semibold text-aviso">
      {stock === 1 ? 'Última unidad disponible' : `Últimas ${stock} unidades`}
    </p>
  )
}
