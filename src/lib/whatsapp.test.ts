import { describe, expect, it } from 'vitest'
import {
  armarMensaje,
  enlaceWhatsApp,
  formatearTelefonoTienda,
  MENSAJE_WHATSAPP_ORIGINAL,
  PEDIDO_EJEMPLO,
} from './whatsapp'
import { esquemaAjustesWhatsApp, esquemaConfirmacion } from './esquemas'

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

describe('formatearTelefonoTienda', () => {
  it('agrupa celulares argentinos y deja el resto con +', () => {
    expect(formatearTelefonoTienda('5491100000000')).toBe('+54 9 11 0000-0000')
    expect(formatearTelefonoTienda('5493515551234')).toBe('+54 9 351 555-1234')
    expect(formatearTelefonoTienda('+1 (555) 010-9999')).toBe('+15550109999')
  })
})

describe('esquemaConfirmacion', () => {
  const errores = (datos: { nombre: string; telefono: string }) => {
    const r = esquemaConfirmacion.safeParse(datos)
    return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]))
  }

  it('acepta nombre y teléfono válidos y recorta espacios', () => {
    expect(esquemaConfirmacion.parse({ nombre: '  Ana ', telefono: ' +54 9 351 555-1234 ' })).toEqual({
      nombre: 'Ana',
      telefono: '+54 9 351 555-1234',
    })
  })

  it('muestra los mensajes del prototipo', () => {
    expect(errores({ nombre: ' ', telefono: '' })).toEqual({
      nombre: 'Escribí tu nombre así sabemos a quién le preparamos el pedido.',
      telefono: 'Necesitamos un teléfono para coordinar por WhatsApp.',
    })
    expect(errores({ nombre: 'A', telefono: '351 555' })).toEqual({
      nombre: 'El nombre es muy corto. Escribí al menos 2 letras.',
      telefono:
        'Revisá el número: tiene que tener entre 8 y 15 dígitos, con código de área (ej. 351 555-1234).',
    })
    expect(errores({ nombre: 'Ana', telefono: '1234567890123456' })).toHaveProperty('telefono')
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
