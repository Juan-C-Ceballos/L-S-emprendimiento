import { beforeEach, describe, expect, it } from 'vitest'
import {
  agregarAlCarrito,
  cambiarCantidad,
  CLAVE_CARRITO,
  contarPiezas,
  leerCarrito,
  quitarDelCarrito,
  vaciarCarrito,
} from './carrito'

const A = '00000000-0000-4000-8000-000000000001'
const B = '00000000-0000-4000-8000-000000000005'

beforeEach(() => {
  localStorage.clear()
})

describe('carrito en localStorage', () => {
  it('agrega con tope en el stock y devuelve lo agregado', () => {
    expect(agregarAlCarrito(A, 2, 5)).toBe(2)
    expect(agregarAlCarrito(A, 4, 5)).toBe(3)
    expect(agregarAlCarrito(A, 1, 5)).toBe(0)
    expect(agregarAlCarrito(B, 1, 2)).toBe(1)
    expect(leerCarrito()).toEqual([
      { productoId: A, cantidad: 5 },
      { productoId: B, cantidad: 1 },
    ])
    expect(contarPiezas(leerCarrito())).toBe(6)
  })

  it('guarda solo producto y cantidad, nunca precios', () => {
    agregarAlCarrito(A, 1, 3)
    expect(JSON.parse(localStorage.getItem(CLAVE_CARRITO) ?? '')).toEqual([{ productoId: A, cantidad: 1 }])
  })

  it('cambia la cantidad (mínimo 1), quita y vacía', () => {
    agregarAlCarrito(A, 2, 5)
    agregarAlCarrito(B, 1, 5)
    cambiarCantidad(A, 4)
    expect(leerCarrito()[0]).toEqual({ productoId: A, cantidad: 4 })
    cambiarCantidad(A, 0)
    expect(leerCarrito()[0]).toEqual({ productoId: A, cantidad: 1 })
    quitarDelCarrito(A)
    expect(leerCarrito()).toEqual([{ productoId: B, cantidad: 1 }])
    vaciarCarrito()
    expect(leerCarrito()).toEqual([])
    expect(localStorage.getItem(CLAVE_CARRITO)).toBeNull()
  })

  it.each([
    ['JSON roto', '{no es json'],
    ['no es una lista', '{"productoId":"x"}'],
    ['id inválido', '[{"productoId":"abc","cantidad":1}]'],
    ['cantidad inválida', `[{"productoId":"${A}","cantidad":0}]`],
  ])('si lo guardado está corrupto (%s), lo vacía', (_, crudo) => {
    localStorage.setItem(CLAVE_CARRITO, crudo)
    expect(leerCarrito()).toEqual([])
    expect(localStorage.getItem(CLAVE_CARRITO)).toBeNull()
  })

  it('un precio agregado a mano se descarta al leer', () => {
    localStorage.setItem(CLAVE_CARRITO, `[{"productoId":"${A}","cantidad":1,"precio":1}]`)
    expect(leerCarrito()).toEqual([{ productoId: A, cantidad: 1 }])
  })
})
