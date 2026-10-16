import { ErrorServicio } from '@/services/errores'

/** Lado largo del detalle y de la miniatura, y calidad JPEG (D-05). */
export const LADO_DETALLE = 1600
export const LADO_MINIATURA = 400
export const CALIDAD_JPEG = 0.85

export const MENSAJE_FORMATO =
  'No pudimos leer esa foto. Probá con JPG o PNG, o sacala de nuevo desde el celular.'

/** Escala para que el lado largo sea como mucho `ladoMax`. Nunca agranda una imagen chica. */
export function calcularDimensiones(
  ancho: number,
  alto: number,
  ladoMax: number,
): { ancho: number; alto: number } {
  const escala = Math.min(1, ladoMax / Math.max(ancho, alto))
  return {
    ancho: Math.max(1, Math.round(ancho * escala)),
    alto: Math.max(1, Math.round(alto * escala)),
  }
}

function aJpeg(imagen: ImageBitmap, ladoMax: number): Promise<Blob> {
  const { ancho, alto } = calcularDimensiones(imagen.width, imagen.height, ladoMax)
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const contexto = lienzo.getContext('2d')
  if (contexto === null) return Promise.reject(new ErrorServicio('formato', MENSAJE_FORMATO))
  // Fondo blanco: un PNG con transparencia no queda negro al pasar a JPEG.
  contexto.fillStyle = '#ffffff'
  contexto.fillRect(0, 0, ancho, alto)
  contexto.imageSmoothingQuality = 'high'
  contexto.drawImage(imagen, 0, 0, ancho, alto)
  return new Promise((resolver, rechazar) => {
    lienzo.toBlob(
      (blob) => {
        if (blob === null) rechazar(new ErrorServicio('formato', MENSAJE_FORMATO))
        else resolver(blob)
      },
      'image/jpeg',
      CALIDAD_JPEG,
    )
  })
}

/**
 * Achica una foto en el navegador: detalle de 1600 px y miniatura de 400 px de lado largo, en JPEG.
 * Respeta la rotación EXIF de las fotos de celular. La original no se sube.
 */
export async function comprimirImagen(archivo: File): Promise<{ detalle: Blob; miniatura: Blob }> {
  let imagen: ImageBitmap
  try {
    imagen = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
  } catch (e) {
    throw new ErrorServicio('formato', MENSAJE_FORMATO, e)
  }
  try {
    const detalle = await aJpeg(imagen, LADO_DETALLE)
    const miniatura = await aJpeg(imagen, LADO_MINIATURA)
    return { detalle, miniatura }
  } finally {
    imagen.close()
  }
}
