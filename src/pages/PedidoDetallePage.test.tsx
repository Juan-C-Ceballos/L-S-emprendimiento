import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PedidoDetallePage } from './PedidoDetallePage'
import { ToastProvider } from '@/components/Toast'
import { ErrorServicio } from '@/services/errores'
import { cancelarPedido, marcarVendido, obtenerPedido } from '@/services/pedidos'
import type { ItemPedidoDetalle, PedidoDetalle } from '@/types/dominio'

vi.mock('@/services/pedidos', () => ({
  obtenerPedido: vi.fn(),
  marcarVendido: vi.fn(),
  cancelarPedido: vi.fn(),
}))

const item = (extra: Partial<ItemPedidoDetalle>): ItemPedidoDetalle => ({
  productoId: 'p1',
  nombre: 'Argollas clásicas doradas',
  cantidad: 1,
  precioUnitario: 13900,
  costoUnitario: 5000,
  subtotal: 13900,
  precioActual: 14500,
  stockActual: 12,
  miniaturaUrl: null,
  ...extra,
})

const pedido = (extra: Partial<PedidoDetalle>): PedidoDetalle => ({
  id: 'o5',
  numero: 5,
  estado: 'pendiente',
  cliente: 'Lucía Benítez',
  telefono: '351 228-7710',
  total: 38700,
  creadoEn: '2026-10-15T23:32:00Z',
  vendidoEn: null,
  canceladoEn: null,
  ganancia: 24600,
  items: [
    item({ productoId: 'p5', nombre: 'Pulsera eslabón fino', precioUnitario: 18900, precioActual: 18900, subtotal: 18900, stockActual: 2 }),
    item({ productoId: 'p8', nombre: 'Collar corazón', precioUnitario: 19800, precioActual: 19800, subtotal: 19800, stockActual: 7 }),
  ],
  ...extra,
})

function renderizar(numero = 5) {
  const router = createMemoryRouter([{ path: '/admin/pedidos/:numero', element: <PedidoDetallePage /> }], {
    initialEntries: [`/admin/pedidos/${numero}`],
  })
  render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  )
}

beforeEach(() => {
  vi.mocked(obtenerPedido).mockReset()
  vi.mocked(marcarVendido).mockReset()
  vi.mocked(cancelarPedido).mockReset()
})

describe('PedidoDetallePage', () => {
  it('pendiente: muestra ítems, ganancia y vender descuenta stock con el aviso', async () => {
    const usuario = userEvent.setup()
    vi.mocked(obtenerPedido)
      .mockResolvedValueOnce(pedido({}))
      .mockResolvedValue(pedido({ estado: 'vendido', vendidoEn: '2026-10-16T12:00:00Z' }))
    vi.mocked(marcarVendido).mockResolvedValue([
      { productoId: 'p8', nombre: 'Collar corazón', desde: 7, hasta: 6 },
      { productoId: 'p5', nombre: 'Pulsera eslabón fino', desde: 2, hasta: 1 },
    ])
    renderizar()

    expect(await screen.findByText('#0005')).toBeInTheDocument()
    expect(screen.getByText('1 × Pulsera eslabón fino')).toBeInTheDocument()
    expect(screen.getByText('$24.600')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Escribir por WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/5493512287710',
    )
    expect(screen.getByText('Descuenta 2 unidades del stock en una sola acción.')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Marcar como vendido' }))
    expect(marcarVendido).toHaveBeenCalledWith('o5')
    expect(await screen.findByText('Listo: se descontó el stock')).toBeInTheDocument()
    expect(screen.getByText('2 → 1')).toBeInTheDocument()
    expect(screen.getByText('Pedido #0005 vendido. Stock actualizado.')).toBeInTheDocument()
    // Se relee de la base: ahora está vendido y ya no se puede vender.
    expect(await screen.findByText(/Si lo cancelás, el stock se repone\./)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Marcar como vendido' })).not.toBeInTheDocument()
  })

  it('precio actual distinto y stock que no alcanza: alerta y botón deshabilitado', async () => {
    vi.mocked(obtenerPedido).mockResolvedValue(
      pedido({ items: [item({ cantidad: 2, subtotal: 27800, stockActual: 1 })] }),
    )
    renderizar()
    expect(await screen.findByText('Precio actual: $14.500')).toBeInTheDocument()
    expect(screen.getByText('No alcanza el stock')).toBeInTheDocument()
    expect(screen.getByText('Stock actual: 1')).toHaveClass('text-peligro')
    expect(screen.getByRole('button', { name: 'Marcar como vendido' })).toBeDisabled()
  })

  it('cancelar un vendido pide confirmación, repone stock y muestra el aviso', async () => {
    const usuario = userEvent.setup()
    const vendido = pedido({ estado: 'vendido', vendidoEn: '2026-10-16T12:00:00Z' })
    vi.mocked(obtenerPedido).mockResolvedValueOnce(vendido).mockResolvedValue({ ...vendido, estado: 'cancelado' })
    vi.mocked(cancelarPedido).mockResolvedValue([{ productoId: 'p5', nombre: 'Pulsera eslabón fino', desde: 1, hasta: 2 }])
    renderizar()

    await usuario.click(await screen.findByRole('button', { name: 'Cancelar pedido' }))
    const confirmacion = screen.getByRole('alertdialog', { name: '¿Cancelar el pedido #0005?' })
    expect(confirmacion).toHaveTextContent(
      'Ya estaba vendido: se van a reponer 2 unidades al stock. Después no se puede volver a vender.',
    )
    await usuario.click(screen.getByRole('button', { name: 'No, volver' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(cancelarPedido).not.toHaveBeenCalled()

    await usuario.click(screen.getByRole('button', { name: 'Cancelar pedido' }))
    await usuario.click(screen.getByRole('button', { name: 'Sí, cancelar' }))
    expect(await screen.findByText('Listo: se repuso el stock')).toBeInTheDocument()
    expect(screen.getByText('Pedido #0005 cancelado. Stock repuesto.')).toBeInTheDocument()
    expect(
      await screen.findByText('Este pedido está cancelado. Un pedido cancelado no se puede volver a vender.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument()
  })

  it('si otra pestaña ya lo cambió, avisa y recarga', async () => {
    const usuario = userEvent.setup()
    vi.mocked(obtenerPedido)
      .mockResolvedValueOnce(pedido({}))
      .mockResolvedValue(pedido({ estado: 'cancelado', canceladoEn: '2026-10-16T12:00:00Z' }))
    vi.mocked(marcarVendido).mockRejectedValue(
      new ErrorServicio('estado_invalido', 'Este pedido ya estaba cancelado. Actualizamos la pantalla.'),
    )
    renderizar()
    await usuario.click(await screen.findByRole('button', { name: 'Marcar como vendido' }))
    expect(await screen.findByText('Este pedido ya estaba cancelado. Actualizamos la pantalla.')).toBeInTheDocument()
    await waitFor(() => {
      expect(obtenerPedido).toHaveBeenCalledTimes(2)
    })
    expect(await screen.findByText(/Este pedido está cancelado\./)).toBeInTheDocument()
  })

  it('un número que no existe muestra el aviso', async () => {
    vi.mocked(obtenerPedido).mockResolvedValue(null)
    renderizar(99)
    expect(await screen.findByText('No encontramos este pedido')).toBeInTheDocument()
  })
})
