import { z } from 'zod'
import { STOCK_BAJO } from '@/lib/constantes'
import { filtrarPedidos } from '@/lib/pedidos'
import { obtenerSupabase } from '@/lib/supabase'
import { desdeErrorSupabase, ErrorServicio } from '@/services/errores'
import { listarPedidosAdmin } from '@/services/pedidos'
import { listarProductosAdmin } from '@/services/productos'
import type { PedidoResumen, Producto, ResumenPanel, StockEtiqueta } from '@/types/dominio'

const MENSAJE = 'No pudimos cargar el resumen. Probá de nuevo en un rato.'

const esquemaResumen = z.object({
  pendientes: z.object({ cantidad: z.number(), monto: z.number() }),
  stock_bajo: z.object({ cantidad: z.number(), agotados: z.number() }),
  ventas_mes: z.object({ mes: z.string(), cantidad: z.number(), total: z.number(), ganancia: z.number() }),
})

/** Pendientes, stock bajo y ventas del mes, calculados en la base (`resumen_panel`). */
export async function obtenerResumen(): Promise<ResumenPanel> {
  const { data, error } = await obtenerSupabase().rpc('resumen_panel', {})
  if (error !== null) {
    if (error.code === '42501') {
      throw new ErrorServicio('sin_acceso', 'Tu sesión no tiene permiso para ver el resumen.', error)
    }
    throw desdeErrorSupabase(error, MENSAJE)
  }
  const r = esquemaResumen.safeParse(data)
  if (!r.success) throw new ErrorServicio('respuesta', MENSAJE, data)
  return { pendientes: r.data.pendientes, stockBajo: r.data.stock_bajo, ventasMes: r.data.ventas_mes }
}

const esquemaEtiquetas = z.array(
  z.object({
    id: z.string(),
    nombre: z.string(),
    seguida: z.boolean(),
    productos: z.number(),
    piezas: z.number(),
    unidades: z.number(),
    vendidas_mes: z.number(),
    vendidas_total: z.number(),
  }),
)

/** 42501 (no es la administradora) → `sin_acceso`; el resto, con el mensaje de la acción. */
function errorDelResumen(error: { code: string }, mensaje: string): ErrorServicio {
  if (error.code === '42501') {
    return new ErrorServicio('sin_acceso', 'Tu sesión no tiene permiso para ver el resumen.', error)
  }
  return desdeErrorSupabase(error, mensaje)
}

/** Stock y ventas de cada etiqueta, con las que sigue la administradora (`resumen_etiquetas`). */
export async function obtenerStockPorEtiqueta(): Promise<StockEtiqueta[]> {
  const { data, error } = await obtenerSupabase().rpc('resumen_etiquetas', {})
  if (error !== null) throw errorDelResumen(error, MENSAJE)
  const r = esquemaEtiquetas.safeParse(data)
  if (!r.success) throw new ErrorServicio('respuesta', MENSAJE, data)
  return r.data.map(({ vendidas_mes, vendidas_total, ...e }) => ({
    ...e,
    vendidasMes: vendidas_mes,
    vendidasTotal: vendidas_total,
  }))
}

/** Reemplaza las etiquetas que se siguen en el Resumen. Sin ninguna, el Resumen muestra todas. */
export async function guardarEtiquetasSeguidas(ids: string[]): Promise<void> {
  const { error } = await obtenerSupabase().rpc('guardar_etiquetas_seguidas', { p_ids: ids })
  if (error !== null) throw errorDelResumen(error, 'No pudimos guardar las etiquetas. Probá de nuevo.')
}

export type DatosResumen = {
  resumen: ResumenPanel
  /** Los 3 pendientes más recientes. */
  paraAtender: PedidoResumen[]
  /** Activos con stock bajo, de menos a más stock. */
  paraReponer: Producto[]
  /** Todas las etiquetas; la pantalla elige cuáles mostrar (`etiquetasAMostrar`). */
  porEtiqueta: StockEtiqueta[]
}

/** Todo lo que muestra la pantalla Resumen, en paralelo. */
export async function obtenerDatosResumen(): Promise<DatosResumen> {
  const [resumen, pedidos, productos, porEtiqueta] = await Promise.all([
    obtenerResumen(),
    listarPedidosAdmin(),
    listarProductosAdmin(),
    obtenerStockPorEtiqueta(),
  ])
  return {
    resumen,
    paraAtender: filtrarPedidos(pedidos, { estado: 'pendiente', q: '' }).slice(0, 3),
    paraReponer: productos.filter((p) => p.activo && p.stock <= STOCK_BAJO).sort((a, b) => a.stock - b.stock),
    porEtiqueta,
  }
}
