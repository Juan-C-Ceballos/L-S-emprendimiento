import { useState, type SubmitEvent } from 'react'
import { FilaEtiqueta, type ModoFila } from '@/components/panel/FilaEtiqueta'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalizarEtiqueta } from '@/lib/formato'
import { useAsync } from '@/lib/useAsync'
import { ErrorServicio, MENSAJE_GENERICO } from '@/services/errores'
import { crearEtiqueta, eliminarEtiqueta, listarEtiquetasAdmin, renombrarEtiqueta } from '@/services/etiquetas'

const claseHint = 'm-0 text-[13px] leading-[1.45] text-texto-suave'

function mensajeDe(e: unknown): string {
  return e instanceof ErrorServicio ? e.message : MENSAJE_GENERICO
}

/** Ajustes > Etiquetas (prototipo: `st.tags`): crear, renombrar (con unión) y eliminar. */
export function GestionEtiquetas() {
  const { mostrarToast } = useToast()
  const etiquetas = useAsync(listarEtiquetasAdmin)
  const [nueva, setNueva] = useState('')
  const [errorNueva, setErrorNueva] = useState<string | undefined>(undefined)
  const [fila, setFila] = useState<{ id: string; modo: ModoFila } | null>(null)
  const [procesando, setProcesando] = useState(false)

  // Mientras se relee después de un cambio, se sigue mostrando la lista anterior.
  const lista = etiquetas.estado === 'listo' ? etiquetas.datos : etiquetas.previos
  const nombres = lista?.map((e) => e.nombre) ?? []

  async function agregar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    const nombre = normalizarEtiqueta(nueva)
    if (nombre === '') {
      setErrorNueva('Escribí el nombre de la etiqueta.')
      return
    }
    if (nombres.includes(nombre)) {
      setErrorNueva(`«${nombre}» ya existe.`)
      return
    }
    setProcesando(true)
    try {
      const creada = await crearEtiqueta(nombre)
      setNueva('')
      mostrarToast(`Creaste «${creada}». Asignala desde cada producto.`)
      etiquetas.recargar()
    } catch (e) {
      setErrorNueva(mensajeDe(e))
    } finally {
      setProcesando(false)
    }
  }

  async function renombrar(id: string, anterior: string, valor: string): Promise<string | undefined> {
    setProcesando(true)
    try {
      const r = await renombrarEtiqueta(id, valor)
      const nombre = normalizarEtiqueta(valor)
      setFila(null)
      if (r.resultado === 'unida') mostrarToast(`Unimos «${anterior}» con «${nombre}».`)
      else if (r.resultado === 'renombrada') mostrarToast(`Renombraste «${anterior}» a «${nombre}».`)
      etiquetas.recargar()
      return undefined
    } catch (e) {
      return mensajeDe(e)
    } finally {
      setProcesando(false)
    }
  }

  async function eliminar(id: string, nombre: string) {
    setProcesando(true)
    try {
      await eliminarEtiqueta(id)
      mostrarToast(`Eliminaste la etiqueta «${nombre}».`)
    } catch (e) {
      mostrarToast(mensajeDe(e))
    } finally {
      setFila(null)
      setProcesando(false)
      etiquetas.recargar()
    }
  }

  return (
    <section className="pt-1.5 pb-[22px]">
      <h2 className="m-0 mb-1 font-display text-lg font-semibold">Etiquetas</h2>
      <p className={claseHint}>Renombrá o eliminá etiquetas: el cambio se aplica a todos los productos que la usan.</p>

      <form noValidate className="mt-[18px] flex flex-col gap-1.5" onSubmit={(e) => void agregar(e)}>
        <Label htmlFor="s-newtag">Nueva etiqueta</Label>
        <div className="flex gap-2">
          <Input
            id="s-newtag"
            placeholder="Ej. rosé"
            value={nueva}
            aria-invalid={errorNueva !== undefined}
            aria-describedby={errorNueva !== undefined ? 's-newtag-error' : undefined}
            onChange={(e) => {
              setNueva(e.target.value)
              setErrorNueva(undefined)
            }}
          />
          <Button type="submit" size="sm" className="min-h-[50px]" disabled={procesando}>
            Agregar
          </Button>
        </div>
        {errorNueva !== undefined && (
          <span id="s-newtag-error" className="text-[13px] font-semibold text-peligro">
            {errorNueva}
          </span>
        )}
      </form>

      {lista === undefined && etiquetas.estado === 'cargando' && (
        <p className={`${claseHint} mt-4`} aria-live="polite">
          Cargando las etiquetas…
        </p>
      )}
      {lista === undefined && etiquetas.estado === 'error' && (
        <div role="alert" className="mt-4 flex flex-col items-start gap-3">
          <p className="m-0 text-sm text-peligro">{mensajeDe(etiquetas.error)}</p>
          <Button variant="ghost" size="sm" onClick={etiquetas.recargar}>
            Reintentar
          </Button>
        </div>
      )}
      {lista !== undefined &&
        (lista.length === 0 ? (
          <p className={`${claseHint} mt-4`}>Todavía no hay etiquetas. Creá la primera arriba o desde un producto.</p>
        ) : (
          <ul className="mt-4 mb-0 list-none overflow-hidden rounded-tarjeta border border-borde bg-white p-0">
            {lista.map((e) => {
              const modo = fila?.id === e.id ? fila.modo : 'normal'
              return (
                <FilaEtiqueta
                  // Cambiar de modo vuelve a montar la fila: el campo arranca con el nombre actual.
                  key={`${e.id}:${modo}`}
                  etiqueta={e}
                  modo={modo}
                  otras={nombres.filter((n) => n !== e.nombre)}
                  procesando={procesando}
                  onModo={(m) => {
                    setFila(m === 'normal' ? null : { id: e.id, modo: m })
                  }}
                  onRenombrar={(valor) => renombrar(e.id, e.nombre, valor)}
                  onEliminar={() => void eliminar(e.id, e.nombre)}
                />
              )
            })}
          </ul>
        ))}
    </section>
  )
}
