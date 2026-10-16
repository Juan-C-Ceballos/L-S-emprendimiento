// Carrito guardado en el navegador (localStorage). No usa Supabase y nunca guarda precios: solo
// producto y cantidad. Los precios se leen de la base cada vez que se muestran.
import { z } from 'zod'
import type { LineaCarrito } from '@/types/dominio'

export const CLAVE_CARRITO = 'ls:carrito:v1'

const esquemaCarrito = z.array(
  z.object({
    productoId: z.guid(),
    cantidad: z.int().min(1).max(999_999),
  }),
)

/** Lee el carrito. Si lo guardado está roto (o lo editaron a mano), lo vacía. */
export function leerCarrito(): LineaCarrito[] {
  let crudo: string | null
  try {
    crudo = localStorage.getItem(CLAVE_CARRITO)
  } catch {
    return []
  }
  if (crudo === null) return []
  try {
    const resultado = esquemaCarrito.safeParse(JSON.parse(crudo))
    if (resultado.success) return resultado.data
  } catch {
    // JSON inválido: se vacía abajo.
  }
  vaciarCarrito()
  return []
}

/** Reemplaza el carrito entero (por ejemplo, al ajustarlo al stock disponible). */
export function guardarCarrito(lineas: LineaCarrito[]): void {
  try {
    if (lineas.length === 0) localStorage.removeItem(CLAVE_CARRITO)
    else
      localStorage.setItem(
        CLAVE_CARRITO,
        JSON.stringify(lineas.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad }))),
      )
  } catch {
    // Sin almacenamiento (modo privado estricto): el carrito vive solo en memoria.
  }
}

/**
 * Suma unidades sin pasar de `maxDisponible` (el stock) contando lo que ya había.
 * Devuelve cuántas se agregaron de verdad (0 si ya estaba todo el stock).
 * Punto de extensión (fuera del MVP): un tope de unidades por pedido iría acá.
 */
export function agregarAlCarrito(productoId: string, cantidad: number, maxDisponible: number): number {
  const lineas = leerCarrito()
  const actual = lineas.find((l) => l.productoId === productoId)?.cantidad ?? 0
  const agregada = Math.max(0, Math.min(cantidad, maxDisponible - actual))
  if (agregada === 0) return 0
  guardarCarrito(
    actual === 0
      ? [...lineas, { productoId, cantidad: agregada }]
      : lineas.map((l) => (l.productoId === productoId ? { productoId, cantidad: actual + agregada } : l)),
  )
  return agregada
}

/** Cambia la cantidad de una línea (mínimo 1). */
export function cambiarCantidad(productoId: string, cantidad: number): void {
  guardarCarrito(
    leerCarrito().map((l) =>
      l.productoId === productoId ? { productoId, cantidad: Math.max(1, Math.floor(cantidad)) } : l,
    ),
  )
}

export function quitarDelCarrito(productoId: string): void {
  guardarCarrito(leerCarrito().filter((l) => l.productoId !== productoId))
}

export function vaciarCarrito(): void {
  guardarCarrito([])
}

export function contarPiezas(lineas: LineaCarrito[]): number {
  return lineas.reduce((total, l) => total + l.cantidad, 0)
}
