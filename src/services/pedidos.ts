import { z } from 'zod'
import { calcularGanancia } from '@/lib/pedidos'
import { obtenerSupabase } from '@/lib/supabase'
import { desdeErrorSupabase, ErrorServicio } from '@/services/errores'
import { urlPublica } from '@/services/imagenes'
import {
  ESTADOS_PEDIDO,
  type CambioStock,
  type ErrorCrearPedido,
  type EstadoPedido,
  type ItemPedidoDetalle,
  type LineaPedido,
  type PedidoCreado,
  type PedidoDetalle,
  type PedidoResumen,
} from '@/types/dominio'

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

// ---------------------------------------------------------------------------
// Panel de la administradora
// ---------------------------------------------------------------------------

/** Límite de la lista (D-38): con más pedidos, paginar y mover el filtro a la base. */
const LIMITE_PEDIDOS = 500

function aEstado(valor: string): EstadoPedido {
  const estado = ESTADOS_PEDIDO.find((e) => e === valor)
  if (estado === undefined) throw new ErrorServicio('respuesta', 'El pedido tiene un estado desconocido.', valor)
  return estado
}

/** Pedidos más recientes primero. Búsqueda y filtro se hacen en el navegador (`lib/pedidos.ts`). */
export async function listarPedidosAdmin(): Promise<PedidoResumen[]> {
  const { data, error } = await obtenerSupabase()
    .from('orders')
    .select('id, numero, estado, cliente, telefono, total, created_at')
    .order('created_at', { ascending: false })
    .limit(LIMITE_PEDIDOS)
  if (error !== null) throw desdeErrorSupabase(error, 'No pudimos cargar los pedidos. Probá de nuevo en un rato.')
  return data.map((p) => ({
    id: p.id,
    numero: p.numero,
    estado: aEstado(p.estado),
    cliente: p.cliente,
    telefono: p.telefono,
    total: p.total,
    creadoEn: p.created_at,
  }))
}

/** Cuántos pedidos pendientes hay (badge de la tab Pedidos). */
export async function contarPendientes(): Promise<number> {
  const { count, error } = await obtenerSupabase()
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'pendiente')
  if (error !== null) throw desdeErrorSupabase(error)
  return count ?? 0
}

/** Detalle con ítems, precio y stock actuales de cada producto y ganancia estimada; `null` si no existe. */
export async function obtenerPedido(numero: number): Promise<PedidoDetalle | null> {
  const { data, error } = await obtenerSupabase()
    .from('orders')
    .select(
      'id, numero, estado, cliente, telefono, total, created_at, vendido_at, cancelado_at, order_items(product_id, cantidad, precio_unitario, costo_unitario, products(nombre, precio, stock, product_images(path_miniatura, orden)))',
    )
    .eq('numero', numero)
    .maybeSingle()
  if (error !== null) throw desdeErrorSupabase(error, 'No pudimos cargar el pedido. Probá de nuevo en un rato.')
  if (data === null) return null

  const items: ItemPedidoDetalle[] = data.order_items
    .map((i) => {
      const portada = [...i.products.product_images].sort((a, b) => a.orden - b.orden)[0]
      return {
        productoId: i.product_id,
        nombre: i.products.nombre,
        cantidad: i.cantidad,
        precioUnitario: i.precio_unitario,
        costoUnitario: i.costo_unitario,
        subtotal: i.cantidad * i.precio_unitario,
        precioActual: i.products.precio,
        stockActual: i.products.stock,
        miniaturaUrl: portada === undefined ? null : urlPublica(portada.path_miniatura),
      }
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  return {
    id: data.id,
    numero: data.numero,
    estado: aEstado(data.estado),
    cliente: data.cliente,
    telefono: data.telefono,
    total: data.total,
    creadoEn: data.created_at,
    vendidoEn: data.vendido_at,
    canceladoEn: data.cancelado_at,
    items,
    ganancia: calcularGanancia(items),
  }
}

const esquemaCambios = z.array(
  z.object({ producto_id: z.string(), nombre: z.string(), desde: z.number(), hasta: z.number() }),
)

const esquemaFaltantes = z.array(
  z.object({ producto_id: z.string(), nombre: z.string(), disponible: z.number(), pedido: z.number() }),
)

/** Errores de `marcar_vendido` / `cancelar_pedido` (raise exception con mensaje fijo y `detail`). */
function errorAccionPedido(error: { code?: string; message?: string; details?: string }): ErrorServicio {
  const mensaje = error.message ?? ''
  if (error.code === '42501' || mensaje === 'no_autorizado') {
    return new ErrorServicio('sin_acceso', 'Tu sesión no tiene permiso para cambiar pedidos.', error)
  }
  if (error.code === 'P0002' || mensaje === 'pedido_inexistente') {
    return new ErrorServicio('pedido_inexistente', 'Este pedido ya no existe.', error)
  }
  if (mensaje === 'estado_invalido') {
    const estado = error.details ?? ''
    const texto =
      estado === 'vendido'
        ? 'Este pedido ya estaba vendido. Actualizamos la pantalla.'
        : estado === 'cancelado'
          ? 'Este pedido ya estaba cancelado. Actualizamos la pantalla.'
          : 'El pedido cambió de estado. Actualizamos la pantalla.'
    return new ErrorServicio('estado_invalido', texto, error)
  }
  if (mensaje === 'stock_insuficiente') {
    let faltantes: z.infer<typeof esquemaFaltantes> = []
    try {
      const r = esquemaFaltantes.safeParse(JSON.parse(error.details ?? '[]'))
      if (r.success) faltantes = r.data
    } catch {
      // detail ilegible: el mensaje va sin nombres.
    }
    const nombres = faltantes.map((f) => f.nombre).join(', ')
    return new ErrorServicio(
      'stock_insuficiente',
      nombres === '' ? 'No alcanza el stock para vender este pedido.' : `No alcanza el stock de ${nombres}.`,
      faltantes,
    )
  }
  return desdeErrorSupabase(error, 'No pudimos actualizar el pedido. Probá de nuevo en un rato.')
}

function aCambios(data: unknown): CambioStock[] {
  const cambios = z.object({ cambios: esquemaCambios }).safeParse(data)
  if (!cambios.success) throw new ErrorServicio('respuesta', 'No pudimos leer la respuesta de la base.', data)
  return cambios.data.cambios.map((c) => ({
    productoId: c.producto_id,
    nombre: c.nombre,
    desde: c.desde,
    hasta: c.hasta,
  }))
}

/** Pasa el pedido a vendido y descuenta el stock en una sola transacción. Devuelve los cambios. */
export async function marcarVendido(pedidoId: string): Promise<CambioStock[]> {
  const { data, error } = await obtenerSupabase().rpc('marcar_vendido', { p_pedido_id: pedidoId })
  if (error !== null) throw errorAccionPedido(error)
  return aCambios(data)
}

/** Cancela el pedido; si estaba vendido, repone el stock (los cambios vienen vacíos si no). */
export async function cancelarPedido(pedidoId: string): Promise<CambioStock[]> {
  const { data, error } = await obtenerSupabase().rpc('cancelar_pedido', { p_pedido_id: pedidoId })
  if (error !== null) throw errorAccionPedido(error)
  return aCambios(data)
}
