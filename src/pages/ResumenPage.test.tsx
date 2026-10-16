import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResumenPage } from './ResumenPage'
import { textosResumen } from '@/lib/resumen'
import { obtenerDatosResumen, type DatosResumen } from '@/services/resumen'
import type { Producto, ResumenPanel } from '@/types/dominio'

vi.mock('@/services/resumen', () => ({ obtenerDatosResumen: vi.fn() }))

const resumen = (extra: Partial<ResumenPanel>): ResumenPanel => ({
  pendientes: { cantidad: 2, monto: 67700 },
  stockBajo: { cantidad: 2, agotados: 1 },
  ventasMes: { mes: '2026-10', cantidad: 2, total: 82000, ganancia: 50000 },
  ...extra,
})

const producto = (nombre: string, stock: number): Producto => ({
  id: nombre,
  nombre,
  descripcion: '',
  precio: 16800,
  costo: 6000,
  stock,
  activo: true,
  imagenes: [],
  etiquetas: [],
  creadoEn: '2026-10-01T12:00:00Z',
  actualizadoEn: '2026-10-01T12:00:00Z',
})

function renderizar(datos: DatosResumen) {
  vi.mocked(obtenerDatosResumen).mockResolvedValue(datos)
  const router = createMemoryRouter([{ path: '/admin', element: <ResumenPage /> }], { initialEntries: ['/admin'] })
  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  vi.mocked(obtenerDatosResumen).mockReset()
})

describe('textosResumen', () => {
  it('singular y plural', () => {
    expect(textosResumen(resumen({}))).toEqual({
      pendientes: 'Por $67.700',
      stockBajo: '1 agotado · 3 u. o menos',
      ventas: '2 pedidos vendidos · ganancia $50.000',
    })
    expect(
      textosResumen(
        resumen({
          pendientes: { cantidad: 0, monto: 0 },
          stockBajo: { cantidad: 3, agotados: 2 },
          ventasMes: { mes: '2026-10', cantidad: 1, total: 100, ganancia: 40 },
        }),
      ),
    ).toEqual({
      pendientes: 'Nada por atender',
      stockBajo: '2 agotados · 3 u. o menos',
      ventas: '1 pedido vendido · ganancia $40',
    })
    expect(textosResumen(resumen({ stockBajo: { cantidad: 1, agotados: 0 } })).stockBajo).toBe('3 unidades o menos')
  })
})

describe('ResumenPage', () => {
  it('con pendientes: tarjetas con links a las listas filtradas y las dos listas', async () => {
    renderizar({
      resumen: resumen({}),
      paraAtender: [
        {
          id: 'o6',
          numero: 6,
          estado: 'pendiente',
          cliente: 'Julieta Ortiz',
          telefono: '11 5932-0418',
          total: 29000,
          creadoEn: '2026-10-16T12:12:00Z',
        },
      ],
      paraReponer: [producto('Aros gota martillada', 0), producto('Pulsera eslabón fino', 2)],
    })

    const pendientes = await screen.findByRole('link', { name: /Pedidos pendientes/ })
    expect(pendientes).toHaveAttribute('href', '/admin/pedidos?estado=pendiente')
    expect(pendientes).toHaveTextContent('Por $67.700')
    expect(screen.getByRole('link', { name: /Stock bajo/ })).toHaveAttribute('href', '/admin/productos?filtro=stock-bajo')
    const ventas = screen.getByRole('link', { name: /Ventas de octubre/ })
    expect(ventas).toHaveAttribute('href', '/admin/pedidos?estado=vendido')
    expect(ventas).toHaveTextContent('$82.000')

    expect(screen.getByRole('link', { name: 'Pedido #0006 de Julieta Ortiz, Pendiente' })).toHaveTextContent(
      '#0006 · ',
    )
    expect(screen.getByRole('link', { name: 'Editar Aros gota martillada' })).toHaveAttribute(
      'href',
      '/admin/productos/Aros gota martillada?desde=resumen',
    )
    expect(screen.getByText('Agotado')).toBeInTheDocument()
    expect(screen.getByText('Quedan 2')).toBeInTheDocument()
  })

  it('sin pendientes ni stock bajo: los vacíos del prototipo', async () => {
    renderizar({
      resumen: resumen({ pendientes: { cantidad: 0, monto: 0 }, stockBajo: { cantidad: 0, agotados: 0 } }),
      paraAtender: [],
      paraReponer: [],
    })
    expect(await screen.findByText('Todo al día')).toBeInTheDocument()
    expect(screen.getByText('Nada por atender')).toBeInTheDocument()
    expect(screen.getByText('Todos los productos activos tienen más de 3 unidades.')).toBeInTheDocument()
  })
})
