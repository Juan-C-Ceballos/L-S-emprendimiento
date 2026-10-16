import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductoPage } from './ProductoPage'
import { obtenerProductoPublico } from '@/services/productos'
import { renderizarRutas } from '@/test/renderizar'
import type { ProductoCatalogo } from '@/types/dominio'

vi.mock('@/services/productos', () => ({ obtenerProductoPublico: vi.fn() }))

function imagen(n: number) {
  return { id: `i${n}`, orden: n, path: `${n}.jpg`, pathMiniatura: `${n}-min.jpg`, url: `${n}.jpg`, urlMiniatura: `${n}-min.jpg` }
}

const ID = '00000000-0000-4000-8000-000000000005'

const PULSERA: ProductoCatalogo = {
  id: ID,
  nombre: 'Pulsera eslabón fino',
  descripcion: 'Cadena de eslabón fino con baño dorado.',
  precio: 18900,
  stock: 2,
  imagenes: [imagen(0), imagen(1), imagen(2)],
  etiquetas: ['pulseras', 'dorado'],
}

function renderizar() {
  return renderizarRutas(
    [
      { path: '/producto/:id', element: <ProductoPage /> },
      { path: '/', element: <p>Catálogo</p> },
      { path: '/carrito', element: <p>Carrito</p> },
    ],
    `/producto/${ID}`,
  )
}

const carritoGuardado = () => JSON.parse(localStorage.getItem('ls:carrito:v1') ?? '[]') as unknown

beforeEach(() => {
  localStorage.clear()
  vi.mocked(obtenerProductoPublico).mockResolvedValue(PULSERA)
})

describe('ProductoPage', () => {
  it('muestra nombre, precio, nota de stock bajo, galería y título de la pestaña', async () => {
    renderizar()
    expect(await screen.findByRole('heading', { level: 1, name: 'Pulsera eslabón fino' })).toBeInTheDocument()
    expect(screen.getByText('$18.900')).toBeInTheDocument()
    expect(screen.getByText('Últimas 2 unidades')).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver foto 1 de 3' })).toHaveAttribute('aria-current', 'true')
    expect(document.title).toBe('Pulsera eslabón fino · L&S')
  })

  it('agrega al carrito sin pasar del stock y avisa', async () => {
    const usuario = userEvent.setup()
    renderizar()
    const [sumar] = await screen.findAllByRole('button', { name: 'Sumar una unidad' })
    const [agregar] = screen.getAllByRole('button', { name: 'Agregar al carrito' })
    if (sumar === undefined || agregar === undefined) throw new Error('falta el stepper')
    await usuario.click(sumar)
    await usuario.click(agregar)

    expect(screen.getByRole('status')).toHaveTextContent('Agregaste 2 unidades al carrito.')
    expect(carritoGuardado()).toEqual([{ productoId: ID, cantidad: 2 }])
    expect(screen.getByText(/Ya tenés 2 en el carrito/)).toBeInTheDocument()
    // Con el stock completo en el carrito ya no se puede agregar más.
    expect(screen.queryByRole('button', { name: 'Agregar al carrito' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Ya tenés todo el stock · Ver carrito' })[0]).toHaveAttribute(
      'href',
      '/carrito',
    )
  })

  it('los puntos cambian la foto y el stepper respeta el stock', async () => {
    const usuario = userEvent.setup()
    Element.prototype.scrollTo = vi.fn()
    renderizar()
    await usuario.click(await screen.findByRole('button', { name: 'Ver foto 3 de 3' }))
    expect(screen.getByText('3 / 3')).toBeInTheDocument()

    const [sumar] = screen.getAllByRole('button', { name: 'Sumar una unidad' })
    if (sumar === undefined) throw new Error('falta el stepper')
    await usuario.click(sumar)
    expect(sumar).toBeDisabled()
  })

  it('tocar una etiqueta lleva al catálogo filtrado por esa etiqueta', async () => {
    const usuario = userEvent.setup()
    const router = renderizar()
    await usuario.click(await screen.findByRole('link', { name: 'Ver más piezas con la etiqueta dorado' }))
    expect(router.state.location.pathname + router.state.location.search).toBe('/?tags=dorado')
  })

  it('agotado: badge, nota en rojo y botón «Agotado»', async () => {
    vi.mocked(obtenerProductoPublico).mockResolvedValue({ ...PULSERA, stock: 0 })
    renderizar()
    expect(await screen.findByText('Esta pieza está agotada por ahora.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Agotado' })[0]).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Agregar al carrito' })).not.toBeInTheDocument()
  })
})
