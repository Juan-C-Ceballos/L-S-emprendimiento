/**
 * Worker anti-pausa (etapa 8, D-41): una vez por día consulta una fila de `tags` en el Supabase
 * de producción para que el proyecto gratuito no se pause por inactividad.
 * Si la consulta falla, lanza: la ejecución queda marcada como error en los eventos del cron.
 */

export interface Env {
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
}

/** Lo que usa el handler del `ScheduledController` de Cloudflare. */
export interface Programacion {
  cron: string
  scheduledTime: number
}

export async function consultarSupabase(env: Env, fetchFn: typeof fetch = fetch): Promise<number> {
  const url = env.SUPABASE_URL?.trim().replace(/\/+$/, '')
  const clave = env.SUPABASE_ANON_KEY?.trim()
  if (!url || !clave) {
    throw new Error('Faltan los secretos SUPABASE_URL o SUPABASE_ANON_KEY del Worker.')
  }
  const respuesta = await fetchFn(`${url}/rest/v1/tags?select=id&limit=1`, {
    headers: { apikey: clave, Authorization: `Bearer ${clave}` },
  })
  if (!respuesta.ok) {
    throw new Error(`Supabase respondió ${respuesta.status} ${respuesta.statusText}`)
  }
  return respuesta.status
}

export default {
  async scheduled(programacion: Programacion, env: Env): Promise<void> {
    const estado = await consultarSupabase(env)
    console.log(
      `keepalive ok: ${estado} (cron "${programacion.cron}", ${new Date(programacion.scheduledTime).toISOString()})`,
    )
  },
}
