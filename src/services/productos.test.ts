import { beforeEach, describe, expect, it, vi } from 'vitest'
import { guardarProducto } from './productos'
import { borrarArchivos } from './imagenes'
import type { DatosProducto } from '@/types/dominio'

const rpc = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({ obtenerSupabase: () => ({ rpc }) }))
vi.mock('./imagenes', () => ({ borrarArchivos: vi.fn(), urlPublica: (p: string) => p }))

const borrarMock = vi.mocked(borrarArchivos)

const DATOS: DatosProducto = {
  id: '00000000-0000-4000-8000-0000000000e1',
  nombre: 'Aros prueba',
  descripcion: '',
  precio: 12000,
  costo: 4000,
  stock: 5,
  activo: true,
  etiquetas: ['aros'],
  imagenes: [
    { path: 'e1/a.jpg', pathMiniatura: 'e1/a-min.jpg' },
    { path: 'e1/b.jpg', pathMiniatura: 'e1/b-min.jpg' },
  ],
}

beforeEach(() => {
  rpc.mockReset()
  borrarMock.mockReset()
  borrarMock.mockResolvedValue(undefined)
})

describe('guardarProducto', () => {
  it('llama a la RPC con el payload en snake_case y después borra lo quitado', async () => {
    rpc.mockResolvedValue({
      data: { id: DATOS.id, paths_quitados: ['e1/c.jpg', 'e1/c-min.jpg'] },
      error: null,
    })
    await expect(guardarProducto(DATOS)).resolves.toBe(DATOS.id)
    expect(rpc).toHaveBeenCalledWith('guardar_producto', {
      p: {
        id: DATOS.id,
        nombre: 'Aros prueba',
        descripcion: '',
        precio: 12000,
        costo: 4000,
        stock: 5,
        activo: true,
        etiquetas: ['aros'],
        imagenes: [
          { path: 'e1/a.jpg', path_miniatura: 'e1/a-min.jpg' },
          { path: 'e1/b.jpg', path_miniatura: 'e1/b-min.jpg' },
        ],
      },
    })
    expect(borrarMock).toHaveBeenCalledWith(['e1/c.jpg', 'e1/c-min.jpg'])
  })

  it('si la RPC falla, no borra nada', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '22023', message: 'sin_imagenes' } })
    await expect(guardarProducto(DATOS)).rejects.toMatchObject({ codigo: '22023' })
    expect(borrarMock).not.toHaveBeenCalled()
  })

  it('si falla el borrado de Storage, el guardado igual vale', async () => {
    rpc.mockResolvedValue({ data: { id: DATOS.id, paths_quitados: ['e1/c.jpg'] }, error: null })
    borrarMock.mockRejectedValue(new Error('red'))
    const consola = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await expect(guardarProducto(DATOS)).resolves.toBe(DATOS.id)
    expect(consola).toHaveBeenCalled()
    consola.mockRestore()
  })
})
