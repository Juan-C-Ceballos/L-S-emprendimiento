import { describe, expect, it } from 'vitest'
import { leerEnv } from './env'

const BASE = { VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_ANON_KEY: 'clave' }

describe('leerEnv', () => {
  it('acepta la configuración mínima', () => {
    expect(leerEnv(BASE).ok).toBe(true)
  })

  it('trata el número de WhatsApp vacío como ausente', () => {
    expect(leerEnv({ ...BASE, VITE_WHATSAPP_NUMBER: '' })).toEqual({
      ok: true,
      env: { ...BASE, VITE_WHATSAPP_NUMBER: undefined },
    })
  })

  it('rechaza un número de WhatsApp con formato inválido', () => {
    expect(leerEnv({ ...BASE, VITE_WHATSAPP_NUMBER: '+54 9 11' }).ok).toBe(false)
  })

  it('lista lo que falta', () => {
    const r = leerEnv({})
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.problemas.join('\n')).toContain('VITE_SUPABASE_URL')
      expect(r.problemas.join('\n')).toContain('VITE_SUPABASE_ANON_KEY')
    }
  })
})
