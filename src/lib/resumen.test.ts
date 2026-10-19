import { describe, expect, it } from 'vitest'
import { etiquetasAMostrar } from './resumen'
import type { StockEtiqueta } from '@/types/dominio'

const etiqueta = (nombre: string, unidades: number, seguida = false): StockEtiqueta => ({
  id: nombre,
  nombre,
  seguida,
  productos: unidades,
  piezas: unidades,
  unidades,
  vendidasMes: 0,
  vendidasTotal: 0,
})

describe('etiquetasAMostrar', () => {
  it('sin seguidas muestra todas, de más a menos unidades y por nombre si empatan', () => {
    const lista = [etiqueta('anillos', 1), etiqueta('pulseras', 16), etiqueta('aros', 26), etiqueta('collares', 16)]
    expect(etiquetasAMostrar(lista).map((e) => e.nombre)).toEqual(['aros', 'collares', 'pulseras', 'anillos'])
    expect(lista.map((e) => e.nombre)).toEqual(['anillos', 'pulseras', 'aros', 'collares'])
  })

  it('con seguidas muestra solo esas', () => {
    const lista = [etiqueta('anillos', 1, true), etiqueta('dorado', 40), etiqueta('aros', 26, true)]
    expect(etiquetasAMostrar(lista).map((e) => e.nombre)).toEqual(['aros', 'anillos'])
  })
})
