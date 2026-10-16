import { isAuthApiError, isAuthRetryableFetchError, type Session } from '@supabase/supabase-js'
import { obtenerSupabase } from '@/lib/supabase'
import { desdeErrorSupabase, ErrorServicio, MENSAJE_SIN_CONEXION } from '@/services/errores'
import type { SesionAdmin } from '@/types/dominio'

export const MENSAJE_SIN_ACCESO = 'Esta cuenta no tiene acceso al panel.'
export const MENSAJE_CREDENCIALES = 'El email o la contraseña no coinciden.'

/** La sesión cuenta solo si el token trae `app_metadata.role = 'admin'` (igual que `es_admin()`). */
function sesionAdmin(sesion: Session | null): SesionAdmin | null {
  if (sesion === null) return null
  const { app_metadata: meta, email } = sesion.user
  if (meta.role !== 'admin') return null
  return { email: email ?? '' }
}

function errorDeAuth(e: unknown): ErrorServicio {
  if (isAuthRetryableFetchError(e) || (e instanceof TypeError && /fetch/i.test(e.message))) {
    return new ErrorServicio('sin_conexion', MENSAJE_SIN_CONEXION, e)
  }
  if (isAuthApiError(e) && e.code === 'invalid_credentials') {
    return new ErrorServicio('credenciales', MENSAJE_CREDENCIALES, e)
  }
  return desdeErrorSupabase(e)
}

/** Ingresa con email y contraseña. Si la cuenta no es admin, cierra la sesión y lanza `sin_acceso`. */
export async function ingresar(email: string, contrasena: string): Promise<SesionAdmin> {
  const supabase = obtenerSupabase()
  let resultado: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>
  try {
    resultado = await supabase.auth.signInWithPassword({ email, password: contrasena })
  } catch (e) {
    throw errorDeAuth(e)
  }
  if (resultado.error !== null) throw errorDeAuth(resultado.error)

  const sesion = sesionAdmin(resultado.data.session)
  if (sesion === null) {
    await supabase.auth.signOut()
    throw new ErrorServicio('sin_acceso', MENSAJE_SIN_ACCESO)
  }
  return sesion
}

export async function salir(): Promise<void> {
  const { error } = await obtenerSupabase().auth.signOut()
  if (error !== null) throw errorDeAuth(error)
}

/** Sesión guardada en el navegador, o `null` si no hay o no es de la administradora. */
export async function obtenerSesion(): Promise<SesionAdmin | null> {
  const { data, error } = await obtenerSupabase().auth.getSession()
  if (error !== null) throw errorDeAuth(error)
  return sesionAdmin(data.session)
}

/** Avisa cada cambio de sesión (también la inicial). Devuelve la función para desuscribirse. */
export function escucharSesion(cb: (sesion: SesionAdmin | null) => void): () => void {
  const { data } = obtenerSupabase().auth.onAuthStateChange((_evento, sesion) => {
    cb(sesionAdmin(sesion))
  })
  return () => {
    data.subscription.unsubscribe()
  }
}
