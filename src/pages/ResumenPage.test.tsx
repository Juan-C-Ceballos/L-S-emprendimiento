import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResumenPage } from './ResumenPage'
import { ToastProvider } from '@/components/Toast'
import { textosResumen } from '@/lib/resumen'
import { ErrorServicio } from '@/services/errores'
import { guardarEtiquetasSeguidas, obtenerDatosResumen, type DatosResumen } from '@/services/resumen'
import type { Producto, ResumenPanel, StockEtiqueta } from '@/types/dominio'

vi.mock('@/services/resumen', () => ({ obtenerDatosResumen: vi.fn(), guardarEtiquetasSeguidas: vi.fn() }))

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
  render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  )
}

const etiqueta = (nombre: string, unidades: number, seguida = false): StockEtiqueta => ({
  id: `t-${nombre}`,
  nombre,
  seguida,
  productos: unidades + 1,
  piezas: unidades,
  unidades,
  vendidasMes: 1,
  vendidasTotal: 4,
})

const sinPendientes: Omit<DatosResumen, 'porEtiqueta'> = {
  resumen: resumen({}),
  paraAtender: [],
  paraReponer: [],
}

/** Nombres de las filas de "Por etiqueta", en orden. */
function filasPorEtiqueta(): string[] {
  const seccion = screen.getByRole('region', { name: 'Por etiqueta' })
  return within(seccion)
    .getAllByRole('link')
    .map((a) => a.getAttribute('aria-label')?.split(':')[0] ?? '')
}

beforeEach(() => {
  vi.mocked(obtenerDatosResumen).mockReset()
  vi.mocked(guardarEtiquetasSeguidas).mockReset()
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
      porEtiqueta: [],
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
      porEtiqueta: [],
    })
    expect(await screen.findByText('Todo al día')).toBeInTheDocument()
    expect(screen.getByText('Nada por atender')).toBeInTheDocument()
    expect(screen.getByText('Todos los productos activos tienen más de 3 unidades.')).toBeInTheDocument()
  })
})

describe('ResumenPage · Por etiqueta', () => {
  it('sin elegidas muestra todas, de más a menos unidades, con link a sus productos', async () => {
    renderizar({
      ...sinPendientes,
      porEtiqueta: [etiqueta('anillos', 0), etiqueta('aros', 26), etiqueta('pulseras', 2)],
    })
    expect(await screen.findByText('Todas las etiquetas')).toBeInTheDocument()
    expect(filasPorEtiqueta()).toEqual(['aros', 'pulseras', 'anillos'])
    expect(
      screen.getByRole('link', {
        name: 'aros: quedan 26 unidades; vendidas 1 este mes y 4 en total. Ver sus productos',
      }),
    ).toHaveAttribute('href', '/admin/productos?q=aros')
    expect(screen.getByText('Una pieza con varias etiquetas cuenta en cada una.', { exact: false })).toBeInTheDocument()
  })

  it('con elegidas muestra solo esas', async () => {
    renderizar({
      ...sinPendientes,
      porEtiqueta: [etiqueta('anillos', 1, true), etiqueta('aros', 26), etiqueta('pulseras', 2, true)],
    })
    expect(await screen.findByText('2 etiquetas elegidas')).toBeInTheDocument()
    expect(filasPorEtiqueta()).toEqual(['pulseras', 'anillos'])
  })

  it('elegir etiquetas guarda las marcadas y relee el resumen', async () => {
    const usuario = userEvent.setup()
    vi.mocked(guardarEtiquetasSeguidas).mockResolvedValue()
    renderizar({ ...sinPendientes, porEtiqueta: [etiqueta('anillos', 1, true), etiqueta('aros', 26)] })
    await usuario.click(await screen.findByRole('button', { name: 'Elegir etiquetas' }))

    expect(screen.getByRole('checkbox', { name: /anillos/ })).toBeChecked()
    await usuario.click(screen.getByRole('checkbox', { name: /aros/ }))
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(guardarEtiquetasSeguidas).toHaveBeenCalledWith(['t-anillos', 't-aros'])
    await waitFor(() => {
      expect(obtenerDatosResumen).toHaveBeenCalledTimes(2)
    })
    expect(await screen.findByText('Guardamos las etiquetas del resumen.')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('cancelar no guarda y un error se muestra sin cerrar el selector', async () => {
    const usuario = userEvent.setup()
    renderizar({ ...sinPendientes, porEtiqueta: [etiqueta('aros', 26)] })
    await usuario.click(await screen.findByRole('button', { name: 'Elegir etiquetas' }))
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(guardarEtiquetasSeguidas).not.toHaveBeenCalled()

    vi.mocked(guardarEtiquetasSeguidas).mockRejectedValue(
      new ErrorServicio('x', 'No pudimos guardar las etiquetas. Probá de nuevo.'),
    )
    await usuario.click(screen.getByRole('button', { name: 'Elegir etiquetas' }))
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos guardar las etiquetas. Probá de nuevo.')
    expect(screen.getByRole('checkbox', { name: /aros/ })).toBeInTheDocument()
  })
})
