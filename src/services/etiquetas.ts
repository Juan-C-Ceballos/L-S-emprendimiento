import { obtenerSupabase } from '@/lib/supabase'
import { desdeErrorSupabase } from '@/services/errores'
import type { EtiquetaConUso } from '@/types/dominio'

/** Todas las etiquetas con la cantidad de productos que las usan, ordenadas por nombre. */
export async function listarEtiquetasConUso(): Promise<EtiquetaConUso[]> {
  const { data, error } = await obtenerSupabase()
    .from('tags')
    .select('nombre, product_tags(count)')
    .order('nombre')
  if (error !== null) throw desdeErrorSupabase(error, 'No pudimos cargar las etiquetas.')
  return data.map((fila) => ({ nombre: fila.nombre, usos: fila.product_tags[0]?.count ?? 0 }))
}
