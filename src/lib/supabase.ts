import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { resultadoEnv } from '@/lib/env'

// Solo lo importan los servicios (src/services/**). ESLint lo hace cumplir.
let cliente: SupabaseClient<Database> | undefined

/** Cliente de Supabase tipado. Se crea la primera vez que un servicio lo pide. */
export function obtenerSupabase(): SupabaseClient<Database> {
  if (!resultadoEnv.ok) {
    throw new Error('Falta configurar el sitio: revisá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.')
  }
  cliente ??= createClient<Database>(
    resultadoEnv.env.VITE_SUPABASE_URL,
    resultadoEnv.env.VITE_SUPABASE_ANON_KEY,
  )
  return cliente
}
