import { Link } from 'react-router'
import { escribirFiltrosEnURL, SIN_FILTROS } from '@/lib/filtros'

/** Etiquetas del detalle (prototipo: `.tagrow` + `.tg`): llevan al catálogo filtrado por esa sola. */
export function EtiquetasProducto({ etiquetas }: { etiquetas: string[] }) {
  if (etiquetas.length === 0) return null
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {etiquetas.map((e) => (
        <Link
          key={e}
          to={`/?${escribirFiltrosEnURL({ ...SIN_FILTROS, etiquetas: [e] })}`}
          aria-label={`Ver más piezas con la etiqueta ${e}`}
          // 34 px de alto como el prototipo; el ::before agranda la zona táctil a 44 px.
          className="relative inline-flex min-h-[34px] items-center rounded-full border border-borde-chip px-3 text-[13px] text-icono-suave no-underline transition-colors before:absolute before:inset-x-0 before:-inset-y-[5px] hover:border-tinta hover:text-icono-suave"
        >
          {e}
        </Link>
      ))}
    </div>
  )
}
