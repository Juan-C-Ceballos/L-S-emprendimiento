import { z } from 'zod'
import { obtenerSupabase } from '@/lib/supabase'
import { desdeErrorSupabase, ErrorServicio } from '@/services/errores'
import type { ErrorCrearPedido, LineaPedido, PedidoCreado } from '@/types/dominio'

const MENSAJE_CREAR = 'No pudimos guardar tu pedido. Probá de nuevo en un rato.'

/** Por qué la base no aceptó el pedido (nada se guardó). */
export type RechazoPedido = {
  errores: ErrorCrearPedido[]
  /** Solo con `precio_cambiado` (D-24). */
  precios?: { productoId: string; precio: number }[]
  totalActual?: number
}

/** `crear_pedido` respondió `ok: false`: stock, producto desactivado o precio cambiado. */
export class PedidoRechazado extends ErrorServicio {
  readonly rechazo: RechazoPedido

  constructor(rechazo: RechazoPedido) {
    const precio = rechazo.errores.some((e) => e.tipo === 'precio_cambiado')
    super(
      'pedido_rechazado',
      precio
        ? 'Cambió el precio de algunas piezas. Revisá el total antes de confirmar.'
        : 'Hay piezas sin stock suficiente. Corregí el carrito para seguir.',
      rechazo,
    )
    this.name = 'PedidoRechazado'
    this.rechazo = rechazo
  }
}

// Forma del jsonb de `public.crear_pedido` (ver `RespuestaCrearPedidoRpc` en dominio.ts).
const esquemaItem = z.object({
  producto_id: z.string(),
  nombre: z.string(),
  cantidad: z.number(),
  precio_unitario: z.number(),
  subtotal: z.number(),
})

const esquemaError = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('inexistente'), producto_id: z.string() }),
  z.object({ tipo: z.literal('inactivo'), producto_id: z.string(), nombre: z.string() }),
  z.object({
    tipo: z.literal('stock_insuficiente'),
    producto_id: z.string(),
    nombre: z.string(),
    disponible: z.number(),
    pedido: z.number(),
  }),
  z.object({ tipo: z.literal('precio_cambiado') }),
])

const esquemaRespuesta = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    pedido: z.object({
      id: z.string(),
      numero: z.number(),
      total: z.number(),
      cliente: z.string(),
      items: z.array(esquemaItem),
    }),
  }),
  z.object({
    ok: z.literal(false),
    errores: z.array(esquemaError),
    precios: z.array(z.object({ producto_id: z.string(), precio: z.number() })).optional(),
    total_actual: z.number().optional(),
  }),
])

function aErrorPedido(e: z.infer<typeof esquemaError>): ErrorCrearPedido {
  switch (e.tipo) {
    case 'inexistente':
      return { tipo: 'inexistente', productoId: e.producto_id }
    case 'inactivo':
      return { tipo: 'inactivo', productoId: e.producto_id, nombre: e.nombre }
    case 'stock_insuficiente':
      return {
        tipo: 'stock_insuficiente',
        productoId: e.producto_id,
        nombre: e.nombre,
        disponible: e.disponible,
        pedido: e.pedido,
      }
    case 'precio_cambiado':
      return { tipo: 'precio_cambiado' }
  }
}

export type DatosNuevoPedido = {
  items: LineaPedido[]
  cliente: string
  telefono: string
  /** Total que vio el cliente; si la base calcula otro, rechaza con `precio_cambiado` (D-24). */
  totalEsperado: number
}

/**
 * Guarda el pedido con `crear_pedido` (D-07: único lugar que conoce el transporte; hoy RPC
 * directa, mañana podría ser una función de Cloudflare). Nunca manda precios.
 * Punto de extensión (fuera del MVP): el token del captcha viajaría acá.
 */
export async function crearPedido(datos: DatosNuevoPedido): Promise<PedidoCreado> {
  const { data, error } = await obtenerSupabase().rpc('crear_pedido', {
    p_items: datos.items.map((l) => ({ producto_id: l.productoId, cantidad: l.cantidad })),
    p_cliente: datos.cliente,
    p_telefono: datos.telefono,
    p_total_esperado: datos.totalEsperado,
  })
  if (error !== null) {
    if (error.code === '22023') throw new ErrorServicio('datos_invalidos', 'Revisá los datos marcados.', error)
    throw desdeErrorSupabase(error, MENSAJE_CREAR)
  }

  const respuesta = esquemaRespuesta.safeParse(data)
  if (!respuesta.success) throw new ErrorServicio('respuesta', MENSAJE_CREAR, data)
  const r = respuesta.data
  if (!r.ok) {
    throw new PedidoRechazado({
      errores: r.errores.map(aErrorPedido),
      precios: r.precios?.map((p) => ({ productoId: p.producto_id, precio: p.precio })),
      totalActual: r.total_actual,
    })
  }
  return {
    id: r.pedido.id,
    numero: r.pedido.numero,
    total: r.pedido.total,
    cliente: r.pedido.cliente,
    items: r.pedido.items.map((i) => ({
      productoId: i.producto_id,
      nombre: i.nombre,
      cantidad: i.cantidad,
      precioUnitario: i.precio_unitario,
      subtotal: i.subtotal,
    })),
  }
}

// ---------------------------------------------------------------------------
// Último pedido (pantalla de éxito). Vive en sessionStorage: se pierde al cerrar la pestaña.
// ---------------------------------------------------------------------------

const CLAVE_ULTIMO_PEDIDO = 'ls:ultimo-pedido'

const esquemaPedidoCreado = z.object({
  id: z.string(),
  numero: z.number(),
  total: z.number(),
  cliente: z.string(),
  items: z.array(
    z.object({
      productoId: z.string(),
      nombre: z.string(),
      cantidad: z.number(),
      precioUnitario: z.number(),
      subtotal: z.number(),
    }),
  ),
})

export function guardarUltimoPedido(pedido: PedidoCreado): void {
  try {
    sessionStorage.setItem(CLAVE_ULTIMO_PEDIDO, JSON.stringify(pedido))
  } catch {
    // Sin almacenamiento: la pantalla de éxito vuelve al catálogo (el pedido igual quedó guardado).
  }
}

export function leerUltimoPedido(): PedidoCreado | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE_ULTIMO_PEDIDO)
    if (crudo === null) return null
    const resultado = esquemaPedidoCreado.safeParse(JSON.parse(crudo))
    return resultado.success ? resultado.data : null
  } catch {
    return null
  }
}
