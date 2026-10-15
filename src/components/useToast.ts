import { createContext, useContext } from 'react'

export type ContextoToast = {
  /** Muestra un mensaje abajo durante 2,8 s. Reemplaza al anterior si había uno. */
  mostrarToast: (mensaje: string) => void
}

export const ToastContext = createContext<ContextoToast | null>(null)

export function useToast(): ContextoToast {
  const contexto = useContext(ToastContext)
  if (contexto === null) throw new Error('useToast tiene que usarse dentro de <ToastProvider>.')
  return contexto
}
