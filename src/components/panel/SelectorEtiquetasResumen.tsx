import { useState } from 'react'
import { claseLink } from '@/components/estilos'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import { plural } from '@/lib/resumen'
import { ErrorServicio, MENSAJE_GENERICO } from '@/services/errores'
import { guardarEtiquetasSeguidas } from '@/services/resumen'
import type { StockEtiqueta } from '@/types/dominio'

type Props = {
  etiquetas: StockEtiqueta[]
  onCancelar: () => void
  onGuardado: () => void
}

/** Elegir qué etiquetas se siguen en "Por etiqueta", en el lugar y sin modal (D-43). */
export function SelectorEtiquetasResumen({ etiquetas, onCancelar, onGuardado }: Props) {
  const { mostrarToast } = useToast()
  const [marcadas, setMarcadas] = useState(() => new Set(etiquetas.filter((e) => e.seguida).map((e) => e.id)))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const ordenadas = [...etiquetas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  function alternar(id: string) {
    setMarcadas((previas) => {
      const nuevas = new Set(previas)
      if (!nuevas.delete(id)) nuevas.add(id)
      return nuevas
    })
  }

  async function guardar() {
    setGuardando(true)
    setError(undefined)
    try {
      await guardarEtiquetasSeguidas([...marcadas])
      mostrarToast(
        marcadas.size === 0 ? 'Listo: el resumen muestra todas las etiquetas.' : 'Guardamos las etiquetas del resumen.',
      )
      onGuardado()
    } catch (e) {
      setError(e instanceof ErrorServicio ? e.message : MENSAJE_GENERICO)
      setGuardando(false)
    }
  }

  return (
    <fieldset className="m-0 mx-4 mb-2 min-w-0 rounded-tarjeta border border-borde bg-white p-0 lg:mx-8">
      <legend className="sr-only">Etiquetas del resumen</legend>
      <div className="flex items-center justify-between gap-3 border-b border-divisor px-3.5 py-2.5">
        <p className="m-0 text-[13px] leading-[1.45] text-texto-suave">
          Marcá las que querés seguir. Si no marcás ninguna, se muestran todas.
        </p>
        {marcadas.size > 0 && (
          <button
            type="button"
            className={`${claseLink} flex-none`}
            onClick={() => {
              setMarcadas(new Set())
            }}
          >
            Desmarcar todas
          </button>
        )}
      </div>
      <ul className="m-0 list-none p-0">
        {ordenadas.map((e) => (
          <li key={e.id} className="border-b border-divisor last:border-b-0">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3.5 py-2 hover:bg-fila-hover">
              <input
                type="checkbox"
                className="size-5 flex-none accent-tinta"
                checked={marcadas.has(e.id)}
                onChange={() => {
                  alternar(e.id)
                }}
              />
              <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{e.nombre}</span>
              <span className="flex-none text-[12.5px] text-texto-suave tabular-nums">
                {plural(e.productos, 'producto', 'productos')}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {error !== undefined && (
        <p role="alert" className="m-0 border-t border-divisor px-3.5 pt-2.5 text-sm text-peligro">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 border-t border-divisor px-3.5 py-2.5">
        <Button variant="ghost" size="sm" disabled={guardando} onClick={onCancelar}>
          Cancelar
        </Button>
        <Button size="sm" disabled={guardando} onClick={() => void guardar()}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </fieldset>
  )
}
