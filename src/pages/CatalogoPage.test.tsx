import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CatalogoPage } from './CatalogoPage'
import { listarCatalogo, ultimaVidriera } from '@/services/productos'
import { renderizarRutas } from '@/test/renderizar'
import type { ProductoVidriera } from '@/types/dominio'

vi.mock('@/services/productos', () => ({ listarCatalogo: vi.fn(), ultimaVidriera: vi.fn() }))

function producto(nombre: string, etiquetas: string[], stock = 5, precio = 10000): ProductoVidriera {
  return { id: nombre, nombre, precio, stock, agotado: stock <= 0, portadaUrl: null, etiquetas }
}

function renderizar(ruta = '/') {
  return renderizarRutas([{ path: '/', element: <CatalogoPage /> }], ruta)
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
  localStorage.clear()
  vi.mocked(ultimaVidriera).mockReturnValue(undefined)
  vi.mocked(listarCatalogo).mockResolvedValue({
    productos: [
      producto('Aros gota martillada', ['aros', 'dorado'], 0, 16800),
      producto('Argollas clásicas doradas', ['aros', 'dorado', 'acero'], 5, 14500),
      producto('Aros perla mini', ['aros', 'plateado', 'perlas'], 5, 11900),
      producto('Pulsera eslabón fino', ['pulseras', 'dorado', 'acero'], 2, 18900),
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

  it('con carrito, la barra muestra las piezas y el total con los precios de la vidriera', async () => {
    localStorage.setItem(
      'ls:carrito:v1',
      JSON.stringify([{ productoId: '00000000-0000-4000-8000-000000000002', cantidad: 2 }]),
    )
    vi.mocked(listarCatalogo).mockResolvedValue({
      productos: [{ ...producto('Aros perla mini', ['aros']), id: '00000000-0000-4000-8000-000000000002' }],
      etiquetas: ['aros'],
    })
    renderizar()
    const barra = await screen.findByRole('link', { name: /Ver carrito · 2 piezas/ })
    await waitFor(() => {
      expect(barra).toHaveTextContent('$20.000')
    })
    expect(barra).toHaveAttribute('href', '/carrito')
  })

  it('ordenar por precio cambia la URL y la grilla; «Limpiar filtros» conserva el orden', async () => {
    const usuario = userEvent.setup()
    const router = renderizar('/?tags=aros')
    await screen.findByText('3 de 4 piezas')
    await usuario.selectOptions(screen.getByRole('combobox', { name: 'Ordenar las piezas' }), 'precio-asc')
    expect(router.state.location.search).toBe('?tags=aros&orden=precio-asc')
    await waitFor(() => {
      expect(tarjetas()).toEqual(['Aros perla mini', 'Argollas clásicas doradas', 'Aros gota martillada'])
    })

    await usuario.selectOptions(screen.getByRole('combobox', { name: 'Ordenar las piezas' }), 'precio-desc')
    await waitFor(() => {
      expect(tarjetas()).toEqual(['Argollas clásicas doradas', 'Aros perla mini', 'Aros gota martillada'])
    })

    await usuario.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(router.state.location.search).toBe('?orden=precio-desc')
    await waitFor(() => {
      expect(tarjetas()).toEqual([
        'Pulsera eslabón fino',
        'Argollas clásicas doradas',
        'Aros perla mini',
        'Aros gota martillada',
      ])
    })
  })

  it('en el teléfono muestra 8 etiquetas y «Ver todas» despliega el resto', async () => {
    const usuario = userEvent.setup()
    const nombres = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10']
    vi.mocked(listarCatalogo).mockResolvedValue({
      productos: [producto('Pieza', nombres)],
      etiquetas: nombres,
    })
    renderizar()
    const ver = await screen.findByRole('button', { name: 'Ver todas (10)' })
    expect(ver).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'a8, 1 pieza' })).not.toHaveClass('hidden')
    expect(screen.getByRole('button', { name: 'a9, 1 pieza' })).toHaveClass('hidden', 'lg:inline-flex')

    await usuario.click(ver)
    expect(screen.getByRole('button', { name: 'a9, 1 pieza' })).not.toHaveClass('hidden')
    expect(screen.getByRole('button', { name: 'Ver menos' })).toHaveAttribute('aria-expanded', 'true')

    // Al buscar una etiqueta se ven todas las que coinciden y no hace falta el botón.
    await usuario.click(screen.getByRole('button', { name: 'Ver menos' }))
    await usuario.type(screen.getByRole('textbox', { name: 'Buscar etiqueta para filtrar' }), 'a1')
    expect(screen.getByRole('button', { name: 'a10, 1 pieza' })).not.toHaveClass('hidden')
    expect(screen.queryByRole('button', { name: /Ver todas/ })).not.toBeInTheDocument()
  })

  it('si falla la carga, ofrece reintentar', async () => {
    const usuario = userEvent.setup()
    vi.mocked(listarCatalogo).mockRejectedValueOnce(new Error('red'))
    renderizar()
    expect(await screen.findByText('No pudimos cargar la vidriera.')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('4 piezas en la vidriera')).toBeInTheDocument()
  })

  it('con la vidriera en memoria pinta las tarjetas en el primer render, sin esqueletos', () => {
    vi.mocked(ultimaVidriera).mockReturnValue({ productos: [producto('Aros perla mini', ['aros'])], etiquetas: ['aros'] })
    vi.mocked(listarCatalogo).mockReturnValue(new Promise(() => undefined))
    renderizar()
    expect(tarjetas()).toEqual(['Aros perla mini'])
    expect(screen.getByText('1 pieza en la vidriera')).toBeInTheDocument()
    expect(screen.queryByText('Cargando la vidriera…')).not.toBeInTheDocument()
  })

  it('con la vidriera en memoria, un error al refrescar no la tapa', async () => {
    vi.mocked(ultimaVidriera).mockReturnValue({ productos: [producto('Aros perla mini', ['aros'])], etiquetas: ['aros'] })
    vi.mocked(listarCatalogo).mockRejectedValueOnce(new Error('red'))
    renderizar()
    await waitFor(() => {
      expect(listarCatalogo).toHaveBeenCalled()
    })
    expect(screen.queryByText('No pudimos cargar la vidriera.')).not.toBeInTheDocument()
    expect(tarjetas()).toEqual(['Aros perla mini'])
  })
})
