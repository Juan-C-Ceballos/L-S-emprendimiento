import { describe, expect, it } from 'vitest'
import {
  aplicarFiltros,
  contarEtiquetas,
  escribirFiltrosEnURL,
  etiquetaParaEnter,
  leerFiltrosDeURL,
  pistaVacio,
  quitarEtiquetasDesconocidas,
  SIN_FILTROS,
  textoResultado,
  type FiltrosCatalogo,
} from './filtros'

// Subconjunto de las semillas del prototipo.
const PRODUCTOS = [
  { nombre: 'Argollas clásicas doradas', stock: 12, etiquetas: ['aros', 'dorado', 'acero'] },
  { nombre: 'Aros perla mini', stock: 8, etiquetas: ['aros', 'plateado', 'perlas'] },
  { nombre: 'Aros gota martillada', stock: 0, etiquetas: ['aros', 'dorado'] },
  { nombre: 'Abridores de acero', stock: 6, etiquetas: ['aros', 'acero'] },
  { nombre: 'Pulsera eslabón fino', stock: 2, etiquetas: ['pulseras', 'dorado', 'acero'] },
  { nombre: 'Esclava rígida plateada', stock: 5, etiquetas: ['pulseras', 'plateado'] },
]
const USADAS = ['aros', 'pulseras', 'dorado', 'plateado', 'acero', 'perlas']

function filtros(extra: Partial<FiltrosCatalogo>): FiltrosCatalogo {
  return { ...SIN_FILTROS, ...extra }
}

const nombres = (lista: { nombre: string }[]) => lista.map((p) => p.nombre)

describe('URL', () => {
  it('lee q, tags y modo', () => {
    expect(leerFiltrosDeURL(new URLSearchParams('q=perla&tags=aros,dorado&modo=alguna'))).toEqual({
      q: 'perla',
      etiquetas: ['aros', 'dorado'],
      modo: 'alguna',
    })
  })

  it('es tolerante: modo inválido, etiquetas vacías, repetidas o con mayúsculas', () => {
    expect(leerFiltrosDeURL(new URLSearchParams('tags=Aros,,aros, dorado &modo=cualquiera'))).toEqual({
      q: '',
      etiquetas: ['aros', 'dorado'],
      modo: 'todas',
    })
    expect(leerFiltrosDeURL(new URLSearchParams(''))).toEqual(SIN_FILTROS)
  })

  it('omite los valores por defecto y deja las comas legibles', () => {
    expect(escribirFiltrosEnURL(SIN_FILTROS)).toBe('')
    expect(escribirFiltrosEnURL(filtros({ etiquetas: ['aros', 'dorado'] }))).toBe('tags=aros,dorado')
    expect(escribirFiltrosEnURL(filtros({ q: ' perla ', modo: 'alguna' }))).toBe('q=perla&modo=alguna')
  })

  it('ida y vuelta, con espacios y tildes codificados', () => {
    const original = filtros({ q: 'pérla fina', etiquetas: ['acero quirúrgico', 'aros'], modo: 'alguna' })
    const busqueda = escribirFiltrosEnURL(original)
    expect(busqueda).toBe('q=p%C3%A9rla+fina&tags=acero+quir%C3%BArgico,aros&modo=alguna')
    expect(leerFiltrosDeURL(new URLSearchParams(busqueda))).toEqual(original)
  })

  it('las etiquetas que ningún producto usa se ignoran', () => {
    expect(quitarEtiquetasDesconocidas(filtros({ etiquetas: ['aros', 'oro'] }), USADAS).etiquetas).toEqual([
      'aros',
    ])
  })
})

describe('aplicarFiltros', () => {
  it('modo todas (Y)', () => {
    expect(nombres(aplicarFiltros(PRODUCTOS, filtros({ etiquetas: ['aros', 'dorado'] })))).toEqual([
      'Argollas clásicas doradas',
      'Aros gota martillada',
    ])
  })

  it('modo alguna (O)', () => {
    expect(
      nombres(aplicarFiltros(PRODUCTOS, filtros({ etiquetas: ['perlas', 'pulseras'], modo: 'alguna' }))),
    ).toEqual(['Aros perla mini', 'Pulsera eslabón fino', 'Esclava rígida plateada'])
  })

  it('búsqueda sin tildes ni mayúsculas', () => {
    for (const q of ['perla', 'PERLA', 'pérla']) {
      expect(nombres(aplicarFiltros(PRODUCTOS, filtros({ q })))).toEqual(['Aros perla mini'])
    }
    expect(nombres(aplicarFiltros(PRODUCTOS, filtros({ q: 'rigida' })))).toEqual(['Esclava rígida plateada'])
  })

  it('los agotados van al final manteniendo el orden', () => {
    expect(nombres(aplicarFiltros(PRODUCTOS, SIN_FILTROS))).toEqual([
      'Argollas clásicas doradas',
      'Aros perla mini',
      'Abridores de acero',
      'Pulsera eslabón fino',
      'Esclava rígida plateada',
      'Aros gota martillada',
    ])
  })
})

describe('contarEtiquetas', () => {
  const contar = (f: FiltrosCatalogo, buscada?: string) =>
    Object.fromEntries(contarEtiquetas(PRODUCTOS, USADAS, f, buscada).map((c) => [c.nombre, c.cantidad]))

  it('sin selección cuenta sobre todos los activos, en el orden de las usadas', () => {
    expect(contarEtiquetas(PRODUCTOS, USADAS, SIN_FILTROS).map((c) => c.nombre)).toEqual(USADAS)
    expect(contar(SIN_FILTROS)).toEqual({ aros: 4, pulseras: 2, dorado: 3, plateado: 2, acero: 3, perlas: 1 })
  })

  it('modo todas con selección: cuenta sobre el resultado y no muestra las elegidas', () => {
    expect(contar(filtros({ etiquetas: ['aros'] }))).toEqual({
      pulseras: 0,
      dorado: 2,
      plateado: 1,
      acero: 2,
      perlas: 1,
    })
  })

  it('modo alguna: cuenta sobre los que pasan la búsqueda por nombre', () => {
    expect(contar(filtros({ etiquetas: ['aros'], modo: 'alguna' }))).toEqual({
      pulseras: 2,
      dorado: 3,
      plateado: 2,
      acero: 3,
      perlas: 1,
    })
    expect(contar(filtros({ q: 'aros', modo: 'alguna', etiquetas: ['perlas'] }))).toEqual({
      aros: 2,
      pulseras: 0,
      dorado: 1,
      plateado: 1,
      acero: 0,
    })
  })

  it('respeta la búsqueda por nombre aunque no haya etiquetas elegidas', () => {
    expect(contar(filtros({ q: 'pulsera' }))).toMatchObject({ aros: 0, pulseras: 1, dorado: 1 })
  })

  it('respeta el buscador de etiquetas (sin tildes)', () => {
    expect(contar(SIN_FILTROS, 'PLA')).toEqual({ plateado: 2 })
    expect(contar(SIN_FILTROS, 'oro')).toEqual({})
  })

  it('Enter elige la coincidencia exacta o la primera', () => {
    const disponibles = contarEtiquetas(PRODUCTOS, USADAS, SIN_FILTROS, 'a')
    expect(etiquetaParaEnter(disponibles, 'a')).toBe('aros')
    expect(etiquetaParaEnter(contarEtiquetas(PRODUCTOS, USADAS, SIN_FILTROS, 'acero'), 'acero')).toBe('acero')
    expect(etiquetaParaEnter([], 'oro')).toBeUndefined()
  })
})

describe('textos', () => {
  it('contador de resultados', () => {
    expect(textoResultado(13, 13, SIN_FILTROS, false)).toBe('13 piezas en la vidriera')
    expect(textoResultado(1, 1, SIN_FILTROS, false)).toBe('1 pieza en la vidriera')
    expect(textoResultado(2, 13, filtros({ etiquetas: ['aros'] }), false)).toBe('2 de 13 piezas')
    expect(textoResultado(2, 13, filtros({ q: 'x' }), true)).toBe('Buscando…')
  })

  it('pista del vacío', () => {
    expect(pistaVacio(filtros({ etiquetas: ['perlas', 'pulseras'] }))).toBe(
      'Ninguna pieza es perlas + pulseras a la vez. Probá cambiando la búsqueda o quitando una etiqueta.',
    )
    expect(pistaVacio(filtros({ q: ' anillo ' }))).toBe(
      'Ninguna pieza tiene «anillo» en el nombre. Probá cambiando la búsqueda o quitando una etiqueta.',
    )
    expect(pistaVacio(filtros({ q: 'anillo', etiquetas: ['aros', 'perlas'] }))).toBe(
      'Ninguna pieza tiene «anillo» en el nombre con todas estas etiquetas: aros, perlas. Probá cambiando la búsqueda o quitando una etiqueta.',
    )
    expect(pistaVacio(filtros({ q: 'anillo', etiquetas: ['aros'], modo: 'alguna' }))).toBe(
      'Ninguna pieza tiene «anillo» en el nombre con alguna de estas etiquetas: aros. Probá cambiando la búsqueda o quitando una etiqueta.',
    )
  })
})
