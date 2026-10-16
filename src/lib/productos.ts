import { STOCK_BAJO } from '@/lib/constantes'
import { normalizarEtiqueta, normalizarTexto } from '@/lib/formato'
import type { EtiquetaConUso, Producto } from '@/types/dominio'

export const FILTROS_PRODUCTOS = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'activos', texto: 'Activos' },
  { valor: 'inactivos', texto: 'Inactivos' },
  { valor: 'stock-bajo', texto: 'Stock bajo' },
] as const

export type FiltroProductos = (typeof FILTROS_PRODUCTOS)[number]['valor']

export function esFiltroProductos(valor: string | null): valor is FiltroProductos {
  return FILTROS_PRODUCTOS.some((f) => f.valor === valor)
}

type ProductoFiltrable = Pick<Producto, 'nombre' | 'activo' | 'stock' | 'etiquetas'>

function coincideBusqueda(p: ProductoFiltrable, q: string): boolean {
  const buscado = normalizarTexto(q)
  if (buscado === '') return true
  return (
    normalizarTexto(p.nombre).includes(buscado) ||
    p.etiquetas.some((e) => normalizarTexto(e).includes(buscado))
  )
}

function cumpleFiltro(p: ProductoFiltrable, filtro: FiltroProductos): boolean {
  switch (filtro) {
    case 'todos':
      return true
    case 'activos':
      return p.activo
    case 'inactivos':
      return !p.activo
    case 'stock-bajo':
      return p.activo && p.stock <= STOCK_BAJO
  }
}

/** Lista del panel: búsqueda por nombre o etiqueta (sin tildes) + filtro de estado. */
export function filtrarProductosAdmin<T extends ProductoFiltrable>(
  lista: T[],
  filtro: FiltroProductos,
  q: string,
): T[] {
  return lista.filter((p) => coincideBusqueda(p, q) && cumpleFiltro(p, filtro))
}

/** Cuántos productos hay en cada filtro, con la búsqueda aplicada (contadores de los chips). */
export function contarPorFiltro(
  lista: ProductoFiltrable[],
  q: string,
): Record<FiltroProductos, number> {
  const buscados = lista.filter((p) => coincideBusqueda(p, q))
  return {
    todos: buscados.length,
    activos: buscados.filter((p) => cumpleFiltro(p, 'activos')).length,
    inactivos: buscados.filter((p) => cumpleFiltro(p, 'inactivos')).length,
    'stock-bajo': buscados.filter((p) => cumpleFiltro(p, 'stock-bajo')).length,
  }
}

export type Margen = { ganancia: number; porcentaje: number; negativo: boolean }

/** Ganancia por unidad. `null` si falta el precio o el costo, o si el precio es 0. */
export function calcularMargen(precio: number | null, costo: number | null): Margen | null {
  if (precio === null || costo === null || precio <= 0) return null
  const ganancia = precio - costo
  return { ganancia, porcentaje: Math.round((ganancia / precio) * 100), negativo: ganancia < 0 }
}

/** Hasta 10 etiquetas que contienen lo escrito, sin las ya elegidas. Sin texto: las que ya se usan. */
export function sugerirEtiquetas(
  todas: EtiquetaConUso[],
  elegidas: string[],
  q: string,
): EtiquetaConUso[] {
  const buscado = normalizarEtiqueta(q)
  return todas
    .filter((e) => !elegidas.includes(e.nombre) && (buscado === '' || e.nombre.includes(buscado)))
    .slice(0, 10)
}

/** Texto del pill de stock y su variante (prototipo: `.pill.out/.low/.ok`). */
export function estadoStock(stock: number): { texto: string; tipo: 'agotado' | 'bajo' | 'ok' } {
  if (stock <= 0) return { texto: 'Agotado', tipo: 'agotado' }
  if (stock <= STOCK_BAJO) return { texto: `Quedan ${stock}`, tipo: 'bajo' }
  return { texto: `${stock} en stock`, tipo: 'ok' }
}
