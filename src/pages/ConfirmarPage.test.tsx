import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfirmarPage } from './ConfirmarPage'
import { crearPedido, guardarUltimoPedido, PedidoRechazado } from '@/services/pedidos'
import { obtenerProductosPorIds } from '@/services/productos'
import { renderizarRutas } from '@/test/renderizar'
import type { PedidoCreado, ProductoCarrito } from '@/types/dominio'

vi.mock('@/services/productos', () => ({ obtenerProductosPorIds: vi.fn() }))
vi.mock('@/services/pedidos', async (original) => ({
  ...(await original<typeof import('@/services/pedidos')>()),
  crearPedido: vi.fn(),
  guardarUltimoPedido: vi.fn(),
}))

const A = '00000000-0000-4000-8000-000000000001'
const B = '00000000-0000-4000-8000-000000000005'

const producto = (id: string, nombre: string, precio: number, stock: number): ProductoCarrito => ({
  id,
  nombre,
  precio,
  stock,
  miniaturaUrl: null,
})

const ARGOLLAS = producto(A, 'Argollas clásicas doradas', 14500, 12)
const PULSERA = producto(B, 'Pulsera eslabón fino', 18900, 2)

const PEDIDO: PedidoCreado = {
  id: 'o7',
  numero: 7,
  total: 47900,
  cliente: 'Camila Ríos',
  items: [],
}

function renderizar() {
  return renderizarRutas(
    [
      { path: '/confirmar', element: <ConfirmarPage /> },
      { path: '/pedido/confirmado', element: <p>Éxito</p> },
      { path: '/carrito', element: <p>Carrito</p> },
    ],
    '/confirmar',
  )
}

const carritoGuardado = () => JSON.parse(localStorage.getItem('ls:carrito:v1') ?? '[]') as unknown

async function completar(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(await screen.findByLabelText('Nombre'), 'Camila Ríos')
  await usuario.type(screen.getByLabelText('Teléfono'), '351 612-4488')
}

beforeEach(() => {
  localStorage.setItem(
    'ls:carrito:v1',
    JSON.stringify([
      { productoId: A, cantidad: 2 },
      { productoId: B, cantidad: 1 },
    ]),
  )
  vi.mocked(obtenerProductosPorIds).mockResolvedValue([ARGOLLAS, PULSERA])
  vi.mocked(crearPedido).mockReset()
  vi.mocked(guardarUltimoPedido).mockReset()
})

describe('ConfirmarPage', () => {
  it('muestra el resumen con precios de la base y valida sin llamar a la base', async () => {
    const usuario = userEvent.setup()
    renderizar()
    expect(await screen.findByText('3 piezas · Total $47.900')).toBeInTheDocument()

    await usuario.type(screen.getByLabelText('Nombre'), 'A')
    await usuario.click(screen.getByRole('button', { name: 'Confirmar pedido' }))
    expect(screen.getByText('El nombre es muy corto. Escribí al menos 2 letras.')).toBeInTheDocument()
    expect(screen.getByText('Necesitamos un teléfono para coordinar por WhatsApp.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Revisá los datos marcados.')
    expect(crearPedido).not.toHaveBeenCalled()
  })

  it('pedido válido: manda producto y cantidad con el total visto, guarda, navega y vacía el carrito', async () => {
    const usuario = userEvent.setup()
    vi.mocked(crearPedido).mockResolvedValue(PEDIDO)
    const router = renderizar()
    await completar(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Confirmar pedido' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/pedido/confirmado')
    })
    expect(crearPedido).toHaveBeenCalledWith({
      items: [
        { productoId: A, cantidad: 2 },
        { productoId: B, cantidad: 1 },
      ],
      cliente: 'Camila Ríos',
      telefono: '351 612-4488',
      totalEsperado: 47900,
    })
    expect(guardarUltimoPedido).toHaveBeenCalledWith(PEDIDO)
    expect(router.state.historyAction).toBe('REPLACE')
    expect(carritoGuardado()).toEqual([])
  })

  it('doble clic crea un solo pedido', async () => {
    const usuario = userEvent.setup()
    let resolver: (p: PedidoCreado) => void = () => undefined
    vi.mocked(crearPedido).mockReturnValue(
      new Promise((r) => {
        resolver = r
      }),
    )
    renderizar()
    await completar(usuario)
    const boton = screen.getByRole('button', { name: 'Confirmar pedido' })
    await usuario.dblClick(boton)
    expect(screen.getByRole('button', { name: 'Confirmando…' })).toBeDisabled()
    resolver(PEDIDO)
    await waitFor(() => {
      expect(guardarUltimoPedido).toHaveBeenCalled()
    })
    expect(crearPedido).toHaveBeenCalledTimes(1)
  })

  it('si la base rechaza por stock, muestra la alerta y «Ajustar» deja confirmar', async () => {
    const usuario = userEvent.setup()
    vi.mocked(crearPedido).mockRejectedValueOnce(
      new PedidoRechazado({
        errores: [{ tipo: 'stock_insuficiente', productoId: A, nombre: 'Argollas clásicas doradas', disponible: 1, pedido: 2 }],
      }),
    )
    renderizar()
    await completar(usuario)
    // Entre que abrió la pantalla y confirmó, la administradora bajó el stock a 1.
    vi.mocked(obtenerProductosPorIds).mockResolvedValue([{ ...ARGOLLAS, stock: 1 }, PULSERA])
    await usuario.click(screen.getByRole('button', { name: 'Confirmar pedido' }))

    expect(
      await screen.findByText('Argollas clásicas doradas: quedan 1 y pediste 2. Bajá la cantidad.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Camila Ríos')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ajustar al stock disponible' })).toBeEnabled()
    })
    await usuario.click(screen.getByRole('button', { name: 'Ajustar al stock disponible' }))
    expect(carritoGuardado()).toEqual([
      { productoId: A, cantidad: 1 },
      { productoId: B, cantidad: 1 },
    ])
    expect(screen.queryByText('Antes de confirmar, corregí tu carrito')).not.toBeInTheDocument()
    expect(screen.getByText('2 piezas · Total $33.400')).toBeInTheDocument()
  })

  it('si cambió el precio, avisa con el total nuevo y la segunda vez manda ese total', async () => {
    const usuario = userEvent.setup()
    vi.mocked(crearPedido)
      .mockRejectedValueOnce(
        new PedidoRechazado({
          errores: [{ tipo: 'precio_cambiado' }],
          precios: [{ productoId: A, precio: 15000 }],
          totalActual: 48900,
        }),
      )
      .mockResolvedValueOnce(PEDIDO)
    renderizar()
    await completar(usuario)
    vi.mocked(obtenerProductosPorIds).mockResolvedValue([{ ...ARGOLLAS, precio: 15000 }, PULSERA])
    await usuario.click(screen.getByRole('button', { name: 'Confirmar pedido' }))

    expect(
      await screen.findByText('Cambió el precio de algunas piezas. Revisá el total antes de confirmar.', {
        selector: 'p',
      }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Total actualizado: $48.900')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Confirmar pedido' }))
    await waitFor(() => {
      expect(crearPedido).toHaveBeenLastCalledWith(expect.objectContaining({ totalEsperado: 48900 }))
    })
  })
})
