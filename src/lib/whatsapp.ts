import { formatearNumeroPedido, formatearPrecio } from '@/lib/formato'

/** Mensaje original del prototipo. Es también el valor inicial de `settings.whatsapp_mensaje`. */
export const MENSAJE_WHATSAPP_ORIGINAL =
  '¡Hola! Te escribo por mi pedido {pedido} de L&S.\n\n{items}\n\nTotal: {total}\nNombre: {nombre}\n\n¡Gracias!'

/** Datos que se pueden insertar en la plantilla (Ajustes: "Insertar dato"). */
export const DATOS_MENSAJE = [
  { clave: '{pedido}', texto: 'Nº de pedido' },
  { clave: '{items}', texto: 'Piezas' },
  { clave: '{total}', texto: 'Total' },
  { clave: '{nombre}', texto: 'Nombre' },
] as const

export type ItemMensaje = { cantidad: number; nombre: string; precioUnitario: number }

export type DatosPedidoMensaje = {
  numero: number
  items: ItemMensaje[]
  total: number
  nombre: string
}

/** Pedido de muestra para la vista previa de Ajustes. */
export const PEDIDO_EJEMPLO: DatosPedidoMensaje = {
  numero: 7,
  items: [
    { cantidad: 2, nombre: 'Argollas clásicas doradas', precioUnitario: 14500 },
    { cantidad: 1, nombre: 'Pulsera eslabón fino', precioUnitario: 18900 },
  ],
  total: 47900,
  nombre: 'Camila Ríos',
}

/** Reemplaza `{pedido}`, `{items}`, `{total}` y `{nombre}` en la plantilla. */
export function armarMensaje(plantilla: string, pedido: DatosPedidoMensaje): string {
  const items = pedido.items
    .map(
      (i) => `• ${i.cantidad} × ${i.nombre} — ${formatearPrecio(i.cantidad * i.precioUnitario)}`,
    )
    .join('\n')
  return plantilla
    .replaceAll('{pedido}', formatearNumeroPedido(pedido.numero))
    .replaceAll('{items}', items)
    .replaceAll('{total}', formatearPrecio(pedido.total))
    .replaceAll('{nombre}', pedido.nombre)
}

export function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, '')
}

/** Link `wa.me` con el mensaje prearmado. `numero` puede traer espacios, `+` o guiones. */
export function enlaceWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${soloDigitos(numero)}?text=${encodeURIComponent(mensaje)}`
}
