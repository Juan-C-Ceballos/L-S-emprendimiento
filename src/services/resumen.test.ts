import { beforeEach, describe, expect, it, vi } from 'vitest'
import { guardarEtiquetasSeguidas, obtenerStockPorEtiqueta } from './resumen'

const rpc = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({ obtenerSupabase: () => ({ rpc }) }))

beforeEach(() => {
  rpc.mockReset()
})

describe('obtenerStockPorEtiqueta', () => {
  it('mapea las filas de resumen_etiquetas', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          id: 't1',
          nombre: 'aros',
          seguida: true,
          productos: 4,
          piezas: 3,
          unidades: 26,
          vendidas_mes: 2,
          vendidas_total: 6,
        },
      ],
      error: null,
    })
    await expect(obtenerStockPorEtiqueta()).resolves.toEqual([
      { id: 't1', nombre: 'aros', seguida: true, productos: 4, piezas: 3, unidades: 26, vendidasMes: 2, vendidasTotal: 6 },
    ])
    expect(rpc).toHaveBeenCalledWith('resumen_etiquetas', {})
  })

  it('sin permiso da sin_acceso y una respuesta rara da error de respuesta', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'no_autorizado' } })
    await expect(obtenerStockPorEtiqueta()).rejects.toMatchObject({ codigo: 'sin_acceso' })

    rpc.mockResolvedValue({ data: [{ nombre: 'aros' }], error: null })
    await expect(obtenerStockPorEtiqueta()).rejects.toMatchObject({ codigo: 'respuesta' })
  })
})

describe('guardarEtiquetasSeguidas', () => {
  it('manda los ids a guardar_etiquetas_seguidas', async () => {
    rpc.mockResolvedValue({ data: null, error: null })
    await guardarEtiquetasSeguidas(['t1', 't2'])
    expect(rpc).toHaveBeenCalledWith('guardar_etiquetas_seguidas', { p_ids: ['t1', 't2'] })
  })

  it('un error de la base se muestra con el mensaje de guardar', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '500', message: 'x' } })
    await expect(guardarEtiquetasSeguidas([])).rejects.toMatchObject({
      message: 'No pudimos guardar las etiquetas. Probá de nuevo.',
    })
  })
})
