import { obtenerSupabase } from '@/lib/supabase'
import { borrarArchivos, urlPublica } from '@/services/imagenes'
import { desdeErrorSupabase, ErrorServicio } from '@/services/errores'
import type { DatosProducto, Producto } from '@/types/dominio'

const COLUMNAS_ADMIN =
  'id, nombre, descripcion, precio, stock, activo, created_at, updated_at, product_costs(costo), product_images(id, path, path_miniatura, orden), product_tags(tags(nombre))'

const MENSAJE_LISTAR = 'No pudimos cargar los productos. Probá de nuevo en un rato.'
const MENSAJE_GUARDAR = 'No pudimos guardar el producto. Probá de nuevo en un rato.'

function consultaAdmin() {
  return obtenerSupabase().from('products').select(COLUMNAS_ADMIN)
}

type FilaAdmin = NonNullable<Awaited<ReturnType<typeof consultaAdmin>>['data']>[number]

function aProducto(fila: FilaAdmin): Producto {
  const imagenes = [...fila.product_images]
    .sort((a, b) => a.orden - b.orden)
    .map((img) => ({
      id: img.id,
      orden: img.orden,
      path: img.path,
      pathMiniatura: img.path_miniatura,
      url: urlPublica(img.path),
      urlMiniatura: urlPublica(img.path_miniatura),
    }))
  const etiquetas = fila.product_tags
    .map((pt) => pt.tags.nombre)
    .sort((a, b) => a.localeCompare(b, 'es'))
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    precio: fila.precio,
    stock: fila.stock,
    activo: fila.activo,
    costo: fila.product_costs?.costo ?? null,
    imagenes,
    etiquetas,
    creadoEn: fila.created_at,
    actualizadoEn: fila.updated_at,
  }
}

/** Todos los productos (activos e inactivos) con costo, etiquetas e imágenes, por nombre. */
export async function listarProductosAdmin(): Promise<Producto[]> {
  const { data, error } = await consultaAdmin().order('nombre')
  if (error !== null) throw desdeErrorSupabase(error, MENSAJE_LISTAR)
  return data.map(aProducto)
}

/** Un producto para editar, o `null` si no existe. */
export async function obtenerProductoAdmin(id: string): Promise<Producto | null> {
  const { data, error } = await consultaAdmin().eq('id', id).maybeSingle()
  if (error !== null) {
    // Un id con formato inválido en la URL es lo mismo que uno que no existe.
    if (error.code === '22P02') return null
    throw desdeErrorSupabase(error, 'No pudimos cargar el producto. Probá de nuevo en un rato.')
  }
  return data === null ? null : aProducto(data)
}

function esRespuestaGuardar(v: unknown): v is { id: string; paths_quitados: string[] } {
  if (typeof v !== 'object' || v === null) return false
  const r = v as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    Array.isArray(r.paths_quitados) &&
    r.paths_quitados.every((p) => typeof p === 'string')
  )
}

/**
 * Crea o edita el producto en una sola transacción (RPC `guardar_producto`, D-16) y después
 * borra de Storage las imágenes que se sacaron. Si ese borrado falla, el guardado igual vale.
 */
export async function guardarProducto(datos: DatosProducto): Promise<string> {
  const { data, error } = await obtenerSupabase().rpc('guardar_producto', {
    p: {
      id: datos.id,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      precio: datos.precio,
      costo: datos.costo,
      stock: datos.stock,
      activo: datos.activo,
      etiquetas: datos.etiquetas,
      imagenes: datos.imagenes.map((i) => ({ path: i.path, path_miniatura: i.pathMiniatura })),
    },
  })
  if (error !== null) {
    if (error.code === '42501') {
      throw new ErrorServicio('sin_acceso', 'Tu sesión no tiene permiso para guardar productos.', error)
    }
    throw desdeErrorSupabase(error, MENSAJE_GUARDAR)
  }
  if (!esRespuestaGuardar(data)) throw new ErrorServicio('respuesta', MENSAJE_GUARDAR, data)

  if (data.paths_quitados.length > 0) {
    try {
      await borrarArchivos(data.paths_quitados)
    } catch (e) {
      console.error('El producto se guardó, pero no se pudieron borrar imágenes viejas:', e)
    }
  }
  return data.id
}
