import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { formatearPrecio } from '@/lib/formato'

type Props = {
  to: string
  texto: string
  total: number
}

/**
 * Barra fija abajo en móvil (prototipo: `.bar` + `.btn.split`): "Ver carrito · 3 piezas" en el
 * catálogo y "Continuar" en el carrito, con el total a la derecha. En escritorio no se muestra.
 */
export function BarraCarrito({ to, texto, total }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[5] flex min-h-20 items-center border-t border-borde bg-crema px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))] lg:hidden">
      <Button asChild className="justify-between">
        <Link to={to}>
          <span>{texto}</span>
          <span className="tabular-nums">{formatearPrecio(total)}</span>
        </Link>
      </Button>
    </div>
  )
}
