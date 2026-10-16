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
