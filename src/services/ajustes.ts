import { obtenerSupabase } from '@/lib/supabase'
import { desdeErrorSupabase, ErrorServicio } from '@/services/errores'
import type { AjustesWhatsApp } from '@/types/dominio'

const MENSAJE_LEER = 'No pudimos cargar los ajustes. Probá de nuevo en un rato.'
const MENSAJE_GUARDAR = 'No pudimos guardar los ajustes. Probá de nuevo en un rato.'

/** Número y mensaje de WhatsApp de la tienda (lectura pública). */
export async function obtenerAjustesWhatsApp(): Promise<AjustesWhatsApp> {
  const { data, error } = await obtenerSupabase()
    .from('settings')
    .select('whatsapp_numero, whatsapp_mensaje')
    .single()
  if (error !== null) throw desdeErrorSupabase(error, MENSAJE_LEER)
  return { numero: data.whatsapp_numero, mensaje: data.whatsapp_mensaje }
}

/** Guarda número (solo dígitos) y mensaje. Solo la administradora (RLS). */
export async function guardarAjustesWhatsApp(ajustes: AjustesWhatsApp): Promise<AjustesWhatsApp> {
  const { data, error } = await obtenerSupabase()
    .from('settings')
    .update({ whatsapp_numero: ajustes.numero, whatsapp_mensaje: ajustes.mensaje })
    .eq('id', true)
    .select('whatsapp_numero, whatsapp_mensaje')
    .maybeSingle()
  if (error !== null) throw desdeErrorSupabase(error, MENSAJE_GUARDAR)
  // RLS no da error: si la sesión no es de la administradora, simplemente no actualiza ninguna fila.
  if (data === null) {
    throw new ErrorServicio('sin_acceso', 'Tu sesión no tiene permiso para cambiar los ajustes.')
  }
  return { numero: data.whatsapp_numero, mensaje: data.whatsapp_mensaje }
}
