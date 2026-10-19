import { Link } from 'react-router'
import { claseLink } from '@/components/estilos'
import { FilaPedido } from '@/components/panel/FilaPedido'
import { FilaProducto } from '@/components/panel/FilaProducto'
import { PorEtiqueta } from '@/components/panel/PorEtiqueta'
import { Stat } from '@/components/panel/Stat'
import { Button } from '@/components/ui/button'
import { formatearFechaResumen, formatearPrecio, nombreMes } from '@/lib/formato'
import { textosResumen } from '@/lib/resumen'
import { useAsync } from '@/lib/useAsync'
import { ErrorServicio, MENSAJE_GENERICO } from '@/services/errores'
import { obtenerDatosResumen, type DatosResumen } from '@/services/resumen'

const claseLista = 'mx-4 mb-2 overflow-hidden rounded-tarjeta border border-borde bg-white lg:mx-8'
const claseVacio =
  'mx-4 mb-2 flex flex-col items-center gap-2 rounded-input border border-dashed border-borde-fuerte px-5 py-7 text-center lg:mx-8'

function Encabezado({ titulo, to, texto }: { titulo: string; to: string; texto: string }) {
  return (
    <div className="flex items-center justify-between px-4 pt-[18px] pb-2 lg:px-8">
      <h2 className="m-0 font-display text-lg font-semibold">{titulo}</h2>
      <Link to={to} className={`${claseLink} flex items-center`}>
        {texto}
      </Link>
    </div>
  )
}

/** Inicio del panel (prototipo: `a.isHome`): lo que hay que atender hoy. */
export function ResumenPage() {
  const datos = useAsync(obtenerDatosResumen)
  // Al releer (después de elegir etiquetas) se sigue mostrando el resumen anterior.
  const contenido = datos.estado === 'listo' ? datos.datos : datos.previos

  return (
    <div className="pb-6">
      <div className="px-4 pt-[22px] pb-1 lg:px-8 lg:pt-8">
        <p className="m-0 text-[11px] font-semibold tracking-[0.16em] text-texto-suave uppercase">
          {formatearFechaResumen(new Date())}
        </p>
        <p className="mt-1.5 mb-0 font-display text-[26px] leading-[1.08] font-semibold tracking-[-0.02em]">
          Hola. Esto es lo que hay hoy.
        </p>
      </div>

      {datos.estado === 'cargando' && contenido === undefined && (
        <p className="m-0 px-4 pt-4 text-[13px] text-texto-suave lg:px-8" aria-live="polite">
          Cargando el resumen…
        </p>
      )}

      {datos.estado === 'error' && (
        <div role="alert" className="mx-4 my-4 flex flex-col items-start gap-3 lg:mx-8">
          <p className="m-0 text-sm text-peligro">
            {datos.error instanceof ErrorServicio ? datos.error.message : MENSAJE_GENERICO}
          </p>
          <Button variant="ghost" size="sm" onClick={datos.recargar}>
            Reintentar
          </Button>
        </div>
      )}

      {contenido !== undefined && <ContenidoResumen datos={contenido} onRecargar={datos.recargar} />}
    </div>
  )
}

function ContenidoResumen({ datos, onRecargar }: { datos: DatosResumen; onRecargar: () => void }) {
  const textos = textosResumen(datos.resumen)
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 p-4 lg:grid-cols-3 lg:px-8 lg:py-5">
        <Stat
          to="/admin/pedidos?estado=pendiente"
          etiqueta="Pedidos pendientes"
          valor={String(datos.resumen.pendientes.cantidad)}
          detalle={textos.pendientes}
        />
        <Stat
          to="/admin/productos?filtro=stock-bajo"
          etiqueta="Stock bajo"
          valor={String(datos.resumen.stockBajo.cantidad)}
          detalle={textos.stockBajo}
        />
        <Stat
          to="/admin/pedidos?estado=vendido"
          etiqueta={`Ventas de ${nombreMes(datos.resumen.ventasMes.mes)}`}
          valor={formatearPrecio(datos.resumen.ventasMes.total)}
          detalle={textos.ventas}
          destacada
        />
      </div>

      <Encabezado titulo="Para atender" to="/admin/pedidos" texto="Ver pedidos" />
      {datos.paraAtender.length > 0 ? (
        <div className={claseLista}>
          {datos.paraAtender.map((p) => (
            <FilaPedido key={p.id} pedido={p} variante="resumen" />
          ))}
        </div>
      ) : (
        <div className={claseVacio}>
          <p className="m-0 font-display text-[19px] font-semibold tracking-[-0.01em]">Todo al día</p>
          <p className="m-0 max-w-[290px] text-sm text-texto-suave">
            No hay pedidos pendientes. Cuando un cliente confirme uno, aparece acá.
          </p>
        </div>
      )}

      <Encabezado titulo="Para reponer" to="/admin/productos?filtro=stock-bajo" texto="Ver productos" />
      {datos.paraReponer.length > 0 ? (
        <div className={claseLista}>
          {datos.paraReponer.map((p) => (
            <FilaProducto key={p.id} producto={p} desde="resumen" variante="resumen" />
          ))}
        </div>
      ) : (
        <div className={claseVacio}>
          <p className="m-0 max-w-[290px] text-sm text-texto-suave">
            Todos los productos activos tienen más de 3 unidades.
          </p>
        </div>
      )}

      <PorEtiqueta etiquetas={datos.porEtiqueta} onGuardado={onRecargar} />
    </>
  )
}
