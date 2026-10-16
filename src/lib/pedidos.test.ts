import { describe, expect, it } from 'vitest'
import {
  calcularGanancia,
  contarPorEstado,
  faltantesDeStock,
  filtrarPedidos,
  normalizarBusquedaPedido,
  telefonoParaWhatsApp,
  textoConfirmacionCancelar,
  textoVacioPedidos,
} from './pedidos'
import type { EstadoPedido, PedidoResumen } from '@/types/dominio'

const pedido = (numero: number, cliente: string, estado: EstadoPedido): PedidoResumen => ({
  id: `o${numero}`,
  numero,
  estado,
  cliente,
  telefono: '351 000-0000',
  total: 10000,
  creadoEn: '2026-10-15T12:00:00Z',
})

// Las semillas, de la más nueva a la más vieja.
const PEDIDOS = [
  pedido(6, 'Julieta Ortiz', 'pendiente'),
  pedido(5, 'Lucía Benítez', 'pendiente'),
  pedido(4, 'Valentina Paz', 'vendido'),
  pedido(3, 'Sofía Herrera', 'vendido'),
  pedido(2, 'Martina Gómez', 'cancelado'),
  pedido(1, 'Camila Ríos', 'vendido'),
]

const numeros = (lista: PedidoResumen[]) => lista.map((p) => p.numero)

describe('búsqueda y filtro de pedidos', () => {
  it('normaliza la búsqueda: tildes, # y ceros a la izquierda', () => {
    expect(normalizarBusquedaPedido(' Lucía ')).toEqual({ texto: 'lucia', numero: null })
    expect(normalizarBusquedaPedido('#0007')).toEqual({ texto: '0007', numero: '7' })
    expect(normalizarBusquedaPedido('12')).toEqual({ texto: '12', numero: '12' })
  })

  it('filtra por estado con los resultados de las semillas', () => {
    expect(numeros(filtrarPedidos(PEDIDOS, { estado: 'pendiente', q: '' }))).toEqual([6, 5])
    expect(numeros(filtrarPedidos(PEDIDOS, { estado: 'vendido', q: '' }))).toEqual([4, 3, 1])
    expect(numeros(filtrarPedidos(PEDIDOS, { estado: 'cancelado', q: '' }))).toEqual([2])
    expect(contarPorEstado(PEDIDOS, '')).toEqual({ pendiente: 2, vendido: 3, cancelado: 1, todos: 6 })
  })

  it('busca por número (prefijo) o por cliente sin tildes', () => {
    for (const q of ['6', '#0006', '0006']) {
      expect(numeros(filtrarPedidos(PEDIDOS, { estado: 'todos', q }))).toEqual([6])
    }
    expect(numeros(filtrarPedidos(PEDIDOS, { estado: 'todos', q: 'lucia' }))).toEqual([5])
    const muchos = [...PEDIDOS, pedido(12, 'Ana', 'pendiente'), pedido(21, 'Bea', 'pendiente')]
    expect(numeros(filtrarPedidos(muchos, { estado: 'todos', q: '1' }))).toEqual([1, 12])
  })

  it('los contadores respetan la búsqueda', () => {
    expect(contarPorEstado(PEDIDOS, 'ia')).toEqual({ pendiente: 1, vendido: 1, cancelado: 0, todos: 2 })
  })

  it('textos del vacío', () => {
    expect(textoVacioPedidos('cancelado', '')).toEqual({ titulo: 'No hay pedidos cancelados', texto: 'Mejor así.' })
    expect(textoVacioPedidos('vendido', ' zoe ')).toEqual({
      titulo: 'Sin resultados',
      texto: 'No hay pedidos en este estado para «zoe». Buscá por nombre del cliente o por número (ej. 7 o #0007).',
    })
    expect(textoVacioPedidos('todos', 'zoe').texto).toMatch(/^No hay pedidos para «zoe»/)
  })
})

describe('detalle', () => {
  it('ganancia con el precio y el costo del momento', () => {
    expect(
      calcularGanancia([
        { cantidad: 1, precioUnitario: 13900, costoUnitario: 5000 },
        { cantidad: 2, precioUnitario: 17600, costoUnitario: 6300 },
      ]),
    ).toBe(8900 + 2 * 11300)
  })

  it('faltantes de stock', () => {
    const items = [
      { nombre: 'a', cantidad: 2, stockActual: 2 },
      { nombre: 'b', cantidad: 2, stockActual: 1 },
    ]
    expect(faltantesDeStock(items).map((i) => i.nombre)).toEqual(['b'])
  })

  it('texto de la confirmación de cancelar', () => {
    expect(textoConfirmacionCancelar('vendido', 3)).toBe(
      'Ya estaba vendido: se van a reponer 3 unidades al stock. Después no se puede volver a vender.',
    )
    expect(textoConfirmacionCancelar('pendiente', 1)).toBe(
      'Todavía no se vendió, así que el stock no cambia. Un pedido cancelado no se puede volver a vender.',
    )
  })

  it('teléfono del cliente para WhatsApp', () => {
    expect(telefonoParaWhatsApp('351 612-4488')).toBe('5493516124488')
    expect(telefonoParaWhatsApp('011 5932-0418')).toBe('5491159320418')
    expect(telefonoParaWhatsApp('+54 9 351 612-4488')).toBe('5493516124488')
  })
})
