import { useState } from 'react'
import { claseChip } from '@/components/estilos'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalizarEtiqueta } from '@/lib/formato'
import { sugerirEtiquetas } from '@/lib/productos'
import type { EtiquetaConUso } from '@/types/dominio'

type Props = {
  elegidas: string[]
  onCambiar: (etiquetas: string[]) => void
  /** Etiquetas existentes con su uso, para sugerir. */
  todas: EtiquetaConUso[]
}

/** Etiquetas del producto con autocompletado (prototipo: sección "Etiquetas" del formulario). */
export function EditorEtiquetas({ elegidas, onCambiar, todas }: Props) {
  const [texto, setTexto] = useState('')
  const buscado = normalizarEtiqueta(texto)
  const sugerencias = sugerirEtiquetas(todas, elegidas, texto)
  const sePuedeCrear =
    buscado !== '' && !todas.some((e) => e.nombre === buscado) && !elegidas.includes(buscado)

  function agregar(crudo: string) {
    const etiqueta = normalizarEtiqueta(crudo)
    setTexto('')
    if (etiqueta === '' || elegidas.includes(etiqueta)) return
    onCambiar([...elegidas, etiqueta.slice(0, 40)])
  }

  const pista =
    buscado === ''
      ? 'Etiquetas que ya usás:'
      : sugerencias.length > 0
        ? 'Sugerencias: tocá una o presioná Enter.'
        : 'No hay etiquetas parecidas. Podés crearla.'

  return (
    <div>
      {elegidas.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {elegidas.map((etiqueta) => (
            <button
              key={etiqueta}
              type="button"
              aria-label={`Quitar etiqueta ${etiqueta}`}
              className="inline-flex min-h-10 items-center gap-[7px] rounded-full border border-tinta bg-tinta px-[15px] text-sm font-medium text-white"
              onClick={() => {
                onCambiar(elegidas.filter((e) => e !== etiqueta))
              }}
            >
              {etiqueta}
              <svg
                width="14"
                height="14"
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
          ))}
        </div>
      ) : (
        <p className="m-0 mt-1.5 text-[13px] text-texto-suave">
          Sin etiquetas todavía. Sumá tipo y material para que se pueda filtrar.
        </p>
      )}

      <div className="mt-[18px] flex flex-col gap-1.5">
        <Label htmlFor="p-tag">Agregar etiqueta</Label>
        <Input
          id="p-tag"
          type="text"
          autoComplete="off"
          placeholder="Escribí: dorado, aros, perlas…"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            if (buscado === '') return
            const exacta = sugerencias.find((s) => s.nombre === buscado)
            const primera = sugerencias[0]
            agregar(exacta?.nombre ?? primera?.nombre ?? buscado)
          }}
        />
      </div>
      <p className="m-0 mt-2.5 text-[13px] text-texto-suave" aria-live="polite">
        {pista}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {sePuedeCrear && (
          <button
            type="button"
            className="inline-flex min-h-10 items-center rounded-full border border-dashed border-bronce px-[15px] text-sm font-medium text-bronce"
            onClick={() => {
              agregar(buscado)
            }}
          >
            Crear «{buscado}»
          </button>
        )}
        {sugerencias.map((s) => (
          <button
            key={s.nombre}
            type="button"
            className={claseChip}
            onClick={() => {
              agregar(s.nombre)
            }}
          >
            {s.nombre}
            <span className="text-xs text-texto-suave tabular-nums">{s.usos}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
