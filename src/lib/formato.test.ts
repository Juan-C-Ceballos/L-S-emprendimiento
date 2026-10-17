import { describe, expect, it } from 'vitest'
import {
  formatearFechaCorta,
  formatearFechaResumen,
  formatearNumeroPedido,
  formatearPrecio,
  nombreMes,
  normalizarEtiqueta,
  normalizarTexto,
} from './formato'

describe('formatearPrecio', () => {
  it('formatea pesos enteros con separador de miles', () => {
    expect(formatearPrecio(0)).toBe('$0')
    expect(formatearPrecio(14500)).toBe('$14.500')
    expect(formatearPrecio(1234567)).toBe('$1.234.567')
  })

  it('redondea los decimales', () => {
    expect(formatearPrecio(999.6)).toBe('$1.000')
  })
})

describe('formatearNumeroPedido', () => {
  it('completa con ceros hasta 4 dígitos', () => {
    expect(formatearNumeroPedido(7)).toBe('#0007')
    expect(formatearNumeroPedido(12345)).toBe('#12345')
  })
})

describe('formatearFechaCorta', () => {
  it('muestra día, mes corto y hora en Buenos Aires', () => {
    expect(formatearFechaCorta('2026-10-15T12:12:00Z')).toBe('15 oct, 09:12')
  })
})

describe('normalizarTexto', () => {
  it('saca tildes, mayúsculas y espacios a los costados', () => {
    expect(normalizarTexto('  Ároś ')).toBe('aros')
    expect(normalizarTexto('Cadena DORADA')).toBe('cadena dorada')
  })
})

describe('normalizarEtiqueta', () => {
  it('pasa a minúsculas y compacta espacios', () => {
    expect(normalizarEtiqueta('  Acero   Quirúrgico ')).toBe('acero quirúrgico')
  })
})

describe('fechas del Resumen', () => {
  it('nombre del mes y fecha larga en hora de Buenos Aires', () => {
    expect(nombreMes('2026-10')).toBe('octubre')
    expect(nombreMes('2026-01')).toBe('enero')
    expect(formatearFechaResumen(new Date('2026-10-15T15:00:00Z'))).toBe('Jueves 15 de octubre')
    // 1/11 a las 01:30 UTC todavía es 31/10 en Argentina.
    expect(formatearFechaResumen(new Date('2026-11-01T01:30:00Z'))).toBe('Sábado 31 de octubre')
  })
})
