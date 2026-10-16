import { useRef, useState } from 'react'
import { claseBadge } from '@/components/catalogo/TarjetaProducto'
import { cn } from '@/lib/utils'
import type { ImagenProducto } from '@/types/dominio'

type Props = {
  imagenes: ImagenProducto[]
  nombre: string
  agotado: boolean
}

/**
 * Galería del detalle (prototipo: `.gal`, `.gc`, `.dots`): scroll horizontal con snap para el
 * dedo, contador "1 / 3" y puntos navegables. Usa la imagen de detalle (1600 px).
 */
export function Galeria({ imagenes, nombre, agotado }: Props) {
  const carril = useRef<HTMLDivElement>(null)
  const [indice, setIndice] = useState(0)
  const total = imagenes.length
  const varias = total > 1

  function ir(i: number) {
    const el = carril.current
    if (el !== null) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
    setIndice(i)
  }

  return (
    <div>
      <div className="relative">
        <div
          ref={carril}
          aria-label="Fotos del producto"
          className="flex snap-x snap-mandatory overflow-x-auto bg-img-fondo [scrollbar-width:none] lg:rounded-[4px] [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => {
            const el = e.currentTarget
            if (el.clientWidth === 0) return
            const i = Math.min(total - 1, Math.round(el.scrollLeft / el.clientWidth))
            if (i !== indice) setIndice(i)
          }}
        >
          {total === 0 && <div className="aspect-[1/1.1] w-full flex-none lg:aspect-square" />}
          {imagenes.map((img, i) => (
            <div key={img.id} className="relative aspect-[1/1.1] w-full flex-none snap-start lg:aspect-square">
              <img
                src={img.url}
                alt={varias ? `${nombre}, foto ${i + 1} de ${total}` : nombre}
                width={1600}
                height={1760}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className={cn('absolute inset-0 size-full object-cover', agotado && 'opacity-55 grayscale-[0.7]')}
              />
            </div>
          ))}
        </div>
        {varias && (
          <span className="absolute top-3 right-3 rounded-full bg-white/88 px-[9px] py-1 text-xs font-bold tabular-nums">
            {indice + 1} / {total}
          </span>
        )}
        {agotado && <span className={claseBadge}>Agotado</span>}
      </div>
      {varias && (
        <div className="flex justify-center pt-0.5">
          {imagenes.map((img, i) => (
            <button
              key={img.id}
              type="button"
              aria-label={`Ver foto ${i + 1} de ${total}`}
              aria-current={i === indice ? 'true' : undefined}
              className="flex h-11 w-9 items-center justify-center p-0"
              onClick={() => {
                ir(i)
              }}
            >
              <span
                className={cn(
                  'block h-[7px] rounded-[4px] transition-[width] duration-200',
                  i === indice ? 'w-5 bg-tinta' : 'w-[7px] bg-borde-fuerte',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
