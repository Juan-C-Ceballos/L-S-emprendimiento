import { useRef, useState, type SubmitEvent } from 'react'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { esquemaAjustesWhatsApp } from '@/lib/esquemas'
import { useAsync } from '@/lib/useAsync'
import {
  armarMensaje,
  DATOS_MENSAJE,
  MENSAJE_WHATSAPP_ORIGINAL,
  PEDIDO_EJEMPLO,
  soloDigitos,
} from '@/lib/whatsapp'
import { guardarAjustesWhatsApp, obtenerAjustesWhatsApp } from '@/services/ajustes'
import { ErrorServicio, MENSAJE_GENERICO } from '@/services/errores'
import type { AjustesWhatsApp } from '@/types/dominio'

const claseSeccion = 'border-b border-borde pt-1.5 pb-[22px] mb-[18px]'
const claseTituloSeccion = 'm-0 mb-1 font-display text-lg font-semibold'
const claseHint = 'm-0 text-[13px] leading-[1.45] text-texto-suave'
const claseError = 'text-[13px] font-semibold text-peligro'

export function AjustesPage() {
  const ajustes = useAsync(obtenerAjustesWhatsApp)

  return (
    <div className="mx-auto max-w-[760px] px-5 pt-[18px] pb-8 lg:px-8 lg:pt-8 lg:pb-12">
      {ajustes.estado === 'cargando' && (
        <p className={claseHint} aria-live="polite">
          Cargando los ajustes…
        </p>
      )}
      {ajustes.estado === 'error' && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="m-0 text-sm text-peligro">
            {ajustes.error instanceof ErrorServicio ? ajustes.error.message : MENSAJE_GENERICO}
          </p>
          <Button variant="ghost" size="sm" onClick={ajustes.recargar}>
            Reintentar
          </Button>
        </div>
      )}
      {ajustes.estado === 'listo' && <FormWhatsApp guardados={ajustes.datos} />}

      <section className={`${claseSeccion} border-b-0`}>
        <h2 className={claseTituloSeccion}>Etiquetas</h2>
        <p className={claseHint}>La gestión de etiquetas se completa en la etapa 7.</p>
      </section>
    </div>
  )
}

type Errores = { numero?: string; mensaje?: string }

/** Número "5491100000000" → "+5491100000000" para editarlo; vacío si no hay. */
function numeroParaEditar(numero: string): string {
  return numero === '' ? '' : `+${numero}`
}

function FormWhatsApp({ guardados: iniciales }: { guardados: AjustesWhatsApp }) {
  const { mostrarToast } = useToast()
  const [guardados, setGuardados] = useState(iniciales)
  const [numero, setNumero] = useState(numeroParaEditar(iniciales.numero))
  const [mensaje, setMensaje] = useState(iniciales.mensaje)
  const [errores, setErrores] = useState<Errores>({})
  const [guardando, setGuardando] = useState(false)
  const refMensaje = useRef<HTMLTextAreaElement>(null)

  const hayCambios = soloDigitos(numero) !== guardados.numero || mensaje !== guardados.mensaje

  function insertarDato(clave: string) {
    const campo = refMensaje.current
    const inicio = campo?.selectionStart ?? mensaje.length
    const fin = campo?.selectionEnd ?? mensaje.length
    const antes = mensaje.slice(0, inicio)
    const separador = antes !== '' && !/\s$/.test(antes) ? ' ' : ''
    const nuevo = antes + separador + clave + mensaje.slice(fin)
    setMensaje(nuevo)
    setErrores((e) => ({ ...e, mensaje: undefined }))
    const cursor = antes.length + separador.length + clave.length
    requestAnimationFrame(() => {
      campo?.focus()
      campo?.setSelectionRange(cursor, cursor)
    })
  }

  function descartar() {
    setNumero(numeroParaEditar(guardados.numero))
    setMensaje(guardados.mensaje)
    setErrores({})
  }

  async function alGuardar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    const resultado = esquemaAjustesWhatsApp.safeParse({ numero, mensaje })
    if (!resultado.success) {
      const nuevos: Errores = {}
      for (const problema of resultado.error.issues) {
        const campo = problema.path[0]
        if ((campo === 'numero' || campo === 'mensaje') && nuevos[campo] === undefined) {
          nuevos[campo] = problema.message
        }
      }
      setErrores(nuevos)
      mostrarToast('Revisá los campos marcados.')
      return
    }
    setGuardando(true)
    try {
      const nuevos = await guardarAjustesWhatsApp(resultado.data)
      setGuardados(nuevos)
      setNumero(numeroParaEditar(nuevos.numero))
      setMensaje(nuevos.mensaje)
      setErrores({})
      mostrarToast('Guardamos el número y el mensaje.')
    } catch (e) {
      mostrarToast(e instanceof ErrorServicio ? e.message : MENSAJE_GENERICO)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form noValidate onSubmit={(e) => void alGuardar(e)}>
      <section className={claseSeccion}>
        <h2 className={claseTituloSeccion}>WhatsApp de la tienda</h2>
        <p className={claseHint}>A este número llegan los pedidos que envían los clientes.</p>
        <div className="mt-[18px] flex flex-col gap-1.5">
          <Label htmlFor="s-phone">Número</Label>
          <Input
            id="s-phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="+54 9 11 0000-0000"
            value={numero}
            aria-invalid={errores.numero !== undefined}
            aria-describedby="s-phone-ayuda"
            onChange={(e) => {
              setNumero(e.target.value)
              setErrores((v) => ({ ...v, numero: undefined }))
            }}
          />
          {errores.numero !== undefined ? (
            <span id="s-phone-ayuda" className={claseError}>
              {errores.numero}
            </span>
          ) : (
            <span id="s-phone-ayuda" className={claseHint}>
              Con código de país (54), el 9 y el código de área.
            </span>
          )}
        </div>
      </section>

      <section className={claseSeccion}>
        <h2 className={claseTituloSeccion}>Mensaje de WhatsApp</h2>
        <p className={claseHint}>
          Es el texto que se arma cuando el cliente confirma. Las palabras entre llaves se reemplazan
          solas con los datos del pedido.
        </p>
        <div className="mt-[18px] flex flex-col gap-1.5">
          <Label htmlFor="s-tpl">Mensaje</Label>
          <Textarea
            ref={refMensaje}
            id="s-tpl"
            className="min-h-[190px] text-sm"
            value={mensaje}
            aria-invalid={errores.mensaje !== undefined}
            aria-describedby={errores.mensaje !== undefined ? 's-tpl-error' : undefined}
            onChange={(e) => {
              setMensaje(e.target.value)
              setErrores((v) => ({ ...v, mensaje: undefined }))
            }}
          />
          {errores.mensaje !== undefined && (
            <span id="s-tpl-error" className={claseError}>
              {errores.mensaje}
            </span>
          )}
        </div>

        <p className="m-0 mt-3.5 text-[13px] font-bold">Insertar dato</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DATOS_MENSAJE.map((dato) => (
            <button
              key={dato.clave}
              type="button"
              aria-label={`Insertar ${dato.texto}`}
              className="inline-flex min-h-11 items-center gap-[7px] rounded-full border border-borde-chip px-[15px] text-sm font-medium transition-colors hover:border-tinta"
              onClick={() => {
                insertarDato(dato.clave)
              }}
            >
              <span className="font-mono text-[12.5px]">{dato.clave}</span>
              <span className="text-xs text-texto-suave">{dato.texto}</span>
            </button>
          ))}
        </div>
        {mensaje !== MENSAJE_WHATSAPP_ORIGINAL && (
          <button
            type="button"
            className="mt-1 min-h-11 px-1 text-sm font-semibold text-bronce underline underline-offset-[3px] hover:text-bronce-hover"
            onClick={() => {
              setMensaje(MENSAJE_WHATSAPP_ORIGINAL)
              setErrores((v) => ({ ...v, mensaje: undefined }))
            }}
          >
            Volver al mensaje original
          </button>
        )}

        <p className="m-0 mt-[18px] text-[13px] font-bold">Vista previa</p>
        <div className="my-2 rounded-[16px_16px_16px_4px] border border-borde bg-white px-4 py-3.5 text-sm leading-[1.55] whitespace-pre-line">
          {armarMensaje(mensaje, PEDIDO_EJEMPLO)}
        </div>
        <p className={claseHint}>Vista previa con un pedido de ejemplo.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {hayCambios && (
            <Button type="button" variant="ghost" size="sm" onClick={descartar}>
              Descartar
            </Button>
          )}
          <Button type="submit" size="sm" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar número y mensaje'}
          </Button>
        </div>
      </section>
    </form>
  )
}
