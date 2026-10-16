import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import type { ProblemaCarrito } from '@/types/dominio'

type Props = {
  problemas: ProblemaCarrito[]
  onAjustar: () => void
}

/** "Antes de confirmar, corregí tu carrito" (prototipo: `.alert` en `c.isCheckout`). */
export function AlertaStock({ problemas, onAjustar }: Props) {
  return (
    <div
      role="alert"
      className="mt-[18px] rounded-alerta border border-peligro-borde bg-peligro-fondo p-4 text-sm text-peligro-texto"
    >
      <p className="m-0 text-[15px] font-bold">Antes de confirmar, corregí tu carrito</p>
      <ul className="mt-2 mb-0 pl-[18px]">
        {problemas.map((p) => (
          <li key={p.productoId} className="mt-1">
            {p.texto}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" onClick={onAjustar}>
          Ajustar al stock disponible
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to="/carrito">Ir al carrito</Link>
        </Button>
      </div>
    </div>
  )
}
