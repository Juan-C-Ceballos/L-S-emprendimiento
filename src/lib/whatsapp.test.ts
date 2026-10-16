import { describe, expect, it } from 'vitest'
import { armarMensaje, enlaceWhatsApp, MENSAJE_WHATSAPP_ORIGINAL, PEDIDO_EJEMPLO } from './whatsapp'
import { esquemaAjustesWhatsApp } from './esquemas'

describe('armarMensaje', () => {
  it('arma el mensaje original con los datos del pedido', () => {
    expect(armarMensaje(MENSAJE_WHATSAPP_ORIGINAL, PEDIDO_EJEMPLO)).toBe(
      '¡Hola! Te escribo por mi pedido #0007 de L&S.\n\n' +
        '• 2 × Argollas clásicas doradas — $29.000\n' +
        '• 1 × Pulsera eslabón fino — $18.900\n\n' +
        'Total: $47.900\nNombre: Camila Ríos\n\n¡Gracias!',
    )
  })

  it('reemplaza todas las apariciones y deja el resto del texto igual', () => {
    expect(armarMensaje('{nombre} / {nombre} / {otra}', PEDIDO_EJEMPLO)).toBe(
      'Camila Ríos / Camila Ríos / {otra}',
    )
  })
})

describe('enlaceWhatsApp', () => {
  it('deja solo los dígitos del número y codifica el mensaje', () => {
    expect(enlaceWhatsApp('+54 9 11 0000-0000', 'Hola & chau\n#1')).toBe(
      'https://wa.me/5491100000000?text=Hola%20%26%20chau%0A%231',
    )
  })
})

describe('esquemaAjustesWhatsApp', () => {
  it('normaliza el número a dígitos', () => {
    const r = esquemaAjustesWhatsApp.parse({ numero: '+54 9 11 0000-0000', mensaje: '{items}' })
    expect(r).toEqual({ numero: '5491100000000', mensaje: '{items}' })
  })

  it.each([
    ['', 'Ingresá el número de WhatsApp de la tienda.'],
    ['+54 11', 'Revisá el número: incluí código de país y de área, por ejemplo +54 9 11 0000-0000.'],
  ])('número «%s» → %s', (numero, error) => {
    const r = esquemaAjustesWhatsApp.safeParse({ numero, mensaje: '{items}' })
    expect(r.success).toBe(false)
    expect(r.error?.issues.map((i) => i.message)).toEqual([error])
  })

  it.each([
    ['   ', 'El mensaje no puede quedar vacío.'],
    ['Hola, quiero hacer un pedido', 'Incluí {items} para que el mensaje diga qué piezas pidió el cliente.'],
  ])('mensaje «%s» → %s', (mensaje, error) => {
    const r = esquemaAjustesWhatsApp.safeParse({ numero: '5491100000000', mensaje })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.message).toBe(error)
  })
})
