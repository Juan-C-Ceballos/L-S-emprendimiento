import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductoFormPage } from './ProductoFormPage'
import { ToastProvider } from '@/components/Toast'
import { listarEtiquetasConUso } from '@/services/etiquetas'
import { guardarProducto, obtenerProductoAdmin } from '@/services/productos'
import type { Producto } from '@/types/dominio'

vi.mock('@/services/etiquetas', () => ({ listarEtiquetasConUso: vi.fn() }))
vi.mock('@/services/productos', () => ({ guardarProducto: vi.fn(), obtenerProductoAdmin: vi.fn() }))
vi.mock('@/services/imagenes', () => ({
  borrarArchivos: vi.fn().mockResolvedValue(undefined),
  subirImagen: vi.fn(),
  urlPublica: (p: string) => p,
}))

const PRODUCTO: Producto = {
  id: '00000000-0000-4000-8000-000000000001',
  nombre: 'Argollas clásicas doradas',
  descripcion: 'Acero quirúrgico.',
  precio: 14500,
  costo: 5200,
  stock: 12,
  activo: true,
  etiquetas: ['aros', 'dorado'],
  imagenes: [
    { id: 'i1', orden: 0, path: '/seed/1-1.svg', pathMiniatura: '/seed/1-1.svg', url: '/seed/1-1.svg', urlMiniatura: '/seed/1-1.svg' },
    { id: 'i2', orden: 1, path: '/seed/1-2.svg', pathMiniatura: '/seed/1-2.svg', url: '/seed/1-2.svg', urlMiniatura: '/seed/1-2.svg' },
  ],
  creadoEn: '2026-10-01T12:00:00Z',
  actualizadoEn: '2026-10-01T12:00:00Z',
}

function renderizar(ruta: string) {
  const router = createMemoryRouter(
    [
      { path: '/admin/productos/nuevo', element: <ProductoFormPage /> },
      { path: '/admin/productos/:id', element: <ProductoFormPage /> },
      { path: '/admin/productos', element: <p>Lista de productos</p> },
    ],
    { initialEntries: [ruta] },
  )
  render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  )
}

beforeEach(() => {
  vi.mocked(listarEtiquetasConUso).mockResolvedValue([
    { nombre: 'aros', usos: 5 },
    { nombre: 'dorado', usos: 7 },
  ])
  vi.mocked(obtenerProductoAdmin).mockResolvedValue(PRODUCTO)
  vi.mocked(guardarProducto).mockReset()
})

describe('ProductoFormPage', () => {
  it('al crear vacío muestra los errores del prototipo y no guarda', async () => {
    const usuario = userEvent.setup()
    renderizar('/admin/productos/nuevo')
    await usuario.click(await screen.findByRole('button', { name: 'Crear producto' }))

    for (const texto of [
      'Poné un nombre: es lo que ve el cliente en la vidriera.',
      'Ingresá un precio mayor a $0, solo con números.',
      'Ingresá el costo (puede ser 0). Solo lo ves vos.',
      'Ingresá cuántas unidades tenés (0 si está agotado).',
      'Agregá al menos una imagen: la primera va a ser la portada.',
    ]) {
      expect(screen.getByText(texto)).toBeInTheDocument()
    }
    expect(screen.getByRole('status')).toHaveTextContent('Revisá los campos marcados en rojo.')
    expect(guardarProducto).not.toHaveBeenCalled()
  })

  it('precio 0 no vale; costo 0 sí; el margen se calcula en vivo', async () => {
    const usuario = userEvent.setup()
    renderizar('/admin/productos/nuevo')
    await usuario.type(await screen.findByLabelText('Precio'), '0')
    await usuario.type(screen.getByLabelText('Costo'), '0')
    await usuario.click(screen.getByRole('button', { name: 'Crear producto' }))
    expect(screen.getByText('Ingresá un precio mayor a $0, solo con números.')).toBeInTheDocument()
    expect(screen.queryByText('Ingresá el costo (puede ser 0). Solo lo ves vos.')).not.toBeInTheDocument()

    await usuario.clear(screen.getByLabelText('Precio'))
    await usuario.type(screen.getByLabelText('Precio'), '10a00')
    expect(screen.getByLabelText('Precio')).toHaveValue('1000')
    await usuario.clear(screen.getByLabelText('Costo'))
    await usuario.type(screen.getByLabelText('Costo'), '1500')
    expect(screen.getByText('Ojo: el precio está por debajo del costo')).toBeInTheDocument()
    expect(screen.getByText('−$500')).toBeInTheDocument()
  })

  it('el interruptor activo cambia el texto de ayuda', async () => {
    const usuario = userEvent.setup()
    renderizar('/admin/productos/nuevo')
    const interruptor = await screen.findByRole('switch', { name: /Activo: visible en el catálogo/ })
    expect(interruptor).toBeChecked()
    expect(screen.getByText('Los clientes lo ven en la vidriera.')).toBeInTheDocument()
    await usuario.click(interruptor)
    expect(interruptor).not.toBeChecked()
    expect(
      screen.getByText('Oculto para los clientes. Los productos no se borran: se desactivan.'),
    ).toBeInTheDocument()
  })

  it('al editar carga los datos, cambia la portada y guarda en orden', async () => {
    vi.mocked(guardarProducto).mockResolvedValue(PRODUCTO.id)
    const usuario = userEvent.setup()
    renderizar(`/admin/productos/${PRODUCTO.id}`)
    expect(await screen.findByLabelText('Nombre')).toHaveValue('Argollas clásicas doradas')
    expect(screen.getByText('64% del precio')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Imagen 2. Tocá para hacerla portada' }))
    expect(screen.getByRole('status')).toHaveTextContent('Listo, esa imagen es la nueva portada.')
    await usuario.click(screen.getByRole('button', { name: 'Quitar etiqueta dorado' }))
    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(guardarProducto).toHaveBeenCalledWith({
      id: PRODUCTO.id,
      nombre: 'Argollas clásicas doradas',
      descripcion: 'Acero quirúrgico.',
      precio: 14500,
      costo: 5200,
      stock: 12,
      activo: true,
      etiquetas: ['aros'],
      imagenes: [
        { path: '/seed/1-2.svg', pathMiniatura: '/seed/1-2.svg' },
        { path: '/seed/1-1.svg', pathMiniatura: '/seed/1-1.svg' },
      ],
    })
    expect(await screen.findByText('Lista de productos')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Cambios guardados.')
  })

  it('crea una etiqueta nueva con Enter, normalizada', async () => {
    const usuario = userEvent.setup()
    renderizar('/admin/productos/nuevo')
    await usuario.type(await screen.findByLabelText('Agregar etiqueta'), '  Edición  Limitada{Enter}')
    expect(screen.getByRole('button', { name: 'Quitar etiqueta edición limitada' })).toBeInTheDocument()
  })

  it('un id que no existe muestra el aviso', async () => {
    vi.mocked(obtenerProductoAdmin).mockResolvedValue(null)
    renderizar('/admin/productos/no-existe')
    expect(await screen.findByText('No encontramos este producto.')).toBeInTheDocument()
  })
})
