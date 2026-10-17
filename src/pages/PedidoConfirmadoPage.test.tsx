import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PedidoConfirmadoPage } from './PedidoConfirmadoPage'
import { obtenerAjustesWhatsApp } from '@/services/ajustes'
import { guardarUltimoPedido } from '@/services/pedidos'
import { MENSAJE_WHATSAPP_ORIGINAL } from '@/lib/whatsapp'
import { renderizarRutas } from '@/test/renderizar'

vi.mock('@/services/ajustes', () => ({ obtenerAjustesWhatsApp: vi.fn() }))

const A = '00000000-0000-4000-8000-000000000001'
const B = '00000000-0000-4000-8000-000000000005'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('PedidoConfirmadoPage', () => {
  beforeEach(() => {
    guardarUltimoPedido({
      id: 'o7',
      numero: 7,
      total: 47900,
      cliente: 'Camila Ríos',
      items: [
        { productoId: A, nombre: 'Argollas clásicas doradas', cantidad: 2, precioUnitario: 14500, subtotal: 29000 },
        { productoId: B, nombre: 'Pulsera eslabón fino', cantidad: 1, precioUnitario: 18900, subtotal: 18900 },
      ],
    })
  })

  function renderizar() {
    return renderizarRutas([{ path: '/pedido/confirmado', element: <PedidoConfirmadoPage /> }], '/pedido/confirmado')
  }

  it('muestra el número, el mensaje y el link de WhatsApp al número de Ajustes', async () => {
    vi.mocked(obtenerAjustesWhatsApp).mockResolvedValue({
      numero: '5491100000000',
      mensaje: MENSAJE_WHATSAPP_ORIGINAL,
    })
    renderizar()
    expect(screen.getByText('Pedido #0007 · pendiente')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('¡Gracias, Camila!')
    const enlace = await screen.findByRole('link', { name: 'Enviar por WhatsApp' })
    const href = enlace.getAttribute('href') ?? ''
    expect(href.startsWith('https://wa.me/5491100000000?text=')).toBe(true)
    expect(decodeURIComponent(href.split('?text=')[1] ?? '')).toBe(
      '¡Hola! Te escribo por mi pedido #0007 de L&S.\n\n' +
        '• 2 × Argollas clásicas doradas — $29.000\n• 1 × Pulsera eslabón fino — $18.900\n\n' +
        'Total: $47.900\nNombre: Camila Ríos\n\n¡Gracias!',
    )
    expect(enlace).toHaveAttribute('target', '_blank')
    expect(screen.getByText('Se abre un chat con L&S al +54 9 11 0000-0000.')).toBeInTheDocument()
  })

  it('sin número configurado no muestra el botón, pero el pedido quedó registrado', async () => {
    vi.mocked(obtenerAjustesWhatsApp).mockResolvedValue({ numero: '', mensaje: MENSAJE_WHATSAPP_ORIGINAL })
    renderizar()
    expect(
      await screen.findByText('Tu pedido quedó registrado. Te vamos a escribir al teléfono que dejaste para coordinar.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Enviar por WhatsApp' })).not.toBeInTheDocument()
  })
})
