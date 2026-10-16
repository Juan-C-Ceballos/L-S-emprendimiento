import { createContext, use } from 'react'

export type EstadoSesion =
  | { estado: 'cargando'; email: undefined }
  | { estado: 'sin-sesion'; email: undefined }
  | { estado: 'admin'; email: string }

export const SesionContext = createContext<EstadoSesion | null>(null)

export function useSesion(): EstadoSesion {
  const sesion = use(SesionContext)
  if (sesion === null) throw new Error('useSesion tiene que usarse dentro de <SesionProvider>.')
  return sesion
}
