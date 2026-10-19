import { useCallback, useEffect, useRef, useState, type SubmitEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { EditorEtiquetas } from '@/components/panel/EditorEtiquetas'
import { EditorImagenes, type ImagenFormulario } from '@/components/panel/EditorImagenes'
import { InterruptorActivo } from '@/components/panel/InterruptorActivo'
import { MargenGanancia } from '@/components/panel/MargenGanancia'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { esquemaProducto, type CampoProducto } from '@/lib/esquemas'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/utils'
import { listarEtiquetasConUso } from '@/services/etiquetas'
import { ErrorServicio, MENSAJE_GENERICO } from '@/services/errores'
import { borrarArchivos } from '@/services/imagenes'
import { guardarProducto, obtenerProductoAdmin } from '@/services/productos'
import type { EtiquetaConUso, Producto } from '@/types/dominio'

const claseSeccion = 'mb-[18px] border-b border-borde pt-1.5 pb-[22px]'
const claseTituloSeccion = 'm-0 mb-1 font-display text-lg font-semibold'
const claseError = 'm-0 text-[13px] font-semibold text-peligro'

/** Alta (`/admin/productos/nuevo`) y edición (`/admin/productos/:id`) de un producto. */
export function ProductoFormPage() {
  const { id } = useParams()
  const cargar = useCallback(async () => {
    const [producto, etiquetas] = await Promise.all([
      id === undefined ? Promise.resolve(null) : obtenerProductoAdmin(id),
      listarEtiquetasConUso(),
    ])
    return { producto, etiquetas }
  }, [id])
  const datos = useAsync(cargar)

  if (datos.estado === 'cargando') {
    return (
      <p className="m-0 px-5 py-6 text-[13px] text-texto-suave lg:px-8" aria-live="polite">
        Cargando…
      </p>
    )
  }
  if (datos.estado === 'error') {
    return (
      <div role="alert" className="mx-5 my-6 flex flex-col items-start gap-3 lg:mx-8">
        <p className="m-0 text-sm text-peligro">
          {datos.error instanceof ErrorServicio ? datos.error.message : MENSAJE_GENERICO}
        </p>
        <Button variant="ghost" size="sm" onClick={datos.recargar}>
          Reintentar
        </Button>
      </div>
    )
  }
  if (id !== undefined && datos.datos.producto === null) {
    return (
      <div className="mx-5 my-6 flex flex-col items-start gap-3 lg:mx-8">
        <p className="m-0 text-sm text-texto-suave">No encontramos este producto.</p>
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/productos">Volver a Productos</Link>
        </Button>
      </div>
    )
  }
  return (
    <FormularioProducto
      key={id ?? 'nuevo'}
      inicial={datos.datos.producto}
      etiquetas={datos.datos.etiquetas}
    />
  )
}

type Errores = Partial<Record<CampoProducto, string>>

function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, '')
}

function enteroONulo(texto: string): number | null {
  return texto === '' ? null : Number.parseInt(texto, 10)
}

function FormularioProducto({
  inicial,
  etiquetas: todasLasEtiquetas,
}: {
  inicial: Producto | null
  etiquetas: EtiquetaConUso[]
}) {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()
  const volverA = '/admin/productos'

  // Al crear, el id se genera acá para poder subir las fotos antes de guardar (D-16).
  const [productoId] = useState(() => inicial?.id ?? crypto.randomUUID())
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '')
  const [precio, setPrecio] = useState(inicial === null ? '' : String(inicial.precio))
  const [costo, setCosto] = useState(inicial?.costo == null ? '' : String(inicial.costo))
  const [stock, setStock] = useState(inicial === null ? '' : String(inicial.stock))
  const [activo, setActivo] = useState(inicial?.activo ?? true)
  const [etiquetas, setEtiquetas] = useState(inicial?.etiquetas ?? [])
  const [imagenes, setImagenes] = useState<ImagenFormulario[]>(
    () =>
      inicial?.imagenes.map((i) => ({
        path: i.path,
        pathMiniatura: i.pathMiniatura,
        urlMiniatura: i.urlMiniatura,
      })) ?? [],
  )
  const [subiendo, setSubiendo] = useState(0)
  const [errores, setErrores] = useState<Errores>({})
  const [guardando, setGuardando] = useState(false)

  // Fotos subidas en esta pantalla que todavía no se guardaron: si se sale sin guardar, se borran.
  const subidasSinGuardar = useRef(new Map<string, string[]>())
  const guardado = useRef(false)
  useEffect(() => {
    const pendientes = subidasSinGuardar.current
    return () => {
      if (guardado.current || pendientes.size === 0) return
      const paths = [...pendientes.values()].flat()
      pendientes.clear()
      borrarArchivos(paths).catch((e: unknown) => {
        console.error('No se pudieron borrar las fotos subidas sin guardar:', e)
      })
    }
  }, [])

  function limpiarError(campo: CampoProducto) {
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  function alSubir(imagen: ImagenFormulario) {
    subidasSinGuardar.current.set(imagen.path, [imagen.path, imagen.pathMiniatura])
    limpiarError('cantidadImagenes')
  }

  function alQuitar(imagen: ImagenFormulario) {
    const paths = subidasSinGuardar.current.get(imagen.path)
    if (paths === undefined) return // ya estaba guardada: la borra guardar_producto al guardar
    subidasSinGuardar.current.delete(imagen.path)
    borrarArchivos(paths).catch((e: unknown) => {
      console.error('No se pudo borrar la foto quitada:', e)
    })
  }

  async function alGuardar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    const resultado = esquemaProducto.safeParse({
      nombre,
      descripcion,
      precio,
      costo,
      stock,
      cantidadImagenes: imagenes.length,
    })
    if (!resultado.success) {
      const nuevos: Errores = {}
      for (const problema of resultado.error.issues) {
        const campo = problema.path[0] as CampoProducto | undefined
        if (campo !== undefined && nuevos[campo] === undefined) nuevos[campo] = problema.message
      }
      setErrores(nuevos)
      mostrarToast('Revisá los campos marcados en rojo.')
      return
    }
    setGuardando(true)
    try {
      await guardarProducto({
        id: productoId,
        nombre: resultado.data.nombre,
        descripcion: resultado.data.descripcion,
        precio: resultado.data.precio,
        costo: resultado.data.costo,
        stock: resultado.data.stock,
        activo,
        etiquetas,
        imagenes: imagenes.map((i) => ({ path: i.path, pathMiniatura: i.pathMiniatura })),
      })
      guardado.current = true
      subidasSinGuardar.current.clear()
      mostrarToast(
        inicial !== null
          ? 'Cambios guardados.'
          : activo
            ? 'Producto creado y visible en el catálogo.'
            : 'Producto creado (inactivo).',
      )
      void navigate(volverA)
    } catch (e) {
      setGuardando(false)
      mostrarToast(e instanceof ErrorServicio ? e.message : MENSAJE_GENERICO)
    }
  }

  return (
    <form noValidate onSubmit={(e) => void alGuardar(e)}>
      <div className="mx-auto max-w-[760px] px-5 pt-[18px] pb-[104px] lg:px-8 lg:pt-8">
        <section className={claseSeccion}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-name">Nombre</Label>
            <Input
              id="p-name"
              type="text"
              placeholder="Ej. Argollas clásicas doradas"
              value={nombre}
              maxLength={120}
              aria-invalid={errores.nombre !== undefined}
              aria-describedby={errores.nombre !== undefined ? 'p-name-error' : undefined}
              onChange={(e) => {
                setNombre(e.target.value)
                limpiarError('nombre')
              }}
            />
            {errores.nombre !== undefined && (
              <p id="p-name-error" className={claseError}>
                {errores.nombre}
              </p>
            )}
          </div>
          <div className="mt-[18px] flex flex-col gap-1.5">
            <Label htmlFor="p-desc">Descripción</Label>
            <Textarea
              id="p-desc"
              placeholder="Material, medidas, cómo se usa."
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value)
              }}
            />
          </div>
        </section>

        <section className={claseSeccion}>
          <h2 className={claseTituloSeccion}>Precio y stock</h2>
          <div className="mt-[18px] grid grid-cols-2 gap-3">
            <CampoPesos
              id="p-price"
              etiqueta="Precio"
              valor={precio}
              error={errores.precio}
              onCambiar={(v) => {
                setPrecio(v)
                limpiarError('precio')
              }}
            />
            <CampoPesos
              id="p-cost"
              etiqueta="Costo"
              valor={costo}
              error={errores.costo}
              onCambiar={(v) => {
                setCosto(v)
                limpiarError('costo')
              }}
            />
          </div>
          {errores.precio !== undefined && (
            <p id="p-price-error" className={cn(claseError, 'mt-1.5')}>
              {errores.precio}
            </p>
          )}
          {errores.costo !== undefined && (
            <p id="p-cost-error" className={cn(claseError, 'mt-1.5')}>
              {errores.costo}
            </p>
          )}
          <p className="m-0 mt-1.5 text-[13px] text-texto-suave">
            El costo solo se ve en el panel, nunca en el catálogo.
          </p>
          <MargenGanancia precio={enteroONulo(precio)} costo={enteroONulo(costo)} />
          <div className="mt-[18px] flex flex-col gap-1.5">
            <Label htmlFor="p-stock">Stock (unidades)</Label>
            <Input
              id="p-stock"
              type="text"
              inputMode="numeric"
              placeholder="0"
              className="max-w-40"
              value={stock}
              aria-invalid={errores.stock !== undefined}
              aria-describedby={errores.stock !== undefined ? 'p-stock-error' : undefined}
              onChange={(e) => {
                setStock(soloDigitos(e.target.value))
                limpiarError('stock')
              }}
            />
            {errores.stock !== undefined && (
              <p id="p-stock-error" className={claseError}>
                {errores.stock}
              </p>
            )}
          </div>
        </section>

        <section className={claseSeccion}>
          <h2 className={claseTituloSeccion}>Imágenes</h2>
          <p className="m-0 text-[13px] leading-[1.45] text-texto-suave">
            La primera es la portada. Tocá una imagen para hacerla portada y usá las flechas para
            ordenar.
          </p>
          <EditorImagenes
            productoId={productoId}
            imagenes={imagenes}
            setImagenes={setImagenes}
            subiendo={subiendo}
            setSubiendo={setSubiendo}
            onSubida={alSubir}
            onQuitada={alQuitar}
            error={errores.cantidadImagenes}
          />
        </section>

        <section className={claseSeccion}>
          <h2 className={claseTituloSeccion}>Etiquetas</h2>
          <EditorEtiquetas elegidas={etiquetas} onCambiar={setEtiquetas} todas={todasLasEtiquetas} />
        </section>

        <section className="pt-1.5">
          <InterruptorActivo activo={activo} onCambiar={setActivo} />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex h-20 items-center gap-2.5 border-t border-borde bg-crema px-4 pt-3 pb-3.5 lg:left-[220px] lg:justify-end lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link to={volverA}>Cancelar</Link>
        </Button>
        <Button type="submit" className="lg:w-auto lg:min-w-[200px] lg:flex-none" disabled={guardando || subiendo > 0}>
          {guardando
            ? 'Guardando…'
            : subiendo > 0
              ? 'Subiendo fotos…'
              : inicial === null
                ? 'Crear producto'
                : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}

function CampoPesos({
  id,
  etiqueta,
  valor,
  error,
  onCambiar,
}: {
  id: string
  etiqueta: string
  valor: string
  error: string | undefined
  onCambiar: (valor: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      <span className="relative block">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-texto-suave">
          $
        </span>
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder="0"
          className="pl-7"
          value={valor}
          aria-invalid={error !== undefined}
          aria-describedby={error !== undefined ? `${id}-error` : undefined}
          onChange={(e) => {
            onCambiar(soloDigitos(e.target.value))
          }}
        />
      </span>
    </div>
  )
}
