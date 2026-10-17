import { createContext, use } from 'react'
import type { LineaCarrito } from '@/types/dominio'

export type ContextoCarrito = {
  lineas: LineaCarrito[]
  piezas: number
  /** Cuántas unidades tiene este producto en el carrito. */
  enCarrito: (productoId: string) => number
  /** Devuelve las unidades que se agregaron de verdad (tope: `maxDisponible`, el stock). */
  agregar: (productoId: string, cantidad: number, maxDisponible: number) => number
  cambiarCantidad: (productoId: string, cantidad: number) => void
  quitar: (productoId: string) => void
  reemplazar: (lineas: LineaCarrito[]) => void
  vaciar: () => void
}

export const CarritoContext = createContext<ContextoCarrito | null>(null)

export function useCarrito(): ContextoCarrito {
  const carrito = use(CarritoContext)
  if (carrito === null) throw new Error('useCarrito tiene que usarse dentro de <CarritoProvider>.')
  return carrito
}
