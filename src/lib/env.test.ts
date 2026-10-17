import { describe, expect, it } from 'vitest'
import { leerEnv } from './env'

const BASE = { VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_ANON_KEY: 'clave' }

describe('leerEnv', () => {
  it('acepta la configuración mínima', () => {
    expect(leerEnv(BASE).ok).toBe(true)
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
