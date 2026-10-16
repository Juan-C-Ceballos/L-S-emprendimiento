// Tipos de dominio. Los servicios convierten las filas crudas de `database.ts` (generado) a estas
// formas, así las pantallas no dependen del esquema de la base ni de nombres en snake_case.
import type { Tables } from '@/types/database'

type FilaProducto = Tables<'products'>
type FilaImagen = Tables<'product_images'>
type FilaPedido = Tables<'orders'>
type FilaItem = Tables<'order_items'>

export const ESTADOS_PEDIDO = ['pendiente', 'vendido', 'cancelado'] as const
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number]

export type ImagenProducto = {
  id: FilaImagen['id']
  /** URL pública del detalle (1600 px). La arma `services/imagenes.ts` a partir de `path` (D-05, D-27). */
  url: string
  /** URL pública de la miniatura (400 px). */
  urlMiniatura: string
  /** 0 = portada. */
  orden: FilaImagen['orden']
  /** Ruta del detalle dentro del bucket `productos` (o `/seed/…` en las semillas, D-27). */
  path: FilaImagen['path']
  pathMiniatura: FilaImagen['path_miniatura']
}

/** Lo que ve el cliente en el catálogo y en el detalle. Nunca incluye costos. */
export type ProductoCatalogo = {
  id: FilaProducto['id']
  nombre: FilaProducto['nombre']
  descripcion: FilaProducto['descripcion']
  precio: FilaProducto['precio']
  stock: FilaProducto['stock']
  /** Ordenadas por `orden`; la primera es la portada. */
  imagenes: ImagenProducto[]
  /** Nombres de las etiquetas, en minúsculas. */
  etiquetas: string[]
}

/** Tarjeta de la grilla del catálogo: solo la miniatura de la portada. */
export type ProductoVidriera = {
  id: FilaProducto['id']
  nombre: FilaProducto['nombre']
  precio: FilaProducto['precio']
  stock: FilaProducto['stock']
  agotado: boolean
  /** Miniatura (400 px) de la imagen de menor `orden`; `null` si no tiene imágenes. */
  portadaUrl: string | null
  /** En el orden de `Vidriera.etiquetas`. */
  etiquetas: string[]
}

/** Lo que carga el catálogo una sola vez (D-11). */
export type Vidriera = {
  productos: ProductoVidriera[]
  /** Etiquetas que usa algún producto activo, de la más vieja a la más nueva (D-36). */
  etiquetas: string[]
}

/** Producto completo para el panel de la administradora. */
export type Producto = ProductoCatalogo & {
  activo: FilaProducto['activo']
  /** `null` si todavía no se cargó el costo. */
  costo: number | null
  creadoEn: FilaProducto['created_at']
  actualizadoEn: FilaProducto['updated_at']
}

/** Ítem de un pedido con el precio y el costo vigentes al crearlo (solo lo lee la administradora). */
export type ItemPedido = {
  productoId: FilaItem['product_id']
  nombre: string
  cantidad: FilaItem['cantidad']
  precioUnitario: FilaItem['precio_unitario']
  costoUnitario: FilaItem['costo_unitario']
  subtotal: number
}

export type Pedido = {
  id: FilaPedido['id']
  numero: FilaPedido['numero']
  estado: EstadoPedido
  cliente: FilaPedido['cliente']
  telefono: FilaPedido['telefono']
  total: FilaPedido['total']
  creadoEn: FilaPedido['created_at']
  vendidoEn: FilaPedido['vendido_at']
  canceladoEn: FilaPedido['cancelado_at']
  items: ItemPedido[]
}

// ---------------------------------------------------------------------------
// crear_pedido
// ---------------------------------------------------------------------------

/** Lo que manda el navegador: producto y cantidad, nunca precios. */
export type LineaPedido = {
  productoId: string
  cantidad: number
}

export type ErrorCrearPedido =
  | { tipo: 'inexistente'; productoId: string }
  | { tipo: 'inactivo'; productoId: string; nombre: string }
  | { tipo: 'stock_insuficiente'; productoId: string; nombre: string; disponible: number; pedido: number }
  | { tipo: 'precio_cambiado' }

export type PedidoCreado = {
  id: string
  numero: number
  total: number
  cliente: string
  items: Omit<ItemPedido, 'costoUnitario'>[]
}

export type ResultadoCrearPedido =
  | { ok: true; pedido: PedidoCreado }
  | {
      ok: false
      errores: ErrorCrearPedido[]
      /** Solo con `precio_cambiado` (D-24). */
      precios?: { productoId: string; precio: number }[]
      totalActual?: number
    }

/**
 * Forma exacta del jsonb que devuelve `public.crear_pedido` (snake_case). El servicio de pedidos
 * la valida y la convierte a `ResultadoCrearPedido`.
 */
export type RespuestaCrearPedidoRpc =
  | {
      ok: true
      pedido: {
        id: string
        numero: number
        total: number
        cliente: string
        items: { producto_id: string; nombre: string; cantidad: number; precio_unitario: number; subtotal: number }[]
      }
    }
  | {
      ok: false
      errores: (
        | { tipo: 'inexistente'; producto_id: string }
        | { tipo: 'inactivo'; producto_id: string; nombre: string }
        | { tipo: 'stock_insuficiente'; producto_id: string; nombre: string; disponible: number; pedido: number }
        | { tipo: 'precio_cambiado' }
      )[]
      precios?: { producto_id: string; precio: number }[]
      total_actual?: number
    }

/** Cambio de stock que devuelven `marcar_vendido` y `cancelar_pedido`. */
export type CambioStock = {
  productoId: string
  nombre: string
  desde: number
  hasta: number
}

/** Sesión de la administradora. Solo existe si la cuenta tiene `app_metadata.role = 'admin'`. */
export type SesionAdmin = {
  email: string
}

/** Ajustes > WhatsApp de la tienda (tabla `settings`, D-34). */
export type AjustesWhatsApp = {
  /** Solo dígitos, con código de país (ej. `5491100000000`). Vacío si todavía no se configuró. */
  numero: string
  /** Plantilla con `{pedido}`, `{items}`, `{total}` y `{nombre}`. */
  mensaje: string
}

/** Etiqueta con la cantidad de productos que la usan (autocompletado del formulario). */
export type EtiquetaConUso = {
  nombre: string
  usos: number
}

/** Lo que manda el formulario de producto a `guardar_producto` (D-16). */
export type DatosProducto = {
  /** Generado en el navegador al crear (`crypto.randomUUID()`), así las fotos se suben antes. */
  id: string
  nombre: string
  descripcion: string
  precio: number
  costo: number
  stock: number
  activo: boolean
  etiquetas: string[]
  /** En orden: la primera es la portada. */
  imagenes: { path: string; pathMiniatura: string }[]
}
