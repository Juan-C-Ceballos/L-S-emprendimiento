import { useRef, useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AlertaStock } from '@/components/AlertaStock'
import { EstadoVacio } from '@/components/catalogo/EstadoVacio'
import { clasePagina, claseTituloPagina } from '@/components/estilos'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ajustarAlStock,
  calcularTotal,
  detectarProblemas,
  problemasDesdeRechazo,
  textoPiezas,
} from '@/lib/carritoReglas'
import { esquemaConfirmacion, type CampoConfirmacion } from '@/lib/esquemas'
import { formatearPrecio } from '@/lib/formato'
import { useCarrito } from '@/lib/useCarrito'
import { useProductosDelCarrito } from '@/lib/useProductosDelCarrito'
import { useTituloDocumento } from '@/lib/useTituloDocumento'
import { ErrorServicio, MENSAJE_GENERICO } from '@/services/errores'
import { crearPedido, guardarUltimoPedido, PedidoRechazado } from '@/services/pedidos'
import type { LineaCarrito, ProblemaCarrito } from '@/types/dominio'

const claseHint = 'text-[13px] leading-[1.45] text-texto-suave'
const claseError = 'text-[13px] font-semibold text-peligro'

/** Lo que contestó la base al rechazar, válido mientras el carrito siga igual. */
type Rechazo = { lineas: LineaCarrito[]; problemas: ProblemaCarrito[]; nombres: Map<string, string> }

/**
 * Confirmar pedido (prototipo: `c.isCheckout`). Relee precios y stock al entrar; ese total viaja
 * como `totalEsperado` y la base rechaza si cambió (D-24). El pedido se guarda antes de mostrar
 * el botón de WhatsApp.
 */
export function ConfirmarPage() {
  useTituloDocumento('Confirmar pedido · L&S')
  const carrito = useCarrito()
  const navigate = useNavigate()
  const { mostrarToast } = useToast()
  const { productos, cargando, error, recargar } = useProductosDelCarrito(carrito.lineas)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [errores, setErrores] = useState<Partial<Record<CampoConfirmacion, string>>>({})
  const [enviando, setEnviando] = useState(false)
  const enviandoAhora = useRef(false)
  const [rechazo, setRechazo] = useState<Rechazo | null>(null)
  const [precioCambiado, setPrecioCambiado] = useState(false)

  if (carrito.lineas.length === 0) {
    return (
      <div className={clasePagina}>
        <h1 className={claseTituloPagina}>Confirmar pedido</h1>
        <EstadoVacio
          titulo="Tu carrito está vacío"
          texto="Mirá la vidriera y tocá una pieza para agregarla."
          acciones={
            <Button asChild size="sm">
              <Link to="/">Ver catálogo</Link>
            </Button>
          }
          className="mx-0 mt-5 mb-0"
        />
      </div>
    )
  }

  if (productos === null) {
    return (
      <div className={clasePagina}>
        <h1 className={claseTituloPagina}>Confirmar pedido</h1>
        {error === undefined ? (
          <p className="mt-4 text-sm text-texto-suave" aria-live="polite">
            Cargando tu pedido…
          </p>
        ) : (
          <div role="alert" className="mt-4 flex flex-col items-start gap-3">
            <p className="m-0 text-sm text-peligro">
              {error instanceof ErrorServicio ? error.message : MENSAJE_GENERICO}
            </p>
            <Button variant="ghost" size="sm" onClick={recargar}>
              Reintentar
            </Button>
          </div>
        )}
      </div>
    )
  }

  // El rechazo de la base vale para este carrito: si cambió (ajustar, quitar), se descarta.
  const rechazoVigente = rechazo !== null && rechazo.lineas === carrito.lineas ? rechazo : null
  const locales = detectarProblemas(carrito.lineas, productos, rechazoVigente?.nombres)
  // Mientras se releen los productos después de un rechazo, se muestra lo que dijo la base.
  const problemas = cargando && rechazoVigente !== null ? rechazoVigente.problemas : locales
  const total = calcularTotal(carrito.lineas, productos)

  function ajustar() {
    if (productos === null) return
    const nuevas = ajustarAlStock(carrito.lineas, productos)
    carrito.reemplazar(nuevas)
    if (nuevas.length === 0) {
      mostrarToast('Tu carrito quedó vacío: esas piezas se agotaron.')
      void navigate('/carrito')
    } else {
      mostrarToast('Ajustamos tu carrito al stock disponible.')
    }
  }

  async function confirmar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    // La ref frena el doble clic antes de que React vuelva a dibujar el botón deshabilitado.
    if (enviandoAhora.current || cargando) return
    const datos = esquemaConfirmacion.safeParse({ nombre, telefono })
    if (!datos.success) {
      const nuevos: Partial<Record<CampoConfirmacion, string>> = {}
      for (const problema of datos.error.issues) {
        const campo = problema.path[0]
        if ((campo === 'nombre' || campo === 'telefono') && nuevos[campo] === undefined) {
          nuevos[campo] = problema.message
        }
      }
      setErrores(nuevos)
    } else {
      setErrores({})
    }
    if (problemas.length > 0) {
      mostrarToast('Hay piezas sin stock suficiente. Corregí el carrito para seguir.')
      return
    }
    if (!datos.success) {
      mostrarToast('Revisá los datos marcados.')
      return
    }

    enviandoAhora.current = true
    setEnviando(true)
    setPrecioCambiado(false)
    const lineas = carrito.lineas
    try {
      const pedido = await crearPedido({
        items: lineas,
        cliente: datos.data.nombre,
        telefono: datos.data.telefono,
        totalEsperado: total,
      })
      guardarUltimoPedido(pedido)
      void navigate('/pedido/confirmado', { replace: true })
      carrito.vaciar()
      return
    } catch (e) {
      if (e instanceof PedidoRechazado) {
        if (e.rechazo.errores.some((x) => x.tipo === 'precio_cambiado')) {
          setPrecioCambiado(true)
        } else {
          const nombres = new Map(
            e.rechazo.errores.flatMap((x) => ('nombre' in x ? [[x.productoId, x.nombre] as const] : [])),
          )
          setRechazo({ lineas, problemas: problemasDesdeRechazo(e.rechazo.errores), nombres })
        }
        recargar()
      }
      mostrarToast(e instanceof ErrorServicio ? e.message : MENSAJE_GENERICO)
    }
    enviandoAhora.current = false
    setEnviando(false)
  }

  return (
    <div className={clasePagina}>
      <h1 className={claseTituloPagina}>Confirmar pedido</h1>
      <p className="mt-1.5 mb-0 text-[15px] leading-[1.55] text-texto-medio">
        {textoPiezas(carrito.piezas)} · Total {formatearPrecio(total)}
      </p>

      {problemas.length > 0 && <AlertaStock problemas={problemas} onAjustar={ajustar} />}

      {precioCambiado && (
        <div
          role="alert"
          className="mt-[18px] rounded-alerta border border-borde-fuerte bg-pill-pendiente p-4 text-sm text-pill-pendiente-texto"
        >
          <p className="m-0 text-[15px] font-bold">
            Cambió el precio de algunas piezas. Revisá el total antes de confirmar.
          </p>
          <p className="mt-1 mb-0">
            {cargando ? 'Actualizando precios…' : `Total actualizado: ${formatearPrecio(total)}`}
          </p>
        </div>
      )}

      <form noValidate onSubmit={(e) => void confirmar(e)}>
        <div className="mt-[18px] flex flex-col gap-1.5">
          <Label htmlFor="f-name">Nombre</Label>
          <Input
            id="f-name"
            type="text"
            autoComplete="name"
            placeholder="Cómo te llamás"
            value={nombre}
            aria-invalid={errores.nombre !== undefined}
            aria-describedby={errores.nombre !== undefined ? 'f-name-error' : undefined}
            onChange={(e) => {
              setNombre(e.target.value)
              setErrores((v) => ({ ...v, nombre: undefined }))
            }}
          />
          {errores.nombre !== undefined && (
            <span id="f-name-error" className={claseError}>
              {errores.nombre}
            </span>
          )}
        </div>
        <div className="mt-[18px] flex flex-col gap-1.5">
          <Label htmlFor="f-phone">Teléfono</Label>
          <Input
            id="f-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Ej. 351 555-1234"
            value={telefono}
            aria-invalid={errores.telefono !== undefined}
            aria-describedby="f-phone-ayuda"
            onChange={(e) => {
              setTelefono(e.target.value)
              setErrores((v) => ({ ...v, telefono: undefined }))
            }}
          />
          {errores.telefono !== undefined ? (
            <span id="f-phone-ayuda" className={claseError}>
              {errores.telefono}
            </span>
          ) : (
            <span id="f-phone-ayuda" className={claseHint}>
              Con código de área. Lo usamos solo para coordinar este pedido.
            </span>
          )}
        </div>
        <div className="mt-[26px] flex">
          <Button type="submit" disabled={enviando || cargando}>
            {enviando ? 'Confirmando…' : 'Confirmar pedido'}
          </Button>
        </div>
      </form>
      <p className={`${claseHint} mt-3 mb-0 text-center`}>
        No se cobra nada ahora: el pedido queda pendiente hasta que lo coordinemos.
      </p>
    </div>
  )
}
