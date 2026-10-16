// Lista y detalle de pedidos del panel (prototipo: bloques `ol` y `od` de `renderVals`).
// Búsqueda y filtro en el navegador (D-38).
import { normalizarTexto } from '@/lib/formato'
import type { EstadoPedido, ItemPedidoDetalle, PedidoResumen } from '@/types/dominio'

export const FILTROS_PEDIDOS = [
  { valor: 'pendiente', texto: 'Pendientes' },
  { valor: 'vendido', texto: 'Vendidos' },
  { valor: 'cancelado', texto: 'Cancelados' },
  { valor: 'todos', texto: 'Todos' },
] as const

export type FiltroPedidos = (typeof FILTROS_PEDIDOS)[number]['valor']

export function esFiltroPedidos(valor: string | null): valor is FiltroPedidos {
  return FILTROS_PEDIDOS.some((f) => f.valor === valor)
}

export const TEXTO_ESTADO: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  vendido: 'Vendido',
  cancelado: 'Cancelado',
}

/**
 * "Lucía" → `{ texto: 'lucia', numero: null }`; "#0007" o "0007" → `{ texto: '0007', numero: '7' }`.
 * Un número busca por prefijo del número de pedido (además de por nombre).
 */
export function normalizarBusquedaPedido(q: string): { texto: string; numero: string | null } {
  const texto = normalizarTexto(q).replace(/^#/, '')
  return { texto, numero: /^\d+$/.test(texto) ? String(Number.parseInt(texto, 10)) : null }
}

function coincide(p: PedidoResumen, q: string): boolean {
  const { texto, numero } = normalizarBusquedaPedido(q)
  if (texto === '') return true
  return (
    normalizarTexto(p.cliente).includes(texto) || (numero !== null && String(p.numero).startsWith(numero))
  )
}

export function filtrarPedidos(
  lista: PedidoResumen[],
  { estado, q }: { estado: FiltroPedidos; q: string },
): PedidoResumen[] {
  return lista.filter((p) => coincide(p, q) && (estado === 'todos' || p.estado === estado))
}

/** Contadores de los chips, con la búsqueda aplicada. */
export function contarPorEstado(lista: PedidoResumen[], q: string): Record<FiltroPedidos, number> {
  const buscados = lista.filter((p) => coincide(p, q))
  return {
    pendiente: buscados.filter((p) => p.estado === 'pendiente').length,
    vendido: buscados.filter((p) => p.estado === 'vendido').length,
    cancelado: buscados.filter((p) => p.estado === 'cancelado').length,
    todos: buscados.length,
  }
}

const VACIOS: Record<FiltroPedidos, [string, string]> = {
  pendiente: ['No hay pedidos pendientes', 'Cuando un cliente confirme un pedido desde el catálogo, aparece acá.'],
  vendido: ['Todavía no hay ventas', 'Marcá un pedido pendiente como vendido y lo vas a ver en esta lista.'],
  cancelado: ['No hay pedidos cancelados', 'Mejor así.'],
  todos: ['Todavía no hay pedidos', 'Cuando un cliente confirme un pedido, aparece acá.'],
}

/** Título y texto del vacío de la lista (prototipo: `EMPTY` y la variante con búsqueda). */
export function textoVacioPedidos(estado: FiltroPedidos, q: string): { titulo: string; texto: string } {
  const buscado = q.trim()
  if (buscado === '') {
    const [titulo, texto] = VACIOS[estado]
    return { titulo, texto }
  }
  return {
    titulo: 'Sin resultados',
    texto: `No hay pedidos ${estado === 'todos' ? '' : 'en este estado '}para «${buscado}». Buscá por nombre del cliente o por número (ej. 7 o #0007).`,
  }
}

type ItemConCosto = Pick<ItemPedidoDetalle, 'cantidad' | 'precioUnitario' | 'costoUnitario'>

/** Ganancia estimada con el precio y el costo guardados al crear el pedido. */
export function calcularGanancia(items: ItemConCosto[]): number {
  return items.reduce((total, i) => total + i.cantidad * (i.precioUnitario - i.costoUnitario), 0)
}

/** Ítems que no se pueden vender con el stock actual. */
export function faltantesDeStock<T extends Pick<ItemPedidoDetalle, 'cantidad' | 'stockActual'>>(items: T[]): T[] {
  return items.filter((i) => i.stockActual < i.cantidad)
}

/** "1 unidad" / "3 unidades". */
export function textoUnidades(n: number): string {
  return n === 1 ? '1 unidad' : `${n} unidades`
}

/** Texto de la confirmación inline de "Cancelar pedido". */
export function textoConfirmacionCancelar(estado: EstadoPedido, unidades: number): string {
  return estado === 'vendido'
    ? `Ya estaba vendido: se van a reponer ${textoUnidades(unidades)} al stock. Después no se puede volver a vender.`
    : 'Todavía no se vendió, así que el stock no cambia. Un pedido cancelado no se puede volver a vender.'
}

/**
 * Teléfono del cliente para `wa.me` (D-38): solo dígitos, sin el 0 de larga distancia; si no
 * empieza con 54, se asume celular argentino y se antepone 549.
 */
export function telefonoParaWhatsApp(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '').replace(/^0+/, '')
  return digitos.startsWith('54') ? digitos : `549${digitos}`
}
