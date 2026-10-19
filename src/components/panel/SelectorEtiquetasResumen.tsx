import { useState } from 'react'
import { claseLink } from '@/components/estilos'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { plural } from '@/lib/resumen'
import { ErrorServicio, MENSAJE_GENERICO } from '@/services/errores'
import { guardarEtiquetasSeguidas } from '@/services/resumen'
import type { StockEtiqueta } from '@/types/dominio'

type Props = {
  etiquetas: StockEtiqueta[]
  /** Después de guardar, relee el Resumen. */
  onGuardado: () => void
}

/** "Elegir etiquetas" y su modal, para elegir qué etiquetas se siguen en "Por etiqueta" (D-43, D-44). */
export function SelectorEtiquetasResumen({ etiquetas, onGuardado }: Props) {
  const [abierto, setAbierto] = useState(false)
  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      {/* Con el disparador, Radix devuelve el foco al botón al cerrar. */}
      <DialogTrigger className={`${claseLink} flex items-center`}>Elegir etiquetas</DialogTrigger>
      {/* El contenido se monta al abrir, así cada vez arranca con las seguidas guardadas. */}
      <DialogContent>
        <Contenido
          etiquetas={etiquetas}
          onCerrar={() => {
            setAbierto(false)
          }}
          onGuardado={() => {
            setAbierto(false)
            onGuardado()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function Contenido({ etiquetas, onCerrar, onGuardado }: Props & { onCerrar: () => void }) {
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
    <>
      <div className="flex flex-col gap-1 px-5 pt-5 pr-14 pb-3">
        <DialogTitle>Etiquetas del resumen</DialogTitle>
        <DialogDescription>Marcá las que querés seguir. Si no marcás ninguna, se muestran todas.</DialogDescription>
      </div>

      <div className="flex items-center justify-between gap-3 border-y border-divisor px-5 py-1">
        <span className="text-[12.5px] text-texto-suave tabular-nums">
          {marcadas.size} de {etiquetas.length} marcadas
        </span>
        <span className="flex gap-2">
          {marcadas.size < etiquetas.length && (
            <button
              type="button"
              className={claseLink}
              onClick={() => {
                setMarcadas(new Set(etiquetas.map((e) => e.id)))
              }}
            >
              Marcar todas
            </button>
          )}
          {marcadas.size > 0 && (
            <button
              type="button"
              className={claseLink}
              onClick={() => {
                setMarcadas(new Set())
              }}
            >
              Desmarcar todas
            </button>
          )}
        </span>
      </div>

      <ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-0">
        {ordenadas.map((e) => (
          <li key={e.id} className="border-b border-divisor last:border-b-0">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 px-5 py-2 hover:bg-fila-hover">
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
        <p role="alert" className="m-0 border-t border-divisor px-5 pt-2.5 text-sm text-peligro">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 border-t border-divisor px-5 py-3">
        <Button variant="ghost" size="sm" disabled={guardando} onClick={onCerrar}>
          Cancelar
        </Button>
        <Button size="sm" disabled={guardando} onClick={() => void guardar()}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </>
  )
}
