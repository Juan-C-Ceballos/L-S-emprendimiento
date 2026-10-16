import { beforeEach, describe, expect, it, vi } from 'vitest'
import { crearPedido, guardarUltimoPedido, leerUltimoPedido, PedidoRechazado } from './pedidos'

const rpc = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ obtenerSupabase: () => ({ rpc }) }))

const A = '00000000-0000-4000-8000-000000000001'
const B = '00000000-0000-4000-8000-000000000005'

const DATOS = {
  items: [
    { productoId: A, cantidad: 2 },
    { productoId: B, cantidad: 1 },
  ],
  cliente: 'Camila Ríos',
  telefono: '351 612-4488',
  totalEsperado: 47900,
}

beforeEach(() => {
  rpc.mockReset()
  sessionStorage.clear()
})

describe('crearPedido', () => {
  it('manda producto y cantidad (sin precios) y mapea ok: true', async () => {
    rpc.mockResolvedValue({
      data: {
        ok: true,
        pedido: {
          id: 'o7',
          numero: 7,
          total: 47900,
          cliente: 'Camila Ríos',
          items: [
            { producto_id: A, nombre: 'Argollas clásicas doradas', cantidad: 2, precio_unitario: 14500, subtotal: 29000 },
            { producto_id: B, nombre: 'Pulsera eslabón fino', cantidad: 1, precio_unitario: 18900, subtotal: 18900 },
          ],
        },
      },
      error: null,
    })

    const pedido = await crearPedido(DATOS)
    expect(rpc).toHaveBeenCalledWith('crear_pedido', {
      p_items: [
        { producto_id: A, cantidad: 2 },
        { producto_id: B, cantidad: 1 },
      ],
      p_cliente: 'Camila Ríos',
      p_telefono: '351 612-4488',
      p_total_esperado: 47900,
    })
    expect(pedido).toEqual({
      id: 'o7',
      numero: 7,
      total: 47900,
      cliente: 'Camila Ríos',
      items: [
        { productoId: A, nombre: 'Argollas clásicas doradas', cantidad: 2, precioUnitario: 14500, subtotal: 29000 },
        { productoId: B, nombre: 'Pulsera eslabón fino', cantidad: 1, precioUnitario: 18900, subtotal: 18900 },
      ],
    })
  })

  it('ok: false por stock lanza PedidoRechazado con los errores tipados', async () => {
    rpc.mockResolvedValue({
      data: {
        ok: false,
        errores: [
          { tipo: 'stock_insuficiente', producto_id: B, nombre: 'Pulsera eslabón fino', disponible: 0, pedido: 1 },
          { tipo: 'inactivo', producto_id: A, nombre: 'Argollas clásicas doradas' },
        ],
      },
      error: null,
    })
    const error: unknown = await crearPedido(DATOS).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(PedidoRechazado)
    expect(error).toMatchObject({
      codigo: 'pedido_rechazado',
      message: 'Hay piezas sin stock suficiente. Corregí el carrito para seguir.',
      rechazo: {
        errores: [
          { tipo: 'stock_insuficiente', productoId: B, nombre: 'Pulsera eslabón fino', disponible: 0, pedido: 1 },
          { tipo: 'inactivo', productoId: A, nombre: 'Argollas clásicas doradas' },
        ],
      },
    })
  })

  it('ok: false por precio trae los precios y el total actual', async () => {
    rpc.mockResolvedValue({
      data: {
        ok: false,
        errores: [{ tipo: 'precio_cambiado' }],
        precios: [{ producto_id: A, precio: 15000 }],
        total_actual: 48900,
      },
      error: null,
    })
    await expect(crearPedido(DATOS)).rejects.toMatchObject({
      message: 'Cambió el precio de algunas piezas. Revisá el total antes de confirmar.',
      rechazo: { precios: [{ productoId: A, precio: 15000 }], totalActual: 48900 },
    })
  })

  it('el error 22023 es datos inválidos y una respuesta rara no se acepta', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '22023', message: 'datos_invalidos: telefono' } })
    await expect(crearPedido(DATOS)).rejects.toMatchObject({
      codigo: 'datos_invalidos',
      message: 'Revisá los datos marcados.',
    })
    rpc.mockResolvedValue({ data: { ok: true }, error: null })
    await expect(crearPedido(DATOS)).rejects.toMatchObject({ codigo: 'respuesta' })
  })
})

describe('último pedido', () => {
  it('se guarda y se lee de sessionStorage; si está roto, null', () => {
    expect(leerUltimoPedido()).toBeNull()
    const pedido = { id: 'o7', numero: 7, total: 100, cliente: 'Ana', items: [] }
    guardarUltimoPedido(pedido)
    expect(leerUltimoPedido()).toEqual(pedido)
    sessionStorage.setItem('ls:ultimo-pedido', '{roto')
    expect(leerUltimoPedido()).toBeNull()
  })
})
