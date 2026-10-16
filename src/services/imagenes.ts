import { comprimirImagen } from '@/lib/imagenes'
import { obtenerSupabase } from '@/lib/supabase'
import { desdeErrorSupabase } from '@/services/errores'

const BUCKET = 'productos'
const MENSAJE_SUBIR = 'No pudimos subir la foto. Probá de nuevo en un rato.'

/** URL pública de una imagen. Las semillas usan archivos de `public/seed/` (D-27). */
export function urlPublica(path: string): string {
  if (path.startsWith('/seed/')) return path
  return obtenerSupabase().storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/**
 * Comprime la foto en el navegador y sube detalle y miniatura a `productos/{productoId}/…`.
 * Devuelve las rutas dentro del bucket. Si falla la segunda subida, borra la primera.
 */
export async function subirImagen(
  productoId: string,
  archivo: File,
): Promise<{ path: string; pathMiniatura: string }> {
  const { detalle, miniatura } = await comprimirImagen(archivo)
  const nombre = crypto.randomUUID()
  const path = `${productoId}/${nombre}.jpg`
  const pathMiniatura = `${productoId}/${nombre}-min.jpg`
  const bucket = obtenerSupabase().storage.from(BUCKET)
  const opciones = { contentType: 'image/jpeg', upsert: false, cacheControl: '31536000' }

  const subidaDetalle = await bucket.upload(path, detalle, opciones)
  if (subidaDetalle.error !== null) throw desdeErrorSupabase(subidaDetalle.error, MENSAJE_SUBIR)

  const subidaMiniatura = await bucket.upload(pathMiniatura, miniatura, opciones)
  if (subidaMiniatura.error !== null) {
    await bucket.remove([path])
    throw desdeErrorSupabase(subidaMiniatura.error, MENSAJE_SUBIR)
  }
  return { path, pathMiniatura }
}

/** Borra archivos del bucket. Ignora las rutas de las semillas (no están en Storage). */
export async function borrarArchivos(paths: string[]): Promise<void> {
  const enStorage = paths.filter((p) => !p.startsWith('/seed/'))
  if (enStorage.length === 0) return
  const { error } = await obtenerSupabase().storage.from(BUCKET).remove(enStorage)
  if (error !== null) throw desdeErrorSupabase(error)
}
