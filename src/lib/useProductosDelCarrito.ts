import { useCallback, useState } from 'react'
import { useAsync } from '@/lib/useAsync'
import { obtenerProductosPorIds } from '@/services/productos'
import type { LineaCarrito, ProductoCarrito } from '@/types/dominio'

/**
 * Lee de la base precio, stock y miniatura de los productos del carrito. Cuando cambian las
 * líneas (quitar una, otra pestaña) relee, pero sigue mostrando los datos anteriores mientras
 * tanto: así la pantalla (y el formulario de Confirmar) no se desarma.
 */
export function useProductosDelCarrito(lineas: LineaCarrito[]) {
  const clave = lineas
    .map((l) => l.productoId)
    .sort()
    .join(',')
  const cargar = useCallback(() => obtenerProductosPorIds(clave === '' ? [] : clave.split(',')), [clave])
  const estado = useAsync(cargar)
  const [ultimos, setUltimos] = useState<ProductoCarrito[] | null>(null)
  if (estado.estado === 'listo' && estado.datos !== ultimos) setUltimos(estado.datos)

  return {
    /** `null` solo en la primera carga. */
    productos: estado.estado === 'listo' ? estado.datos : ultimos,
    cargando: estado.estado === 'cargando',
    error: estado.estado === 'error' ? estado.error : undefined,
    recargar: estado.recargar,
  }
}
