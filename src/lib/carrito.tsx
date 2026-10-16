import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CarritoContext } from '@/lib/useCarrito'
import {
  agregarAlCarrito,
  CLAVE_CARRITO,
  cambiarCantidad as cambiarCantidadGuardada,
  contarPiezas,
  guardarCarrito,
  leerCarrito,
  quitarDelCarrito,
  vaciarCarrito,
} from '@/services/carrito'
import type { LineaCarrito } from '@/types/dominio'

/**
 * Estado del carrito para el sitio público (el hook está en `useCarrito.ts`). Cada acción escribe
 * en localStorage y relee; el evento `storage` sincroniza las otras pestañas.
 */
export function CarritoProvider({ children }: { children: ReactNode }) {
  const [lineas, setLineas] = useState<LineaCarrito[]>(leerCarrito)

  useEffect(() => {
    function alCambiarEnOtraPestana(e: StorageEvent) {
      if (e.key === CLAVE_CARRITO || e.key === null) setLineas(leerCarrito())
    }
    window.addEventListener('storage', alCambiarEnOtraPestana)
    return () => {
      window.removeEventListener('storage', alCambiarEnOtraPestana)
    }
  }, [])

  const releer = useCallback(() => {
    setLineas(leerCarrito())
  }, [])

  const valor = useMemo(
    () => ({
      lineas,
      piezas: contarPiezas(lineas),
      enCarrito: (id: string) => lineas.find((l) => l.productoId === id)?.cantidad ?? 0,
      agregar: (id: string, cantidad: number, max: number) => {
        const agregada = agregarAlCarrito(id, cantidad, max)
        releer()
        return agregada
      },
      cambiarCantidad: (id: string, cantidad: number) => {
        cambiarCantidadGuardada(id, cantidad)
        releer()
      },
      quitar: (id: string) => {
        quitarDelCarrito(id)
        releer()
      },
      reemplazar: (nuevas: LineaCarrito[]) => {
        guardarCarrito(nuevas)
        releer()
      },
      vaciar: () => {
        vaciarCarrito()
        releer()
      },
    }),
    [lineas, releer],
  )

  return <CarritoContext value={valor}>{children}</CarritoContext>
}
