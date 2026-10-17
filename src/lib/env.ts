import { z } from 'zod'

const esquemaEnv = z.object({
  VITE_SUPABASE_URL: z.url({
    error: (problema) =>
      problema.input === undefined
        ? 'falta la URL del proyecto de Supabase'
        : 'tiene que ser una URL (ej. http://127.0.0.1:54321)',
  }),
  VITE_SUPABASE_ANON_KEY: z
    .string({ error: 'falta la clave pública (anon) del proyecto' })
    .trim()
    .min(1, { error: 'falta la clave pública (anon) del proyecto' }),
  // El número de WhatsApp no va acá: se edita en Ajustes y vive en la tabla settings (D-34).
})

export type Env = z.infer<typeof esquemaEnv>

export type ResultadoEnv =
  | { ok: true; env: Env }
  | { ok: false; problemas: string[] }

/** Valida las variables de entorno públicas. No lanza: la app muestra "Falta configurar el sitio". */
export function leerEnv(fuente: Record<string, unknown>): ResultadoEnv {
  const resultado = esquemaEnv.safeParse(fuente)
  if (resultado.success) return { ok: true, env: resultado.data }
  const problemas = resultado.error.issues.map(
    (problema) => `${problema.path.join('.')}: ${problema.message}`,
  )
  return { ok: false, problemas }
}

export const resultadoEnv = leerEnv(import.meta.env)

if (!resultadoEnv.ok) {
  console.error(
    'Falta configurar el sitio. Copiá .env.example a .env.local y completá:\n' +
      resultadoEnv.problemas.map((p) => `  - ${p}`).join('\n'),
  )
}
