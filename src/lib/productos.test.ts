import { describe, expect, it } from 'vitest'
import {
  calcularMargen,
  contarPorFiltro,
  estadoStock,
  filtrarProductosAdmin,
  sugerirEtiquetas,
} from './productos'

const LISTA = [
  { nombre: 'Argollas clásicas doradas', activo: true, stock: 12, etiquetas: ['aros', 'dorado'] },
  { nombre: 'Aros perla mini', activo: true, stock: 2, etiquetas: ['aros', 'perlas'] },
  { nombre: 'Cadena fígaro', activo: true, stock: 0, etiquetas: ['cadenas'] },
  { nombre: 'Anillo sello', activo: false, stock: 1, etiquetas: ['anillos', 'plateado'] },
]

const nombres = (l: { nombre: string }[]) => l.map((p) => p.nombre)

describe('filtrarProductosAdmin', () => {
  it('filtra por estado', () => {
    expect(filtrarProductosAdmin(LISTA, 'todos', '')).toHaveLength(4)
    expect(nombres(filtrarProductosAdmin(LISTA, 'inactivos', ''))).toEqual(['Anillo sello'])
    expect(filtrarProductosAdmin(LISTA, 'activos', '')).toHaveLength(3)
  })

  it('stock bajo son los activos con 3 o menos (incluye agotados, no inactivos)', () => {
    expect(nombres(filtrarProductosAdmin(LISTA, 'stock-bajo', ''))).toEqual([
      'Aros perla mini',
      'Cadena fígaro',
    ])
  })

  it('busca en nombre y etiquetas, sin tildes ni mayúsculas', () => {
    expect(nombres(filtrarProductosAdmin(LISTA, 'todos', 'FIGARO'))).toEqual(['Cadena fígaro'])
    expect(nombres(filtrarProductosAdmin(LISTA, 'todos', 'perlas'))).toEqual(['Aros perla mini'])
    expect(filtrarProductosAdmin(LISTA, 'activos', 'plateado')).toHaveLength(0)
  })
})

describe('contarPorFiltro', () => {
  it('cuenta cada filtro con la búsqueda aplicada', () => {
    expect(contarPorFiltro(LISTA, '')).toEqual({ todos: 4, activos: 3, inactivos: 1, 'stock-bajo': 2 })
    expect(contarPorFiltro(LISTA, 'aros')).toEqual({ todos: 2, activos: 2, inactivos: 0, 'stock-bajo': 1 })
  })
})

describe('calcularMargen', () => {
  it('calcula ganancia y porcentaje', () => {
    expect(calcularMargen(14500, 5200)).toEqual({ ganancia: 9300, porcentaje: 64, negativo: false })
  })

  it('marca el margen negativo', () => {
    expect(calcularMargen(1000, 1500)).toEqual({ ganancia: -500, porcentaje: -50, negativo: true })
  })

  it('sin precio, sin costo o con precio 0 no hay margen', () => {
    expect(calcularMargen(null, 100)).toBeNull()
    expect(calcularMargen(100, null)).toBeNull()
    expect(calcularMargen(0, 0)).toBeNull()
  })
})

describe('sugerirEtiquetas', () => {
  const TODAS = [
    { nombre: 'aros', usos: 5 },
    { nombre: 'dorado', usos: 7 },
    { nombre: 'plateado', usos: 3 },
  ]

  it('sin texto sugiere las que no están elegidas', () => {
    expect(nombres2(sugerirEtiquetas(TODAS, ['aros'], ''))).toEqual(['dorado', 'plateado'])
  })

  it('con texto sugiere las que lo contienen, normalizado', () => {
    expect(nombres2(sugerirEtiquetas(TODAS, [], '  ADO '))).toEqual(['dorado', 'plateado'])
  })

  it('como mucho 10', () => {
    const muchas = Array.from({ length: 15 }, (_, i) => ({ nombre: `e${i}`, usos: 1 }))
    expect(sugerirEtiquetas(muchas, [], 'e')).toHaveLength(10)
  })
})

function nombres2(l: { nombre: string }[]) {
  return l.map((e) => e.nombre)
}

describe('estadoStock', () => {
  it('agotado, quedan pocas u ok', () => {
    expect(estadoStock(0)).toEqual({ texto: 'Agotado', tipo: 'agotado' })
    expect(estadoStock(3)).toEqual({ texto: 'Quedan 3', tipo: 'bajo' })
    expect(estadoStock(4)).toEqual({ texto: '4 en stock', tipo: 'ok' })
  })
})
