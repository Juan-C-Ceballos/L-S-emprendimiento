import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CarritoPage } from './CarritoPage'
import { obtenerProductosPorIds } from '@/services/productos'
import { renderizarRutas } from '@/test/renderizar'

vi.mock('@/services/productos', () => ({ obtenerProductosPorIds: vi.fn() }))

const A = '00000000-0000-4000-8000-000000000001'
const B = '00000000-0000-4000-8000-000000000005'

beforeEach(() => {
  localStorage.clear()
})

describe('CarritoPage', () => {
  it('muestra líneas con precios de la base, avisos de stock y quita con toast', async () => {
    const usuario = userEvent.setup()
    localStorage.setItem(
      'ls:carrito:v1',
      JSON.stringify([
        { productoId: A, cantidad: 2 },
        { productoId: B, cantidad: 3 },
      ]),
    )
    vi.mocked(obtenerProductosPorIds).mockResolvedValue([
      { id: A, nombre: 'Argollas clásicas doradas', precio: 14500, stock: 12, miniaturaUrl: null },
      { id: B, nombre: 'Pulsera eslabón fino', precio: 18900, stock: 2, miniaturaUrl: null },
    ])
    renderizarRutas([{ path: '/carrito', element: <CarritoPage /> }], '/carrito')

    expect(await screen.findByText('$14.500 c/u')).toBeInTheDocument()
    expect(screen.getByText('Pulsera eslabón fino: quedan 2 y pediste 3. Bajá la cantidad.')).toBeInTheDocument()
    expect(screen.getAllByText('$85.700')).not.toHaveLength(0)

    await usuario.click(screen.getByRole('button', { name: 'Quitar Pulsera eslabón fino del carrito' }))
    expect(screen.getByRole('status')).toHaveTextContent('Quitaste Pulsera eslabón fino del carrito.')
    expect(screen.queryByText('Pulsera eslabón fino')).not.toBeInTheDocument()
  })

  it('vacío: invita a ver el catálogo', () => {
    renderizarRutas([{ path: '/carrito', element: <CarritoPage /> }], '/carrito')
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver catálogo' })).toHaveAttribute('href', '/')
  })
})
