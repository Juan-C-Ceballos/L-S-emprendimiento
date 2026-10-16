import { z } from 'zod'
import { soloDigitos } from '@/lib/whatsapp'

/** Ajustes > WhatsApp de la tienda. Mensajes copiados del prototipo (`saveSettings`). */
export const esquemaAjustesWhatsApp = z.object({
  numero: z
    .string()
    .transform(soloDigitos)
    .pipe(
      z
        .string()
        .min(1, { error: 'Ingresá el número de WhatsApp de la tienda.', abort: true })
        .regex(/^\d{10,15}$/, {
          error: 'Revisá el número: incluí código de país y de área, por ejemplo +54 9 11 0000-0000.',
        }),
    ),
  mensaje: z
    .string()
    .refine((m) => m.trim() !== '', { error: 'El mensaje no puede quedar vacío.' })
    .refine((m) => m.includes('{items}'), {
      error: 'Incluí {items} para que el mensaje diga qué piezas pidió el cliente.',
      abort: true,
    })
    .refine((m) => m.length <= 1000, { error: 'El mensaje es muy largo: dejalo en 1000 letras o menos.' }),
})

export type AjustesWhatsAppForm = z.input<typeof esquemaAjustesWhatsApp>

/** "12.500" → 12500; vacío → null. Los inputs de números aceptan solo dígitos. */
function entero(texto: string): number | null {
  const digitos = texto.replace(/\D/g, '')
  return digitos === '' ? null : Number.parseInt(digitos, 10)
}

/** Formulario de producto. Mensajes copiados del prototipo (`saveProduct`). */
export const esquemaProducto = z.object({
  nombre: z.string().trim().min(1, { error: 'Poné un nombre: es lo que ve el cliente en la vidriera.' }),
  descripcion: z.string().trim(),
  precio: z
    .string()
    .transform(entero)
    .refine((n) => n !== null && n > 0, { error: 'Ingresá un precio mayor a $0, solo con números.' })
    .transform((n) => n ?? 0),
  costo: z
    .string()
    .transform(entero)
    .refine((n) => n !== null, { error: 'Ingresá el costo (puede ser 0). Solo lo ves vos.' }),
  stock: z
    .string()
    .transform(entero)
    .refine((n) => n !== null, { error: 'Ingresá cuántas unidades tenés (0 si está agotado).' }),
  cantidadImagenes: z
    .number()
    .min(1, { error: 'Agregá al menos una imagen: la primera va a ser la portada.' }),
})

export type CampoProducto = keyof z.input<typeof esquemaProducto>
