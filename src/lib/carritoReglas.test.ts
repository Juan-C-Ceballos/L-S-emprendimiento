import { describe, expect, it } from 'vitest'
import {
  ajustarAlStock,
  calcularTotal,
  detectarProblemas,
  problemasDesdeRechazo,
  textoPiezas,
} from './carritoReglas'
import type { ProductoCarrito } from '@/types/dominio'

const producto = (id: string, nombre: string, precio: number, stock: number): ProductoCarrito => ({
  id,
  nombre,
  precio,
  stock,
  miniaturaUrl: null,
})

const PRODUCTOS = [
  producto('a', 'Argollas clásicas doradas', 14500, 12),
  producto('b', 'Pulsera eslabón fino', 18900, 2),
  producto('c', 'Aros gota martillada', 16800, 0),
]

const LINEAS = [
  { productoId: 'a', cantidad: 2 },
  { productoId: 'b', cantidad: 3 },
  { productoId: 'c', cantidad: 1 },
  { productoId: 'x', cantidad: 1 },
]

describe('reglas del carrito', () => {
  it('detecta agotados, desactivados (no vienen de la base) y cantidades de más', () => {
    expect(detectarProblemas(LINEAS, PRODUCTOS, new Map([['x', 'Anillo piedra verde']]))).toEqual([
      {
        productoId: 'b',
        tipo: 'excede',
        disponible: 2,
        texto: 'Pulsera eslabón fino: quedan 2 y pediste 3. Bajá la cantidad.',
      },
      {
        productoId: 'c',
        tipo: 'agotado',
        disponible: 0,
        texto: 'Aros gota martillada: se agotó. Quitalo del carrito para seguir.',
      },
      {
        productoId: 'x',
        tipo: 'agotado',
        disponible: 0,
        texto: 'Anillo piedra verde: se agotó. Quitalo del carrito para seguir.',
      },
    ])
    expect(detectarProblemas([{ productoId: 'x', cantidad: 1 }], PRODUCTOS)[0]?.texto).toBe(
      'Pieza no disponible: se agotó. Quitalo del carrito para seguir.',
    )
    expect(detectarProblemas([{ productoId: 'a', cantidad: 12 }], PRODUCTOS)).toEqual([])
  })

  it('convierte el rechazo de la base en los mismos avisos', () => {
    expect(
      problemasDesdeRechazo([
        { tipo: 'stock_insuficiente', productoId: 'b', nombre: 'Pulsera eslabón fino', disponible: 1, pedido: 2 },
        { tipo: 'stock_insuficiente', productoId: 'c', nombre: 'Aros gota martillada', disponible: 0, pedido: 1 },
        { tipo: 'inactivo', productoId: 'x', nombre: 'Anillo piedra verde' },
        { tipo: 'precio_cambiado' },
      ]).map((p) => p.texto),
    ).toEqual([
      'Pulsera eslabón fino: quedan 1 y pediste 2. Bajá la cantidad.',
      'Aros gota martillada: se agotó. Quitalo del carrito para seguir.',
      'Anillo piedra verde: se agotó. Quitalo del carrito para seguir.',
    ])
  })

  it('ajusta al stock: saca agotados y baja cantidades', () => {
    expect(ajustarAlStock(LINEAS, PRODUCTOS)).toEqual([
      { productoId: 'a', cantidad: 2 },
      { productoId: 'b', cantidad: 2 },
    ])
  })

  it('calcula el total con los precios actuales', () => {
    expect(calcularTotal(LINEAS, PRODUCTOS)).toBe(2 * 14500 + 3 * 18900 + 16800)
    expect(calcularTotal([], PRODUCTOS)).toBe(0)
  })

  it('texto de piezas', () => {
    expect(textoPiezas(1)).toBe('1 pieza')
    expect(textoPiezas(3)).toBe('3 piezas')
  })
})
