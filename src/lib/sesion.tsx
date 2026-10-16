import { useEffect, useState, type ReactNode } from 'react'
import { SesionContext, type EstadoSesion } from '@/lib/useSesion'
import { escucharSesion } from '@/services/auth'

/**
 * Mantiene la sesión de la administradora (el hook está en `useSesion.ts`, como `useToast`).
 * Arranca en `cargando` hasta el primer aviso de Auth, que llega aunque no haya sesión.
 */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<EstadoSesion>({ estado: 'cargando', email: undefined })

  useEffect(
    () =>
      escucharSesion((admin) => {
        setSesion(
          admin === null
            ? { estado: 'sin-sesion', email: undefined }
            : { estado: 'admin', email: admin.email },
        )
      }),
    [],
  )

  return <SesionContext value={sesion}>{children}</SesionContext>
}
