/** Error que lanzan los servicios: `codigo` para decidir en código y `message` para mostrar. */
export class ErrorServicio extends Error {
  readonly codigo: string
  readonly detalle?: unknown

  constructor(codigo: string, mensaje: string, detalle?: unknown) {
    super(mensaje)
    this.name = 'ErrorServicio'
    this.codigo = codigo
    this.detalle = detalle
  }
}

export const MENSAJE_GENERICO = 'No pudimos completar la acción. Probá de nuevo en un rato.'
export const MENSAJE_SIN_CONEXION = 'No hay conexión. Revisá internet y probá de nuevo.'

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null
}

/** Convierte un error de supabase-js (PostgrestError, AuthError, de red…) en ErrorServicio. */
export function desdeErrorSupabase(e: unknown, mensaje = MENSAJE_GENERICO): ErrorServicio {
  if (e instanceof ErrorServicio) return e
  if (e instanceof TypeError && /fetch/i.test(e.message)) {
    return new ErrorServicio('sin_conexion', MENSAJE_SIN_CONEXION, e)
  }
  if (esObjeto(e)) {
    const codigo = typeof e.code === 'string' && e.code !== '' ? e.code : 'desconocido'
    return new ErrorServicio(codigo, mensaje, e)
  }
  return new ErrorServicio('desconocido', mensaje, e)
}
