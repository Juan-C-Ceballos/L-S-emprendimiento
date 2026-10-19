import { beforeEach, describe, expect, it, vi } from 'vitest'
import { guardarProducto, listarCatalogo, obtenerProductoPublico, ultimaVidriera } from './productos'
import { borrarArchivos } from './imagenes'
import type { DatosProducto } from '@/types/dominio'

const rpc = vi.hoisted(() => vi.fn())
// Consulta encadenable de supabase-js: cada método la devuelve a ella misma y `await` da `respuesta`.
const consulta = vi.hoisted(() => {
  const c = {
    respuesta: { data: null as unknown, error: null as unknown },
    llamadas: [] as [string, unknown[]][],
    registrar(metodo: string, args: unknown[]) {
      c.llamadas.push([metodo, args])
      return c
    },
    from: (...args: unknown[]) => c.registrar('from', args),
    select: (...args: unknown[]) => c.registrar('select', args),
    eq: (...args: unknown[]) => c.registrar('eq', args),
    order: (...args: unknown[]) => c.registrar('order', args),
    maybeSingle: () => c.registrar('maybeSingle', []),
    then: (resolver: (v: unknown) => unknown) => Promise.resolve(c.respuesta).then(resolver),
  }
  return c
})

vi.mock('@/lib/supabase', () => ({ obtenerSupabase: () => ({ rpc, from: consulta.from }) }))
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
  consulta.respuesta = { data: null, error: null }
  consulta.llamadas = []
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

const tag = (id: string, nombre: string, creada = '2026-10-15T00:00:00Z') => ({
  tags: { id, nombre, created_at: creada },
})

describe('listarCatalogo', () => {
  // Va primero: la memoria es del módulo y las pruebas siguientes la llenan.
  it('guarda la última vidriera en memoria y un error no la borra', async () => {
    expect(ultimaVidriera()).toBeUndefined()
    consulta.respuesta = { data: [], error: null }
    const vidriera = await listarCatalogo()
    expect(ultimaVidriera()).toBe(vidriera)

    consulta.respuesta = { data: null, error: { code: '500', message: 'x' } }
    await expect(listarCatalogo()).rejects.toThrow()
    expect(ultimaVidriera()).toBe(vidriera)
  })

  it('portada = menor orden, etiquetas planas en orden de creación y agotado', async () => {
    consulta.respuesta = {
      data: [
        {
          id: 'p1',
          nombre: 'Aros gota martillada',
          precio: 16800,
          stock: 0,
          product_images: [
            { path_miniatura: '/seed/b-min.svg', orden: 1 },
            { path_miniatura: '/seed/a-min.svg', orden: 0 },
          ],
          product_tags: [tag('t-6', 'dorado'), tag('t-1', 'aros')],
        },
        {
          id: 'p2',
          nombre: 'Anillo nuevo',
          precio: 9000,
          stock: 3,
          product_images: [],
          product_tags: [tag('t-0', 'zirconia', '2026-10-16T00:00:00Z'), tag('t-1', 'aros')],
        },
      ],
      error: null,
    }

    await expect(listarCatalogo()).resolves.toEqual({
      productos: [
        {
          id: 'p1',
          nombre: 'Aros gota martillada',
          precio: 16800,
          stock: 0,
          agotado: true,
          portadaUrl: '/seed/a-min.svg',
          etiquetas: ['aros', 'dorado'],
        },
        {
          id: 'p2',
          nombre: 'Anillo nuevo',
          precio: 9000,
          stock: 3,
          agotado: false,
          portadaUrl: null,
          etiquetas: ['aros', 'zirconia'],
        },
      ],
      etiquetas: ['aros', 'dorado', 'zirconia'],
    })
    expect(consulta.llamadas).toContainEqual(['eq', ['activo', true]])
    const select = consulta.llamadas.find(([m]) => m === 'select')?.[1][0]
    expect(select).not.toMatch(/cost/)
  })

  it('un error de la base se muestra con el mensaje de la vidriera', async () => {
    consulta.respuesta = { data: null, error: { code: '500', message: 'x' } }
    await expect(listarCatalogo()).rejects.toMatchObject({ message: 'No pudimos cargar la vidriera.' })
  })
})

describe('obtenerProductoPublico', () => {
  it('ordena las imágenes y filtra por activo', async () => {
    consulta.respuesta = {
      data: {
        id: 'p1',
        nombre: 'Collar corazón',
        descripcion: 'Dije de corazón.',
        precio: 19800,
        stock: 7,
        product_images: [
          { id: 'i2', path: 'b.jpg', path_miniatura: 'b-min.jpg', orden: 1 },
          { id: 'i1', path: 'a.jpg', path_miniatura: 'a-min.jpg', orden: 0 },
        ],
        product_tags: [tag('t-3', 'collares')],
      },
      error: null,
    }
    const producto = await obtenerProductoPublico('p1')
    expect(producto?.imagenes.map((i) => i.url)).toEqual(['a.jpg', 'b.jpg'])
    expect(producto?.etiquetas).toEqual(['collares'])
    expect(consulta.llamadas).toContainEqual(['eq', ['activo', true]])
  })

  it('inexistente, inactivo o id con formato inválido → null', async () => {
    consulta.respuesta = { data: null, error: null }
    await expect(obtenerProductoPublico('p9')).resolves.toBeNull()
    consulta.respuesta = { data: null, error: { code: '22P02', message: 'uuid inválido' } }
    await expect(obtenerProductoPublico('abc')).resolves.toBeNull()
  })
})
