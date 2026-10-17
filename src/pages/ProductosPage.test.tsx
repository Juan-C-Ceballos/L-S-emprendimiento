import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductosPage } from './ProductosPage'
import { listarProductosAdmin } from '@/services/productos'
import type { Producto } from '@/types/dominio'

vi.mock('@/services/productos', () => ({ listarProductosAdmin: vi.fn() }))

function producto(nombre: string, extra: Partial<Producto> = {}): Producto {
  return {
    id: nombre,
    nombre,
    descripcion: '',
    precio: 10000,
    costo: 4000,
    stock: 10,
    activo: true,
    etiquetas: [],
    imagenes: [],
    creadoEn: '2026-10-01T12:00:00Z',
    actualizadoEn: '2026-10-01T12:00:00Z',
    ...extra,
  }
}

function renderizar(ruta: string) {
  const router = createMemoryRouter(
    [
      { path: '/admin/productos', element: <ProductosPage /> },
      { path: '/admin/productos/:id', element: <p>Formulario</p> },
    ],
    { initialEntries: [ruta] },
  )
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  vi.mocked(listarProductosAdmin).mockResolvedValue([
    producto('Pulsera eslabón fino', { stock: 2, etiquetas: ['pulseras'] }),
    producto('Pulsera de dijes', { etiquetas: ['pulseras'] }),
    producto('Anillo sello', { activo: false }),
  ])
})

describe('ProductosPage', () => {
  it('buscar mantiene el filtro en la URL', async () => {
    const usuario = userEvent.setup()
    const router = renderizar('/admin/productos?filtro=stock-bajo')
    expect(await screen.findByText('1 producto')).toBeInTheDocument()

    await usuario.type(screen.getByRole('searchbox', { name: /Buscar productos/ }), 'pulsera')
    expect(screen.getByText('Buscando…')).toBeInTheDocument()
    await waitFor(() => {
      expect(router.state.location.search).toBe('?filtro=stock-bajo&q=pulsera')
    })
    expect(await screen.findByText('1 producto para «pulsera»')).toBeInTheDocument()
  })

  it('el filtro mantiene la búsqueda y los contadores la respetan', async () => {
    const usuario = userEvent.setup()
    const router = renderizar('/admin/productos?q=pulsera')
    const inactivos = await screen.findByRole('button', { name: /Inactivos/ })
    expect(inactivos).toHaveTextContent('0')
    await usuario.click(screen.getByRole('button', { name: /Stock bajo/ }))
    expect(router.state.location.search).toBe('?q=pulsera&filtro=stock-bajo')
    expect(screen.getByRole('button', { name: /Stock bajo/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('un producto inactivo muestra la pill y no hay botón de borrar', async () => {
    renderizar('/admin/productos?filtro=inactivos')
    expect(await screen.findByText('Inactivo')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /borrar|eliminar/i })).not.toBeInTheDocument()
  })
})

describe('ProductosPage · carrera filtro/búsqueda', () => {
  it('si el filtro cambia mientras la búsqueda espera, no se pierde', async () => {
    const usuario = userEvent.setup()
    const router = renderizar('/admin/productos')
    await screen.findByText('3 productos')
    await usuario.type(screen.getByRole('searchbox', { name: /Buscar productos/ }), 'pulsera')
    // Antes de que pasen los 350 ms, se elige otro filtro.
    await usuario.click(screen.getByRole('button', { name: /Stock bajo/ }))
    await waitFor(() => {
      expect(router.state.location.search).toBe('?filtro=stock-bajo&q=pulsera')
    })
  })
})
