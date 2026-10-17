import { z } from 'zod'
import { normalizarEtiqueta } from '@/lib/formato'
import { obtenerSupabase } from '@/lib/supabase'
import { desdeErrorSupabase, ErrorServicio } from '@/services/errores'
import type { EtiquetaAdmin, EtiquetaConUso, ResultadoRenombrar } from '@/types/dominio'

const MENSAJE_LISTAR = 'No pudimos cargar las etiquetas.'
const MENSAJE_GUARDAR = 'No pudimos guardar la etiqueta. Probá de nuevo en un rato.'
const SIN_ACCESO = 'Tu sesión no tiene permiso para cambiar etiquetas.'

async function listarConId(): Promise<EtiquetaAdmin[]> {
  const { data, error } = await obtenerSupabase()
    .from('tags')
    .select('id, nombre, product_tags(count)')
    .order('nombre')
  if (error !== null) throw desdeErrorSupabase(error, MENSAJE_LISTAR)
  return data.map((fila) => ({ id: fila.id, nombre: fila.nombre, usos: fila.product_tags[0]?.count ?? 0 }))
}

/** Todas las etiquetas con la cantidad de productos que las usan, ordenadas por nombre. */
export async function listarEtiquetasConUso(): Promise<EtiquetaConUso[]> {
  return (await listarConId()).map(({ nombre, usos }) => ({ nombre, usos }))
}

/** Lo mismo con el id, para renombrar o eliminar desde Ajustes. */
export async function listarEtiquetasAdmin(): Promise<EtiquetaAdmin[]> {
  return listarConId()
}

/** Crea una etiqueta suelta (después se asigna desde cada producto). Devuelve el nombre normalizado. */
export async function crearEtiqueta(nombre: string): Promise<string> {
  const normalizado = normalizarEtiqueta(nombre)
  const { data, error } = await obtenerSupabase().from('tags').insert({ nombre: normalizado }).select('nombre').maybeSingle()
  if (error !== null) {
    if (error.code === '23505') throw new ErrorServicio('repetida', `«${normalizado}» ya existe.`, error)
    if (error.code === '42501') throw new ErrorServicio('sin_acceso', SIN_ACCESO, error)
    throw desdeErrorSupabase(error, MENSAJE_GUARDAR)
  }
  if (data === null) throw new ErrorServicio('sin_acceso', SIN_ACCESO)
  return data.nombre
}

const esquemaRenombrar = z.object({
  resultado: z.enum(['renombrada', 'unida', 'sin_cambios']),
  id: z.string(),
})

/** Renombra; si el nombre ya existe, la base une las dos sin duplicar (`renombrar_etiqueta`). */
export async function renombrarEtiqueta(id: string, nombre: string): Promise<ResultadoRenombrar> {
  const { data, error } = await obtenerSupabase().rpc('renombrar_etiqueta', { p_id: id, p_nombre: nombre })
  if (error !== null) {
    if (error.code === '42501') throw new ErrorServicio('sin_acceso', SIN_ACCESO, error)
    if (error.code === '22023') throw new ErrorServicio('datos_invalidos', 'Escribí un nombre para la etiqueta.', error)
    if (error.code === 'P0002') throw new ErrorServicio('inexistente', 'Esa etiqueta ya no existe.', error)
    throw desdeErrorSupabase(error, MENSAJE_GUARDAR)
  }
  const r = esquemaRenombrar.safeParse(data)
  if (!r.success) throw new ErrorServicio('respuesta', MENSAJE_GUARDAR, data)
  return r.data
}

/** Elimina la etiqueta: se quita de todos los productos (cascade) y los productos no se tocan. */
export async function eliminarEtiqueta(id: string): Promise<void> {
  const { data, error } = await obtenerSupabase().from('tags').delete().eq('id', id).select('id')
  if (error !== null) throw desdeErrorSupabase(error, 'No pudimos eliminar la etiqueta. Probá de nuevo en un rato.')
  // RLS no da error: sin permiso (o si otra pestaña ya la borró) no se borra ninguna fila.
  if (data.length === 0) {
    throw new ErrorServicio('sin_cambios', 'No se eliminó: puede que ya no exista. Actualizá la lista.')
  }
}
