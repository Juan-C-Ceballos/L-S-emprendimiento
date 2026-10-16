import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CatalogoPage } from './CatalogoPage'
import { listarCatalogo } from '@/services/productos'
import type { ProductoVidriera } from '@/types/dominio'

vi.mock('@/services/productos', () => ({ listarCatalogo: vi.fn() }))

function producto(nombre: string, etiquetas: string[], stock = 5): ProductoVidriera {
  return { id: nombre, nombre, precio: 10000, stock, agotado: stock <= 0, portadaUrl: null, etiquetas }
}

function renderizar(ruta = '/') {
  const router = createMemoryRouter([{ path: '/', element: <CatalogoPage /> }], { initialEntries: [ruta] })
  render(<RouterProvider router={router} />)
  return router
}

/** Nombres de las tarjetas, en orden. */
function tarjetas(): string[] {
  const grilla = screen.queryByRole('list')
  if (grilla === null) return []
  return within(grilla)
    .getAllByRole('link')
    .map((a) => a.getAttribute('aria-label')?.split(',')[0] ?? '')
}

beforeEach(() => {
  vi.mocked(listarCatalogo).mockResolvedValue({
    productos: [
      producto('Aros gota martillada', ['aros', 'dorado'], 0),
      producto('Argollas clásicas doradas', ['aros', 'dorado', 'acero']),
      producto('Aros perla mini', ['aros', 'plateado', 'perlas']),
      producto('Pulsera eslabón fino', ['pulseras', 'dorado', 'acero'], 2),
    ],
    etiquetas: ['aros', 'pulseras', 'dorado', 'plateado', 'acero', 'perlas'],
  })
})

describe('CatalogoPage', () => {
  it('muestra todas las piezas con los agotados al final', async () => {
    renderizar()
    expect(await screen.findByText('4 piezas en la vidriera')).toBeInTheDocument()
    expect(tarjetas()).toEqual([
      'Argollas clásicas doradas',
      'Aros perla mini',
      'Pulsera eslabón fino',
      'Aros gota martillada',
    ])
    expect(screen.getByText('Agotado')).toBeInTheDocument()
  })

  it('tocar una chip actualiza la URL, la grilla y los contadores', async () => {
    const usuario = userEvent.setup()
    const router = renderizar()
    await usuario.click(await screen.findByRole('button', { name: 'dorado, 3 piezas' }))

    expect(router.state.location.search).toBe('?tags=dorado')
    expect(router.state.historyAction).toBe('PUSH')
    expect(screen.getByRole('button', { name: 'Quitar filtro dorado' })).toBeInTheDocument()
    expect(tarjetas()).toEqual(['Argollas clásicas doradas', 'Pulsera eslabón fino', 'Aros gota martillada'])
    expect(screen.getByText('3 de 4 piezas')).toBeInTheDocument()
    // Modo todas: cuentan sobre el resultado; "plateado" queda en 0 y atenuada.
    expect(screen.getByRole('button', { name: 'plateado, 0 piezas' })).toHaveClass('opacity-[0.36]')

    await usuario.click(screen.getByRole('button', { name: 'pulseras, 1 pieza' }))
    expect(router.state.location.search).toBe('?tags=dorado,pulseras')
    expect(tarjetas()).toEqual(['Pulsera eslabón fino'])
  })

  it('cambiar el modo cambia los resultados', async () => {
    const usuario = userEvent.setup()
    const router = renderizar('/?tags=perlas,pulseras')
    expect(await screen.findByText('No encontramos piezas')).toBeInTheDocument()

    await usuario.selectOptions(screen.getByRole('combobox', { name: 'Cómo combinar las etiquetas' }), 'alguna')
    expect(router.state.location.search).toBe('?tags=perlas,pulseras&modo=alguna')
    expect(tarjetas()).toEqual(['Aros perla mini', 'Pulsera eslabón fino'])
  })

  it('el vacío muestra la pista y «Que tenga alguna» pasa al modo alguna', async () => {
    const usuario = userEvent.setup()
    const router = renderizar('/?tags=perlas,pulseras')
    expect(
      await screen.findByText(
        'Ninguna pieza es perlas + pulseras a la vez. Probá cambiando la búsqueda o quitando una etiqueta.',
      ),
    ).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Que tenga alguna' }))
    expect(router.state.location.search).toBe('?tags=perlas,pulseras&modo=alguna')
  })

  it('la búsqueda por nombre espera, ignora tildes y reemplaza la entrada del historial', async () => {
    const usuario = userEvent.setup()
    const router = renderizar()
    await usuario.type(await screen.findByRole('searchbox', { name: 'Buscar piezas por nombre' }), 'PÉRLA')
    expect(screen.getByText('Buscando…')).toBeInTheDocument()
    await waitFor(() => {
      expect(router.state.location.search).toBe('?q=P%C3%89RLA')
    })
    expect(router.state.historyAction).toBe('REPLACE')
    await waitFor(() => {
      expect(tarjetas()).toEqual(['Aros perla mini'])
    })
  })

  it('el buscador de etiquetas filtra las chips y Enter elige la primera', async () => {
    const usuario = userEvent.setup()
    const router = renderizar()
    const buscador = await screen.findByRole('textbox', { name: 'Buscar etiqueta para filtrar' })
    await usuario.type(buscador, 'pla')
    expect(screen.queryByRole('button', { name: /^aros/ })).not.toBeInTheDocument()
    await usuario.keyboard('{Enter}')
    expect(router.state.location.search).toBe('?tags=plateado')
    expect(buscador).toHaveValue('')

    await usuario.type(buscador, 'oro')
    expect(screen.getByText('No hay otras etiquetas que coincidan con «oro».')).toBeInTheDocument()
  })

  it('una etiqueta desconocida en la URL se ignora y «Limpiar filtros» vuelve a todo', async () => {
    const usuario = userEvent.setup()
    const router = renderizar('/?tags=aros,oro')
    expect(await screen.findByText('3 de 4 piezas')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Quitar filtro oro' })).not.toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(router.state.location.search).toBe('')
    expect(screen.getByText('4 piezas en la vidriera')).toBeInTheDocument()
  })

  it('si falla la carga, ofrece reintentar', async () => {
    const usuario = userEvent.setup()
    vi.mocked(listarCatalogo).mockRejectedValueOnce(new Error('red'))
    renderizar()
    expect(await screen.findByText('No pudimos cargar la vidriera.')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('4 piezas en la vidriera')).toBeInTheDocument()
  })
})
