import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResumenPage } from './ResumenPage'
import { ToastProvider } from '@/components/Toast'
import { textosResumen } from '@/lib/resumen'
import { ErrorServicio } from '@/services/errores'
import { guardarEtiquetasSeguidas, obtenerDatosResumen, type DatosResumen } from '@/services/resumen'
import type { ResumenPanel, StockEtiqueta } from '@/types/dominio'

vi.mock('@/services/resumen', () => ({ obtenerDatosResumen: vi.fn(), guardarEtiquetasSeguidas: vi.fn() }))

const resumen = (extra: Partial<ResumenPanel>): ResumenPanel => ({
  pendientes: { cantidad: 2, monto: 67700 },
  ventasMes: { mes: '2026-10', cantidad: 2, total: 82000, ganancia: 50000 },
  ...extra,
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
      ventas: '2 pedidos vendidos · ganancia $50.000',
    })
    expect(
      textosResumen(
        resumen({
          pendientes: { cantidad: 0, monto: 0 },
          ventasMes: { mes: '2026-10', cantidad: 1, total: 100, ganancia: 40 },
        }),
      ),
    ).toEqual({
      pendientes: 'Nada por atender',
      ventas: '1 pedido vendido · ganancia $40',
    })
  })
})

describe('ResumenPage', () => {
  it('con pendientes: tarjetas con links a las listas filtradas y los pedidos para atender', async () => {
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
      porEtiqueta: [],
    })

    const pendientes = await screen.findByRole('link', { name: /Pedidos pendientes/ })
    expect(pendientes).toHaveAttribute('href', '/admin/pedidos?estado=pendiente')
    expect(pendientes).toHaveTextContent('Por $67.700')
    const ventas = screen.getByRole('link', { name: /Ventas de octubre/ })
    expect(ventas).toHaveAttribute('href', '/admin/pedidos?estado=vendido')
    expect(ventas).toHaveTextContent('$82.000')

    expect(screen.getByRole('link', { name: 'Pedido #0006 de Julieta Ortiz, Pendiente' })).toHaveTextContent(
      '#0006 · ',
    )
    expect(screen.queryByText('Para reponer')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Stock bajo/ })).not.toBeInTheDocument()
  })

  it('sin pendientes: el vacío del prototipo', async () => {
    renderizar({
      resumen: resumen({ pendientes: { cantidad: 0, monto: 0 } }),
      paraAtender: [],
      porEtiqueta: [],
    })
    expect(await screen.findByText('Todo al día')).toBeInTheDocument()
    expect(screen.getByText('Nada por atender')).toBeInTheDocument()
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

    const modal = screen.getByRole('dialog', { name: 'Etiquetas del resumen' })
    expect(within(modal).getByText('1 de 2 marcadas')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /anillos/ })).toBeChecked()
    await usuario.click(screen.getByRole('checkbox', { name: /aros/ }))
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(guardarEtiquetasSeguidas).toHaveBeenCalledWith(['t-anillos', 't-aros'])
    await waitFor(() => {
      expect(obtenerDatosResumen).toHaveBeenCalledTimes(2)
    })
    expect(await screen.findByText('Guardamos las etiquetas del resumen.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('«Marcar todas» y «Desmarcar todas» cambian todas las casillas', async () => {
    const usuario = userEvent.setup()
    vi.mocked(guardarEtiquetasSeguidas).mockResolvedValue()
    renderizar({
      ...sinPendientes,
      porEtiqueta: [etiqueta('anillos', 1), etiqueta('aros', 26), etiqueta('pulseras', 2)],
    })
    await usuario.click(await screen.findByRole('button', { name: 'Elegir etiquetas' }))
    expect(screen.queryByRole('button', { name: 'Desmarcar todas' })).not.toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Marcar todas' }))
    expect(screen.getAllByRole('checkbox').every((c) => (c as HTMLInputElement).checked)).toBe(true)
    expect(screen.getByText('3 de 3 marcadas')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Marcar todas' })).not.toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Desmarcar todas' }))
    expect(screen.getAllByRole('checkbox').some((c) => (c as HTMLInputElement).checked)).toBe(false)

    await usuario.click(screen.getByRole('button', { name: 'Marcar todas' }))
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(guardarEtiquetasSeguidas).toHaveBeenCalledWith(['t-anillos', 't-aros', 't-pulseras'])
  })

  it('cancelar no guarda y un error se muestra sin cerrar el selector', async () => {
    const usuario = userEvent.setup()
    renderizar({ ...sinPendientes, porEtiqueta: [etiqueta('aros', 26)] })
    await usuario.click(await screen.findByRole('button', { name: 'Elegir etiquetas' }))
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Escape y la cruz también cierran sin guardar.
    await usuario.click(screen.getByRole('button', { name: 'Elegir etiquetas' }))
    await usuario.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Elegir etiquetas' })).toHaveFocus()
    await usuario.click(screen.getByRole('button', { name: 'Elegir etiquetas' }))
    await usuario.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
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
