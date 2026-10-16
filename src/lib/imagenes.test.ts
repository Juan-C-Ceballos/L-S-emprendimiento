import { describe, expect, it } from 'vitest'
import { calcularDimensiones } from './imagenes'

describe('calcularDimensiones', () => {
  it('achica una foto horizontal por el ancho', () => {
    expect(calcularDimensiones(4000, 3000, 1600)).toEqual({ ancho: 1600, alto: 1200 })
  })

  it('achica una foto vertical por el alto', () => {
    expect(calcularDimensiones(3024, 4032, 1600)).toEqual({ ancho: 1200, alto: 1600 })
  })

  it('achica una cuadrada a la miniatura', () => {
    expect(calcularDimensiones(2000, 2000, 400)).toEqual({ ancho: 400, alto: 400 })
  })

  it('no agranda una imagen más chica que el máximo', () => {
    expect(calcularDimensiones(800, 600, 1600)).toEqual({ ancho: 800, alto: 600 })
  })

  it('nunca devuelve un lado de 0', () => {
    expect(calcularDimensiones(10000, 1, 400)).toEqual({ ancho: 400, alto: 1 })
  })
})
