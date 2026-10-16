import type { CambioStock } from '@/types/dominio'

type Props = {
  tipo: 'vendido' | 'repuesto'
  cambios: CambioStock[]
}

/** Caja verde después de vender o cancelar un vendido (prototipo: `.okbox` + `.dl`). */
export function AvisoDelta({ tipo, cambios }: Props) {
  return (
    <div role="status" className="mb-4 rounded-alerta border border-ok-borde bg-ok-fondo px-4 py-3.5 text-sm text-ok-texto">
      <p className="m-0 text-[15px] font-bold">
        {tipo === 'vendido' ? 'Listo: se descontó el stock' : 'Listo: se repuso el stock'}
      </p>
      {cambios.map((c) => (
        <div key={c.productoId} className="mt-1.5 flex justify-between gap-3">
          <span>{c.nombre}</span>
          <b className="tabular-nums">
            {c.desde} → {c.hasta}
          </b>
        </div>
      ))}
    </div>
  )
}
