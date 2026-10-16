import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PedidosPage } from './PedidosPage'
import { listarPedidosAdmin } from '@/services/pedidos'
import type { EstadoPedido, PedidoResumen } from '@/types/dominio'

vi.mock('@/services/pedidos', () => ({ listarPedidosAdmin: vi.fn() }))

const pedido = (numero: number, cliente: string, estado: EstadoPedido): PedidoResumen => ({
  id: `o${numero}`,
  numero,
  estado,
  cliente,
  telefono: '351 000-0000',
  total: 10000,
  creadoEn: '2026-10-15T12:00:00Z',
})

function renderizar(ruta = '/admin/pedidos') {
  const router = createMemoryRouter([{ path: '/admin/pedidos', element: <PedidosPage /> }], {
    initialEntries: [ruta],
  })
  render(<RouterProvider router={router} />)
  return router
}

const filas = () =>
  screen.queryAllByRole('link').map((a) => a.getAttribute('aria-label')?.split(' de ')[0] ?? '')

beforeEach(() => {
  vi.mocked(listarPedidosAdmin).mockResolvedValue([
    pedido(6, 'Julieta Ortiz', 'pendiente'),
    pedido(5, 'Lucía Benítez', 'pendiente'),
    pedido(4, 'Valentina Paz', 'vendido'),
    pedido(3, 'Sofía Herrera', 'vendido'),
    pedido(2, 'Martina Gómez', 'cancelado'),
    pedido(1, 'Camila Ríos', 'vendido'),
  ])
})

describe('PedidosPage', () => {
  it('por defecto muestra los pendientes con los contadores', async () => {
    renderizar()
    expect(await screen.findByText('2 pedidos')).toBeInTheDocument()
    expect(filas()).toEqual(['Pedido #0006', 'Pedido #0005'])
    expect(screen.getByRole('button', { name: /Vendidos/ })).toHaveTextContent('3')
    expect(screen.getByRole('button', { name: /Cancelados/ })).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: /Todos/ })).toHaveTextContent('6')
  })

  it('el chip cambia el estado en la URL', async () => {
    const usuario = userEvent.setup()
    const router = renderizar()
    await usuario.click(await screen.findByRole('button', { name: /Vendidos/ }))
    expect(router.state.location.search).toBe('?estado=vendido')
    expect(filas()).toEqual(['Pedido #0004', 'Pedido #0003', 'Pedido #0001'])
  })

  it('busca por número y por cliente sin tildes', async () => {
    const usuario = userEvent.setup()
    const router = renderizar('/admin/pedidos?estado=todos')
    await usuario.type(await screen.findByRole('searchbox', { name: /Buscar pedidos/ }), '#0006')
    await waitFor(() => {
      expect(router.state.location.search).toBe('?estado=todos&q=%230006')
    })
    // La URL cambia antes de que React vuelva a dibujar la lista.
    await waitFor(() => {
      expect(filas()).toEqual(['Pedido #0006'])
    })

    await usuario.clear(screen.getByRole('searchbox', { name: /Buscar pedidos/ }))
    await usuario.type(screen.getByRole('searchbox', { name: /Buscar pedidos/ }), 'lucia')
    expect(await screen.findByText('1 pedido para «lucia»')).toBeInTheDocument()
    expect(filas()).toEqual(['Pedido #0005'])
  })

  it('vacío de cancelados sin búsqueda: «Mejor así.»', async () => {
    vi.mocked(listarPedidosAdmin).mockResolvedValue([pedido(6, 'Julieta Ortiz', 'pendiente')])
    renderizar('/admin/pedidos?estado=cancelado')
    expect(await screen.findByText('No hay pedidos cancelados')).toBeInTheDocument()
    expect(screen.getByText('Mejor así.')).toBeInTheDocument()
  })
})
