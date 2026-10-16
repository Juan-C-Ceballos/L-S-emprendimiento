// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker, { consultarSupabase } from './index'

const env = { SUPABASE_URL: 'https://abc.supabase.co/', SUPABASE_ANON_KEY: 'clave-publica' }

function respuesta(status: number) {
  return new Response('[]', { status, statusText: status === 200 ? 'OK' : 'Error' })
}

describe('consultarSupabase', () => {
  it('consulta una fila de tags con la clave pública', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(respuesta(200))
    await expect(consultarSupabase(env, fetchFn)).resolves.toBe(200)
    expect(fetchFn).toHaveBeenCalledWith('https://abc.supabase.co/rest/v1/tags?select=id&limit=1', {
      headers: { apikey: 'clave-publica', Authorization: 'Bearer clave-publica' },
    })
  })

  it('falla si Supabase no responde bien (así el cron queda en error)', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(respuesta(503))
    await expect(consultarSupabase(env, fetchFn)).rejects.toThrow('Supabase respondió 503')
  })

  it('falla sin consultar si faltan los secretos', async () => {
    const fetchFn = vi.fn<typeof fetch>()
    await expect(consultarSupabase({ SUPABASE_URL: ' ' }, fetchFn)).rejects.toThrow(
      'Faltan los secretos',
    )
    expect(fetchFn).not.toHaveBeenCalled()
  })
})

describe('scheduled', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('consulta y deja registro', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(respuesta(200)))
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await worker.scheduled({ cron: '0 12 * * *', scheduledTime: Date.UTC(2026, 9, 17, 12) }, env)
    expect(log).toHaveBeenCalledWith(
      'keepalive ok: 200 (cron "0 12 * * *", 2026-10-17T12:00:00.000Z)',
    )
  })
})
