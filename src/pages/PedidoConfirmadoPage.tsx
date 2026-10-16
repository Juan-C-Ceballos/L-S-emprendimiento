import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { clasePagina, claseTituloPagina } from '@/components/estilos'
import { Button } from '@/components/ui/button'
import { formatearNumeroPedido } from '@/lib/formato'
import { useAsync } from '@/lib/useAsync'
import { useTituloDocumento } from '@/lib/useTituloDocumento'
import { armarMensaje, enlaceWhatsApp, formatearTelefonoTienda } from '@/lib/whatsapp'
import { obtenerAjustesWhatsApp } from '@/services/ajustes'
import { leerUltimoPedido } from '@/services/pedidos'
import type { AjustesWhatsApp, PedidoCreado } from '@/types/dominio'

const claseHint = 'text-[13px] leading-[1.45] text-texto-suave'

function EnviarPorWhatsApp({ pedido, ajustes }: { pedido: PedidoCreado; ajustes: AjustesWhatsApp }) {
  const texto = armarMensaje(ajustes.mensaje, {
    numero: pedido.numero,
    items: pedido.items.map((i) => ({ cantidad: i.cantidad, nombre: i.nombre, precioUnitario: i.precioUnitario })),
    total: pedido.total,
    nombre: pedido.cliente,
  })
  return (
    <>
      <p className="mt-[22px] mb-0 text-[13px] font-bold">Vista previa del mensaje</p>
      <div className="mt-2 mb-[18px] rounded-[16px_16px_16px_4px] border border-borde bg-white px-4 py-3.5 text-sm leading-[1.55] whitespace-pre-line">
        {texto}
      </div>
      <div className="flex flex-col gap-2.5">
        {/* Link que toca el cliente (no se abre solo): el pedido ya está guardado. */}
        <Button asChild variant="wa">
          <a href={enlaceWhatsApp(ajustes.numero, texto)} target="_blank" rel="noopener">
            Enviar por WhatsApp
          </a>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/">Volver al catálogo</Link>
        </Button>
      </div>
      <p className={`${claseHint} mt-3 mb-0 text-center`}>
        Se abre un chat con L&amp;S al {formatearTelefonoTienda(ajustes.numero)}.
      </p>
    </>
  )
}

/** Éxito (prototipo: `c.isSuccess`). Lee el pedido recién creado de sessionStorage. */
export function PedidoConfirmadoPage() {
  useTituloDocumento('Pedido confirmado · L&S')
  const [pedido] = useState(leerUltimoPedido)
  const ajustes = useAsync(obtenerAjustesWhatsApp)

  if (pedido === null) return <Navigate to="/" replace />

  const primerNombre = pedido.cliente.trim().split(/\s+/)[0] ?? pedido.cliente

  return (
    <div className={clasePagina}>
      <div className="mb-[18px] flex size-14 items-center justify-center rounded-full bg-tinta text-white">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      </div>
      <p className="m-0 text-[11px] font-semibold tracking-[0.16em] text-texto-suave uppercase">
        Pedido {formatearNumeroPedido(pedido.numero)} · pendiente
      </p>
      <h1 className={`${claseTituloPagina} mt-2`}>¡Gracias, {primerNombre}!</h1>

      {ajustes.estado === 'listo' && ajustes.datos.numero !== '' ? (
        <>
          <p className="mt-3 mb-0 text-[15px] leading-[1.55] text-texto-medio">
            Tu pedido quedó registrado. Para terminar, mandanos el resumen por WhatsApp y coordinamos el
            resto por ahí.
          </p>
          <EnviarPorWhatsApp pedido={pedido} ajustes={ajustes.datos} />
        </>
      ) : (
        <>
          <p className="mt-3 mb-0 text-[15px] leading-[1.55] text-texto-medio">
            {ajustes.estado === 'listo'
              ? 'Tu pedido quedó registrado. Te vamos a escribir al teléfono que dejaste para coordinar.'
              : 'Tu pedido quedó registrado.'}
          </p>
          {ajustes.estado === 'cargando' && (
            <p className={`${claseHint} mt-4 mb-0`} aria-live="polite">
              Preparando el mensaje de WhatsApp…
            </p>
          )}
          {ajustes.estado === 'error' && (
            <div role="alert" className="mt-4 flex flex-col items-start gap-3">
              <p className="m-0 text-sm text-peligro">
                No pudimos preparar el mensaje de WhatsApp. Tu pedido igual quedó guardado.
              </p>
              <Button variant="ghost" size="sm" onClick={ajustes.recargar}>
                Reintentar
              </Button>
            </div>
          )}
          <div className="mt-6 flex flex-col">
            <Button asChild variant="ghost">
              <Link to="/">Volver al catálogo</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
