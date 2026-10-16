import { useRef, type Dispatch, type SetStateAction } from 'react'
import { useToast } from '@/components/useToast'
import { cn } from '@/lib/utils'
import { ErrorServicio, MENSAJE_GENERICO } from '@/services/errores'
import { subirImagen, urlPublica } from '@/services/imagenes'

export type ImagenFormulario = {
  path: string
  pathMiniatura: string
  urlMiniatura: string
}

type Props = {
  productoId: string
  imagenes: ImagenFormulario[]
  setImagenes: Dispatch<SetStateAction<ImagenFormulario[]>>
  /** Fotos que se están subiendo ahora (se muestran como tarjetas "Subiendo…"). */
  subiendo: number
  setSubiendo: Dispatch<SetStateAction<number>>
  /** Avisa cada foto subida, para borrarla si al final no se guarda el producto. */
  onSubida: (imagen: ImagenFormulario) => void
  onQuitada: (imagen: ImagenFormulario) => void
  error?: string
}

const claseMini =
  'flex size-11 items-center justify-center rounded-lg text-icono-suave hover:bg-champan-suave disabled:cursor-not-allowed disabled:bg-transparent disabled:text-icono-off'

function Flecha({ d }: { d: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

/** Imágenes del producto: subir, portada, ordenar y quitar (prototipo: `.imgs`, `addImg`, `moveImg`, `coverImg`). */
export function EditorImagenes({
  productoId,
  imagenes,
  setImagenes,
  subiendo,
  setSubiendo,
  onSubida,
  onQuitada,
  error,
}: Props) {
  const { mostrarToast } = useToast()
  const refArchivo = useRef<HTMLInputElement>(null)

  async function subir(archivos: File[]) {
    setSubiendo((n) => n + archivos.length)
    // De a una: comprimir fotos grandes consume mucha memoria en celulares viejos.
    for (const archivo of archivos) {
      try {
        const { path, pathMiniatura } = await subirImagen(productoId, archivo)
        const imagen = { path, pathMiniatura, urlMiniatura: urlPublica(pathMiniatura) }
        onSubida(imagen)
        setImagenes((actuales) => [...actuales, imagen])
      } catch (e) {
        mostrarToast(e instanceof ErrorServicio ? e.message : MENSAJE_GENERICO)
      } finally {
        setSubiendo((n) => n - 1)
      }
    }
  }

  function mover(indice: number, direccion: -1 | 1) {
    setImagenes((actuales) => {
      const destino = indice + direccion
      const copia = [...actuales]
      const a = copia[indice]
      const b = copia[destino]
      if (a === undefined || b === undefined) return actuales
      copia[indice] = b
      copia[destino] = a
      return copia
    })
  }

  function hacerPortada(indice: number) {
    if (indice === 0) return
    setImagenes((actuales) => {
      const copia = [...actuales]
      const [elegida] = copia.splice(indice, 1)
      return elegida === undefined ? actuales : [elegida, ...copia]
    })
    mostrarToast('Listo, esa imagen es la nueva portada.')
  }

  function quitar(imagen: ImagenFormulario) {
    setImagenes((actuales) => actuales.filter((i) => i.path !== imagen.path))
    onQuitada(imagen)
  }

  return (
    <div>
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {imagenes.map((imagen, i) => (
          <div key={imagen.path} className="flex flex-col gap-1">
            <button
              type="button"
              aria-label={i === 0 ? 'Imagen 1, portada' : `Imagen ${i + 1}. Tocá para hacerla portada`}
              className={cn(
                'relative block aspect-[4/5] w-full overflow-hidden rounded-md border border-borde bg-img-fondo p-0',
                i === 0 && 'shadow-[0_0_0_2px_var(--color-tinta)]',
              )}
              onClick={() => {
                hacerPortada(i)
              }}
            >
              <img src={imagen.urlMiniatura} alt="" className="absolute inset-0 size-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 z-[1] rounded-[2px] bg-white px-2 py-[5px] text-[10px] font-bold tracking-[0.12em] text-tinta uppercase">
                  Portada
                </span>
              )}
            </button>
            <div className="flex justify-between">
              <button
                type="button"
                aria-label="Mover antes"
                className={claseMini}
                disabled={i === 0}
                onClick={() => {
                  mover(i, -1)
                }}
              >
                <Flecha d="M15 6l-6 6 6 6" />
              </button>
              <button
                type="button"
                aria-label="Mover después"
                className={claseMini}
                disabled={i === imagenes.length - 1}
                onClick={() => {
                  mover(i, 1)
                }}
              >
                <Flecha d="M9 6l6 6-6 6" />
              </button>
              <button
                type="button"
                aria-label="Quitar imagen"
                className={claseMini}
                onClick={() => {
                  quitar(imagen)
                }}
              >
                <Flecha d="M6 6l12 12M18 6L6 18" />
              </button>
            </div>
          </div>
        ))}

        {Array.from({ length: subiendo }, (_, i) => (
          <div
            key={`subiendo-${i}`}
            className="flex aspect-[4/5] w-full animate-pulse items-center justify-center rounded-md border border-borde bg-img-fondo text-xs font-semibold text-icono-suave"
          >
            Subiendo…
          </div>
        ))}

        <button
          type="button"
          className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-borde-punteado text-xs font-semibold text-icono-suave hover:border-tinta hover:bg-champan-suave"
          onClick={() => refArchivo.current?.click()}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          <span>Agregar imagen</span>
        </button>
        <input
          ref={refArchivo}
          type="file"
          accept="image/*"
          multiple
          hidden
          aria-label="Elegir fotos del producto"
          onChange={(e) => {
            const archivos = Array.from(e.target.files ?? [])
            e.target.value = ''
            if (archivos.length > 0) void subir(archivos)
          }}
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {subiendo > 0 ? `Subiendo ${subiendo === 1 ? 'una foto' : `${subiendo} fotos`}…` : ''}
      </p>
      {error !== undefined && (
        <p id="p-img-error" className="m-0 mt-2.5 text-[13px] font-semibold text-peligro">
          {error}
        </p>
      )}
    </div>
  )
}
