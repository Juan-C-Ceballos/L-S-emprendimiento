import { useState } from 'react'
import { BuscadorConEspera } from '@/components/BuscadorConEspera'
import { ChipEtiqueta } from '@/components/catalogo/ChipEtiqueta'
import { SelectorModo } from '@/components/catalogo/SelectorModo'
import { SelectPildora } from '@/components/catalogo/SelectPildora'
import { claseBotonIcono, claseLink } from '@/components/estilos'
import { Input } from '@/components/ui/input'
import {
  contarEtiquetas,
  etiquetaParaEnter,
  hayFiltros,
  ORDENES,
  SIN_FILTROS,
  type FiltrosCatalogo as Filtros,
} from '@/lib/filtros'
import { cn } from '@/lib/utils'
import type { ProductoVidriera } from '@/types/dominio'

/** Chips de etiquetas visibles en el teléfono antes de "Ver todas" (D-40). */
export const LIMITE_CHIPS_MOVIL = 8

type Props = {
  filtros: Filtros
  productos: ProductoVidriera[]
  etiquetasUsadas: string[]
  /** `reemplazar`: la búsqueda por nombre no llena el historial; chips y modo sí. */
  onCambiar: (filtros: Filtros, opciones: { reemplazar: boolean }) => void
  onEsperando: (esperando: boolean) => void
  /** Texto del buscador de etiquetas (lo guarda la página para que "Limpiar filtros" lo borre). */
  buscada: string
  onBuscada: (texto: string) => void
  textoResultado: string
  className?: string
}

/** Panel de búsqueda y filtros del catálogo (prototipo: `.fl`). */
export function FiltrosCatalogo({
  filtros,
  productos,
  etiquetasUsadas,
  onCambiar,
  onEsperando,
  buscada,
  onBuscada: setBuscada,
  textoResultado,
  className,
}: Props) {
  const disponibles = contarEtiquetas(productos, etiquetasUsadas, filtros, buscada)
  const [verTodas, setVerTodas] = useState(false)
  // Mientras se busca una etiqueta se muestran todas las que coinciden.
  const recortar = !verTodas && buscada.trim() === ''

  function alternar(etiqueta: string) {
    const etiquetas = filtros.etiquetas.includes(etiqueta)
      ? filtros.etiquetas.filter((e) => e !== etiqueta)
      : [...filtros.etiquetas, etiqueta]
    onCambiar({ ...filtros, etiquetas }, { reemplazar: false })
  }

  function elegir(etiqueta: string) {
    alternar(etiqueta)
    setBuscada('')
  }

  return (
    <section aria-label="Buscar y filtrar" className={cn('px-5 pt-[22px]', className)}>
      <BuscadorConEspera
        valor={filtros.q}
        onBuscar={(q) => {
          onCambiar({ ...filtros, q }, { reemplazar: true })
        }}
        onEsperando={onEsperando}
        placeholder="Buscar por nombre"
        ariaLabel="Buscar piezas por nombre"
      />

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-[13px] font-bold text-tinta">Ordenar</span>
        <SelectPildora
          ariaLabel="Ordenar las piezas"
          valor={filtros.orden}
          opciones={ORDENES}
          onCambiar={(orden) => {
            onCambiar({ ...filtros, orden }, { reemplazar: false })
          }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[13px] font-bold text-tinta">Etiquetas</span>
        <SelectorModo
          modo={filtros.modo}
          onCambiar={(modo) => {
            onCambiar({ ...filtros, modo }, { reemplazar: false })
          }}
        />
      </div>

      {filtros.etiquetas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filtros.etiquetas.map((e) => (
            <ChipEtiqueta
              key={e}
              tipo="elegida"
              nombre={e}
              onClick={() => {
                alternar(e)
              }}
            />
          ))}
        </div>
      )}

      <div className="relative mt-3">
        <span className="pointer-events-none absolute top-1/2 left-3.5 flex -translate-y-1/2 text-texto-suave">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4 4" />
          </svg>
        </span>
        <Input
          type="text"
          value={buscada}
          placeholder="Buscar etiqueta: dorado, aros…"
          aria-label="Buscar etiqueta para filtrar"
          enterKeyHint="done"
          className="min-h-11 pr-[46px] pl-[42px]"
          onChange={(e) => {
            setBuscada(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            const etiqueta = etiquetaParaEnter(disponibles, buscada)
            if (etiqueta !== undefined) elegir(etiqueta)
          }}
        />
        {buscada !== '' && (
          <button
            type="button"
            aria-label="Borrar etiqueta buscada"
            className={cn(claseBotonIcono, 'absolute top-0 right-[3px]')}
            onClick={() => {
              setBuscada('')
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      {disponibles.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-2">
          {disponibles.map((c, i) => (
            <ChipEtiqueta
              key={c.nombre}
              tipo="disponible"
              nombre={c.nombre}
              cantidad={c.cantidad}
              // En el teléfono se ven las primeras; en escritorio, todas.
              className={recortar && i >= LIMITE_CHIPS_MOVIL ? 'hidden lg:inline-flex' : undefined}
              onClick={() => {
                elegir(c.nombre)
              }}
            />
          ))}
        </div>
      )}
      {buscada.trim() === '' && disponibles.length > LIMITE_CHIPS_MOVIL && (
        <button
          type="button"
          aria-expanded={verTodas}
          className={cn(claseLink, 'mt-1 lg:hidden')}
          onClick={() => {
            setVerTodas((v) => !v)
          }}
        >
          {verTodas ? 'Ver menos' : `Ver todas (${disponibles.length})`}
        </button>
      )}
      {buscada.trim() !== '' && disponibles.length === 0 && (
        <p className="mt-2 mb-0 text-[13px] leading-[1.45] text-texto-suave">
          No hay otras etiquetas que coincidan con «{buscada.trim()}».
        </p>
      )}

      <div className="mt-2.5 flex min-h-11 items-center justify-between text-[13px] text-texto-suave">
        <span aria-live="polite">{textoResultado}</span>
        {hayFiltros(filtros) && (
          <button
            type="button"
            className={claseLink}
            onClick={() => {
              // El orden no es un filtro: se conserva.
              onCambiar({ ...SIN_FILTROS, orden: filtros.orden }, { reemplazar: false })
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </section>
  )
}
