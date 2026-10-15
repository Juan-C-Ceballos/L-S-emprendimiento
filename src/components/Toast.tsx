import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ToastContext } from '@/components/useToast'

export const DURACION_TOAST_MS = 2800

type Aviso = { id: number; mensaje: string }

/** Toast propio (D-09), estilo `.toast` del prototipo. La región `role="status"` existe siempre para que los lectores de pantalla la anuncien. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null)

  const mostrarToast = useCallback((mensaje: string) => {
    setAviso((anterior) => ({ id: (anterior?.id ?? 0) + 1, mensaje }))
  }, [])

  useEffect(() => {
    if (aviso === null) return
    const temporizador = window.setTimeout(() => {
      setAviso(null)
    }, DURACION_TOAST_MS)
    return () => {
      window.clearTimeout(temporizador)
    }
  }, [aviso])

  const valor = useMemo(() => ({ mostrarToast }), [mostrarToast])

  return (
    <ToastContext value={valor}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-[92px] left-4 z-30 lg:right-8 lg:bottom-8 lg:left-auto lg:w-[380px]"
      >
        {aviso !== null && (
          <div
            key={aviso.id}
            className="animate-toast-entrada rounded-alerta bg-tinta px-4 py-3.5 text-sm text-white shadow-toast"
          >
            {aviso.mensaje}
          </div>
        )}
      </div>
    </ToastContext>
  )
}
