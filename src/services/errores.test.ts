import { describe, expect, it } from 'vitest'
import { desdeErrorSupabase, ErrorServicio, MENSAJE_SIN_CONEXION } from './errores'

describe('desdeErrorSupabase', () => {
  it('usa el code del error de Postgrest', () => {
    const e = desdeErrorSupabase({ code: 'P0001', message: 'stock_insuficiente' }, 'Sin stock.')
    expect(e).toBeInstanceOf(ErrorServicio)
    expect(e.codigo).toBe('P0001')
    expect(e.message).toBe('Sin stock.')
  })

  it('reconoce los errores de red', () => {
    const e = desdeErrorSupabase(new TypeError('Failed to fetch'))
    expect(e.codigo).toBe('sin_conexion')
    expect(e.message).toBe(MENSAJE_SIN_CONEXION)
  })

  it('devuelve el mismo ErrorServicio si ya lo era', () => {
    const original = new ErrorServicio('x', 'y')
    expect(desdeErrorSupabase(original)).toBe(original)
  })
})
