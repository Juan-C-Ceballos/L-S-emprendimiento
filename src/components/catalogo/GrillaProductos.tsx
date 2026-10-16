import { TarjetaProducto } from '@/components/catalogo/TarjetaProducto'
import type { ProductoVidriera } from '@/types/dominio'

const claseGrilla =
  'm-0 grid list-none grid-cols-2 gap-x-3 gap-y-[26px] px-4 pt-1.5 pb-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-10 lg:px-0 lg:pt-3 lg:pb-0'

/** Cuántas tarjetas cargan la foto sin esperar (la primera fila en escritorio). */
const PRIORITARIAS = 4

/** Grilla del catálogo (prototipo: `.grid`): 2 columnas, 3 en `md`, 4 en `lg` (D-12). */
export function GrillaProductos({ productos }: { productos: ProductoVidriera[] }) {
  return (
    <ul className={claseGrilla}>
      {productos.map((p, i) => (
        <li key={p.id}>
          <TarjetaProducto producto={p} prioritaria={i < PRIORITARIAS} />
        </li>
      ))}
    </ul>
  )
}

/** Esqueleto mientras carga la vidriera. */
export function GrillaCargando() {
  return (
    <div className={claseGrilla} aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex flex-col gap-1">
          <span className="mb-2 block aspect-[4/5] animate-pulse rounded-imagen bg-img-fondo" />
          <span className="block h-[18px] w-3/4 animate-pulse rounded-sm bg-img-fondo" />
          <span className="block h-[18px] w-1/3 animate-pulse rounded-sm bg-img-fondo" />
        </div>
      ))}
    </div>
  )
}
