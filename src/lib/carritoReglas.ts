// Reglas del carrito (prototipo: `stockIssues`, `fixCart`). Funciones puras: reciben las líneas
// guardadas y los productos leídos de la base.
import type { ErrorCrearPedido, LineaCarrito, ProblemaCarrito, ProductoCarrito } from '@/types/dominio'

/** Nombre a mostrar de una pieza que ya no se puede leer (se desactivó). */
export const PIEZA_NO_DISPONIBLE = 'Pieza no disponible'

function textoAgotado(nombre: string): string {
  return `${nombre}: se agotó. Quitalo del carrito para seguir.`
}

function textoExcede(nombre: string, disponible: number, pedido: number): string {
  return `${nombre}: quedan ${disponible} y pediste ${pedido}. Bajá la cantidad.`
}

function porId(productos: ProductoCarrito[]): Map<string, ProductoCarrito> {
  return new Map(productos.map((p) => [p.id, p]))
}

/**
 * Líneas que no se pueden pedir: agotadas (o desactivadas, que no vienen de la base) y las que
 * piden más que el stock. `nombres` completa el nombre de las desactivadas si se conoce (lo
 * devuelve `crear_pedido` al rechazar).
 */
export function detectarProblemas(
  lineas: LineaCarrito[],
  productos: ProductoCarrito[],
  nombres: ReadonlyMap<string, string> = new Map(),
): ProblemaCarrito[] {
  const mapa = porId(productos)
  const problemas: ProblemaCarrito[] = []
  for (const linea of lineas) {
    const p = mapa.get(linea.productoId)
    if (p === undefined || p.stock <= 0) {
      const nombre = p?.nombre ?? nombres.get(linea.productoId) ?? PIEZA_NO_DISPONIBLE
      problemas.push({
        productoId: linea.productoId,
        tipo: 'agotado',
        disponible: 0,
        texto: textoAgotado(nombre),
      })
    } else if (linea.cantidad > p.stock) {
      problemas.push({
        productoId: linea.productoId,
        tipo: 'excede',
        disponible: p.stock,
        texto: textoExcede(p.nombre, p.stock, linea.cantidad),
      })
    }
  }
  return problemas
}

/** Lo mismo que `detectarProblemas`, pero con lo que contestó `crear_pedido` al rechazar. */
export function problemasDesdeRechazo(errores: ErrorCrearPedido[]): ProblemaCarrito[] {
  return errores.flatMap((e): ProblemaCarrito[] => {
    switch (e.tipo) {
      case 'precio_cambiado':
        return []
      case 'inexistente':
        return [{ productoId: e.productoId, tipo: 'agotado', disponible: 0, texto: textoAgotado(PIEZA_NO_DISPONIBLE) }]
      case 'inactivo':
        return [{ productoId: e.productoId, tipo: 'agotado', disponible: 0, texto: textoAgotado(e.nombre) }]
      case 'stock_insuficiente':
        return [
          e.disponible <= 0
            ? { productoId: e.productoId, tipo: 'agotado', disponible: 0, texto: textoAgotado(e.nombre) }
            : {
                productoId: e.productoId,
                tipo: 'excede',
                disponible: e.disponible,
                texto: textoExcede(e.nombre, e.disponible, e.pedido),
              },
        ]
    }
  })
}

/** Saca las agotadas y baja cada cantidad al stock disponible. */
export function ajustarAlStock(lineas: LineaCarrito[], productos: ProductoCarrito[]): LineaCarrito[] {
  const mapa = porId(productos)
  return lineas.flatMap((l) => {
    const p = mapa.get(l.productoId)
    if (p === undefined || p.stock <= 0) return []
    return [{ productoId: l.productoId, cantidad: Math.min(l.cantidad, p.stock) }]
  })
}

/** Total con los precios actuales. Las piezas que no se pueden leer no suman. */
export function calcularTotal(
  lineas: LineaCarrito[],
  productos: Pick<ProductoCarrito, 'id' | 'precio'>[],
): number {
  const mapa = new Map(productos.map((p) => [p.id, p]))
  return lineas.reduce((total, l) => total + (mapa.get(l.productoId)?.precio ?? 0) * l.cantidad, 0)
}

/** "1 pieza" / "3 piezas". */
export function textoPiezas(n: number): string {
  return n === 1 ? '1 pieza' : `${n} piezas`
}
