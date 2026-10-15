import { useCallback, useEffect, useState } from 'react'

export type EstadoAsync<T> =
  | { estado: 'cargando'; datos: undefined; error: undefined }
  | { estado: 'listo'; datos: T; error: undefined }
  | { estado: 'error'; datos: undefined; error: unknown }

type Resultado<T> = { fn: () => Promise<T>; version: number } & (
  | { estado: 'listo'; datos: T }
  | { estado: 'error'; error: unknown }
)

/**
 * Hook mínimo para llamar a un servicio (D-10): carga, error y recarga.
 * `fn` tiene que ser estable (useCallback) o cambiar solo cuando cambian sus parámetros.
 */
export function useAsync<T>(fn: () => Promise<T>): EstadoAsync<T> & { recargar: () => void } {
  const [version, setVersion] = useState(0)
  const [resultado, setResultado] = useState<Resultado<T> | null>(null)

  useEffect(() => {
    let vigente = true
    fn().then(
      (datos) => {
        if (vigente) setResultado({ fn, version, estado: 'listo', datos })
      },
      (error: unknown) => {
        if (vigente) setResultado({ fn, version, estado: 'error', error })
      },
    )
    return () => {
      vigente = false
    }
  }, [fn, version])

  const recargar = useCallback(() => {
    setVersion((v) => v + 1)
  }, [])

  // Un resultado de una llamada anterior (otra `fn` u otra recarga) cuenta como "cargando".
  if (resultado === null || resultado.fn !== fn || resultado.version !== version) {
    return { estado: 'cargando', datos: undefined, error: undefined, recargar }
  }
  if (resultado.estado === 'listo') {
    return { estado: 'listo', datos: resultado.datos, error: undefined, recargar }
  }
  return { estado: 'error', datos: undefined, error: resultado.error, recargar }
}
