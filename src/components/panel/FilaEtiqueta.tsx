import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalizarEtiqueta } from '@/lib/formato'
import type { EtiquetaAdmin } from '@/types/dominio'

const claseMini =
  'flex size-11 flex-none items-center justify-center rounded-lg text-icono-suave transition-colors hover:bg-champan-suave disabled:cursor-not-allowed disabled:text-icono-off disabled:hover:bg-transparent'
const claseHint = 'text-[13px] leading-[1.45] text-texto-suave'

export type ModoFila = 'normal' | 'editando' | 'eliminando'

type Props = {
  etiqueta: EtiquetaAdmin
  modo: ModoFila
  /** Nombres de las demás etiquetas, para avisar que al guardar se unen. */
  otras: string[]
  procesando: boolean
  onModo: (modo: ModoFila) => void
  /** Devuelve un error para mostrar, o nada si salió bien. */
  onRenombrar: (nombre: string) => Promise<string | undefined>
  onEliminar: () => void
}

function textoProductos(n: number): string {
  return n === 1 ? '1 producto' : `${n} productos`
}

/** Fila de Ajustes > Etiquetas (prototipo: `.trow`): renombrar en el lugar o eliminar con confirmación. */
export function FilaEtiqueta({ etiqueta, modo, otras, procesando, onModo, onRenombrar, onEliminar }: Props) {
  const [valor, setValor] = useState(etiqueta.nombre)
  const [error, setError] = useState<string | undefined>(undefined)
  const escrita = normalizarEtiqueta(valor)
  const seUne = escrita !== '' && escrita !== etiqueta.nombre && otras.includes(escrita)
  const idCampo = `etiqueta-${etiqueta.id}`

  async function guardar() {
    if (escrita === '') {
      setError('Escribí un nombre para la etiqueta.')
      return
    }
    setError(await onRenombrar(valor))
  }

  if (modo === 'editando') {
    return (
      <li className="border-b border-divisor py-2.5 pr-2 pl-3.5 last:border-b-0">
        <div className="mt-1 flex flex-col gap-1.5">
          <Label htmlFor={idCampo}>Renombrar «{etiqueta.nombre}»</Label>
          <Input
            id={idCampo}
            autoFocus
            value={valor}
            aria-invalid={error !== undefined}
            aria-describedby={error !== undefined || seUne ? `${idCampo}-ayuda` : undefined}
            onChange={(e) => {
              setValor(e.target.value)
              setError(undefined)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void guardar()
              } else if (e.key === 'Escape') {
                onModo('normal')
              }
            }}
          />
          {error !== undefined ? (
            <span id={`${idCampo}-ayuda`} className="text-[13px] font-semibold text-peligro">
              {error}
            </span>
          ) : (
            seUne && (
              <span id={`${idCampo}-ayuda`} className={claseHint}>
                Ya existe «{escrita}»: al guardar se unen las dos.
              </span>
            )
          )}
        </div>
        <div className="mt-2 mb-1 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={procesando}
            onClick={() => {
              onModo('normal')
            }}
          >
            Cancelar
          </Button>
          <Button size="sm" disabled={procesando} onClick={() => void guardar()}>
            {procesando ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </li>
    )
  }

  if (modo === 'eliminando') {
    return (
      <li
        role="alertdialog"
        aria-label={`¿Eliminar «${etiqueta.nombre}»?`}
        className="border-b border-divisor py-2.5 pr-2 pl-3.5 last:border-b-0"
      >
        <p className="m-0 text-[15px] font-bold">¿Eliminar «{etiqueta.nombre}»?</p>
        <p className={`${claseHint} mt-0.5 mb-0`}>
          {etiqueta.usos > 0
            ? `Se va a quitar de ${textoProductos(etiqueta.usos)}. Los productos no se borran.`
            : 'Ningún producto la usa.'}
        </p>
        <div className="mt-2 mb-1 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={procesando}
            onClick={() => {
              onModo('normal')
            }}
          >
            No
          </Button>
          <Button variant="dangerSolid" size="sm" disabled={procesando} onClick={onEliminar}>
            {procesando ? 'Eliminando…' : 'Sí, eliminar'}
          </Button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex min-h-14 items-center gap-0.5 border-b border-divisor py-1 pr-1.5 pl-3.5 last:border-b-0">
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-[15px] font-semibold">{etiqueta.nombre}</span>
        <span className="text-[12.5px] text-texto-suave tabular-nums">{textoProductos(etiqueta.usos)}</span>
      </span>
      <button
        type="button"
        aria-label={`Renombrar etiqueta ${etiqueta.nombre}`}
        className={claseMini}
        disabled={procesando}
        onClick={() => {
          onModo('editando')
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 20h4L19 9l-4-4L4 16v4z" />
          <path d="M13.5 6.5l4 4" />
        </svg>
      </button>
      <button
        type="button"
        aria-label={`Eliminar etiqueta ${etiqueta.nombre}`}
        className={claseMini}
        disabled={procesando}
        onClick={() => {
          onModo('eliminando')
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 7h14" />
          <path d="M10 7V5h4v2" />
          <path d="M7 7l1 13h8l1-13" />
        </svg>
      </button>
    </li>
  )
}
