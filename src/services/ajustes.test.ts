import { beforeEach, describe, expect, it, vi } from 'vitest'
import { guardarAjustesWhatsApp, obtenerAjustesWhatsApp } from './ajustes'
import { ErrorServicio } from './errores'

const consulta = vi.hoisted(() => {
  const q = {
    from: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }
  return q
})

vi.mock('@/lib/supabase', () => ({ obtenerSupabase: () => ({ from: consulta.from }) }))

const FILA = { whatsapp_numero: '5491100000000', whatsapp_mensaje: 'Hola {items}' }

beforeEach(() => {
  vi.resetAllMocks()
  for (const metodo of ['from', 'select', 'update', 'eq'] as const) {
    consulta[metodo].mockReturnValue(consulta)
  }
})

describe('obtenerAjustesWhatsApp', () => {
  it('devuelve número y mensaje', async () => {
    consulta.single.mockResolvedValue({ data: FILA, error: null })
    await expect(obtenerAjustesWhatsApp()).resolves.toEqual({
      numero: '5491100000000',
      mensaje: 'Hola {items}',
    })
    expect(consulta.from).toHaveBeenCalledWith('settings')
  })
})

describe('guardarAjustesWhatsApp', () => {
  it('actualiza la única fila y devuelve lo guardado', async () => {
    consulta.maybeSingle.mockResolvedValue({ data: FILA, error: null })
    await expect(
      guardarAjustesWhatsApp({ numero: '5491100000000', mensaje: 'Hola {items}' }),
    ).resolves.toEqual({ numero: '5491100000000', mensaje: 'Hola {items}' })
    expect(consulta.update).toHaveBeenCalledWith({
      whatsapp_numero: '5491100000000',
      whatsapp_mensaje: 'Hola {items}',
    })
    expect(consulta.eq).toHaveBeenCalledWith('id', true)
  })

  it('si RLS no deja actualizar ninguna fila, lanza sin_acceso', async () => {
    consulta.maybeSingle.mockResolvedValue({ data: null, error: null })
    const error: unknown = await guardarAjustesWhatsApp({ numero: '5491100000000', mensaje: '{items}' }).catch(
      (e: unknown) => e,
    )
    expect(error).toBeInstanceOf(ErrorServicio)
    expect((error as ErrorServicio).codigo).toBe('sin_acceso')
  })
})
