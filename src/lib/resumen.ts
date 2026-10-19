import { formatearPrecio } from '@/lib/formato'
import type { ResumenPanel, StockEtiqueta } from '@/types/dominio'

export function plural(n: number, singular: string, varios: string): string {
  return n === 1 ? `1 ${singular}` : `${n} ${varios}`
}

/** Textos de las tres tarjetas (prototipo: bloque `sum` de `renderVals`). */
export function textosResumen(r: ResumenPanel) {
  const { pendientes, stockBajo, ventasMes } = r
  return {
    pendientes: pendientes.cantidad > 0 ? `Por ${formatearPrecio(pendientes.monto)}` : 'Nada por atender',
    stockBajo:
      stockBajo.agotados > 0
        ? `${plural(stockBajo.agotados, 'agotado', 'agotados')} · 3 u. o menos`
        : '3 unidades o menos',
    ventas: `${plural(ventasMes.cantidad, 'pedido vendido', 'pedidos vendidos')} · ganancia ${formatearPrecio(ventasMes.ganancia)}`,
  }
}


/** "Por etiqueta": las seguidas o, si no se eligió ninguna, todas; de más a menos unidades. */
export function etiquetasAMostrar(lista: StockEtiqueta[]): StockEtiqueta[] {
  const seguidas = lista.filter((e) => e.seguida)
  return (seguidas.length > 0 ? seguidas : [...lista]).sort(
    (a, b) => b.unidades - a.unidades || a.nombre.localeCompare(b.nombre, 'es'),
  )
}
