// Filtro del catálogo en el navegador (D-11). Reproduce la lógica del prototipo (`renderVals`,
// bloque `cat`). El estado vive en la URL: `/?q=&tags=a,b&modo=todas|alguna`.
import { normalizarEtiqueta, normalizarTexto } from '@/lib/formato'

export const MODOS_ETIQUETAS = ['todas', 'alguna'] as const
export type ModoEtiquetas = (typeof MODOS_ETIQUETAS)[number]

export const ORDENES = [
  { valor: 'recientes', texto: 'Más nuevos' },
  { valor: 'precio-asc', texto: 'Menor precio' },
  { valor: 'precio-desc', texto: 'Mayor precio' },
] as const
export type OrdenCatalogo = (typeof ORDENES)[number]['valor']

export function esOrdenCatalogo(valor: string | null): valor is OrdenCatalogo {
  return ORDENES.some((o) => o.valor === valor)
}

export type FiltrosCatalogo = {
  q: string
  etiquetas: string[]
  modo: ModoEtiquetas
  /** No es un filtro: "Limpiar filtros" lo conserva. */
  orden: OrdenCatalogo
}

export const SIN_FILTROS: FiltrosCatalogo = { q: '', etiquetas: [], modo: 'todas', orden: 'recientes' }

type ProductoFiltrable = { nombre: string; precio: number; stock: number; etiquetas: string[] }

/** Lee los filtros de la URL. Modo desconocido → `todas`; etiquetas normalizadas y sin repetir. */
export function leerFiltrosDeURL(params: URLSearchParams): FiltrosCatalogo {
  const etiquetas = (params.get('tags') ?? '')
    .split(',')
    .map(normalizarEtiqueta)
    .filter((e, i, todas) => e !== '' && todas.indexOf(e) === i)
  const modo = params.get('modo') === 'alguna' ? 'alguna' : 'todas'
  const orden = params.get('orden')
  return { q: (params.get('q') ?? '').trim(), etiquetas, modo, orden: esOrdenCatalogo(orden) ? orden : 'recientes' }
}

/**
 * Arma la búsqueda de la URL sin los valores por defecto. Las etiquetas van separadas por comas
 * literales (`tags=aros,dorado`) para que el link compartido se lea bien.
 */
export function escribirFiltrosEnURL(filtros: FiltrosCatalogo): string {
  const params = new URLSearchParams()
  const q = filtros.q.trim()
  if (q !== '') params.set('q', q)
  if (filtros.etiquetas.length > 0) params.set('tags', filtros.etiquetas.join(','))
  if (filtros.modo !== 'todas') params.set('modo', filtros.modo)
  if (filtros.orden !== 'recientes') params.set('orden', filtros.orden)
  return params.toString().replaceAll('%2C', ',')
}

/** Saca las etiquetas de la URL que ningún producto activo usa (link viejo o mal escrito). */
export function quitarEtiquetasDesconocidas(
  filtros: FiltrosCatalogo,
  usadas: string[],
): FiltrosCatalogo {
  const etiquetas = filtros.etiquetas.filter((e) => usadas.includes(e))
  return etiquetas.length === filtros.etiquetas.length ? filtros : { ...filtros, etiquetas }
}

export function hayFiltros(filtros: FiltrosCatalogo): boolean {
  return filtros.q.trim() !== '' || filtros.etiquetas.length > 0
}

function coincideNombre(p: ProductoFiltrable, q: string): boolean {
  const buscado = normalizarTexto(q)
  return buscado === '' || normalizarTexto(p.nombre).includes(buscado)
}

function coincideEtiquetas(p: ProductoFiltrable, filtros: FiltrosCatalogo): boolean {
  const { etiquetas, modo } = filtros
  if (etiquetas.length === 0) return true
  return modo === 'todas'
    ? etiquetas.every((e) => p.etiquetas.includes(e))
    : etiquetas.some((e) => p.etiquetas.includes(e))
}

/**
 * Búsqueda por nombre (sin tildes) + etiquetas Y/O, ordenado por precio si se pidió (si no, queda
 * el orden de la base: más nuevos primero). Los agotados van siempre al final.
 */
export function aplicarFiltros<T extends ProductoFiltrable>(productos: T[], filtros: FiltrosCatalogo): T[] {
  const resultado = productos.filter((p) => coincideNombre(p, filtros.q) && coincideEtiquetas(p, filtros))
  if (filtros.orden !== 'recientes') {
    const signo = filtros.orden === 'precio-asc' ? 1 : -1
    // `sort` es estable: a igual precio se mantiene el orden de la base.
    resultado.sort((a, b) => signo * (a.precio - b.precio))
  }
  return [...resultado.filter((p) => p.stock > 0), ...resultado.filter((p) => p.stock <= 0)]
}

export type ChipEtiquetaDisponible = { nombre: string; cantidad: number }

/**
 * Chips disponibles con su contador (regla del prototipo): las etiquetas usadas y no elegidas
 * que coinciden con el buscador de etiquetas. Con modo `todas` y alguna elegida, cuentan sobre el
 * resultado actual (cuántas quedarían si se suma esa); si no, sobre los que pasan la búsqueda
 * por nombre.
 */
export function contarEtiquetas(
  productos: ProductoFiltrable[],
  etiquetasUsadas: string[],
  filtros: FiltrosCatalogo,
  buscadaEtiqueta = '',
): ChipEtiquetaDisponible[] {
  const base =
    filtros.modo === 'todas' && filtros.etiquetas.length > 0
      ? aplicarFiltros(productos, filtros)
      : productos.filter((p) => coincideNombre(p, filtros.q))
  const buscada = normalizarTexto(buscadaEtiqueta)
  return etiquetasUsadas
    .filter((e) => !filtros.etiquetas.includes(e) && (buscada === '' || normalizarTexto(e).includes(buscada)))
    .map((nombre) => ({ nombre, cantidad: base.filter((p) => p.etiquetas.includes(nombre)).length }))
}

/** Enter en el buscador de etiquetas: la que coincide exacto, o la primera disponible. */
export function etiquetaParaEnter(
  disponibles: ChipEtiquetaDisponible[],
  buscadaEtiqueta: string,
): string | undefined {
  const buscada = normalizarTexto(buscadaEtiqueta)
  return (disponibles.find((c) => normalizarTexto(c.nombre) === buscada) ?? disponibles[0])?.nombre
}

function piezas(n: number): string {
  return n === 1 ? '1 pieza' : `${n} piezas`
}

/** "13 piezas en la vidriera" / "3 de 13 piezas" / "Buscando…". */
export function textoResultado(
  encontrados: number,
  total: number,
  filtros: FiltrosCatalogo,
  buscando: boolean,
): string {
  if (buscando) return 'Buscando…'
  if (hayFiltros(filtros)) return `${encontrados} de ${piezas(total)}`
  return `${piezas(total)} en la vidriera`
}

/** Pista del vacío del catálogo (prototipo: `emptyHint`). */
export function pistaVacio(filtros: FiltrosCatalogo): string {
  const q = filtros.q.trim()
  const { etiquetas } = filtros
  let motivo: string
  if (q !== '') {
    const conEtiquetas =
      etiquetas.length > 0
        ? ` con ${filtros.modo === 'todas' ? 'todas estas etiquetas: ' : 'alguna de estas etiquetas: '}${etiquetas.join(', ')}`
        : ''
    motivo = `Ninguna pieza tiene «${q}» en el nombre${conEtiquetas}.`
  } else {
    motivo = `Ninguna pieza es ${etiquetas.join(' + ')} a la vez.`
  }
  return `${motivo} Probá cambiando la búsqueda o quitando una etiqueta.`
}
