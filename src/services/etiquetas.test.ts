import { beforeEach, describe, expect, it, vi } from 'vitest'
import { crearEtiqueta, eliminarEtiqueta, renombrarEtiqueta } from './etiquetas'

const rpc = vi.hoisted(() => vi.fn())
// Consulta encadenable: cada método la devuelve y `await` da `respuesta`.
const consulta = vi.hoisted(() => {
  const c = {
    respuesta: { data: null as unknown, error: null as unknown },
    llamadas: [] as [string, unknown[]][],
    registrar(metodo: string, args: unknown[]) {
      c.llamadas.push([metodo, args])
      return c
    },
    from: (...args: unknown[]) => c.registrar('from', args),
    insert: (...args: unknown[]) => c.registrar('insert', args),
    delete: (...args: unknown[]) => c.registrar('delete', args),
    select: (...args: unknown[]) => c.registrar('select', args),
    eq: (...args: unknown[]) => c.registrar('eq', args),
    maybeSingle: () => c.registrar('maybeSingle', []),
    then: (resolver: (v: unknown) => unknown) => Promise.resolve(c.respuesta).then(resolver),
  }
  return c
})

vi.mock('@/lib/supabase', () => ({ obtenerSupabase: () => ({ rpc, from: consulta.from }) }))

beforeEach(() => {
  rpc.mockReset()
  consulta.respuesta = { data: null, error: null }
  consulta.llamadas = []
})

describe('renombrarEtiqueta', () => {
  it.each(['renombrada', 'unida', 'sin_cambios'] as const)('mapea resultado %s', async (resultado) => {
    rpc.mockResolvedValue({ data: { resultado, id: 't6' }, error: null })
    await expect(renombrarEtiqueta('t8', 'dorado')).resolves.toEqual({ resultado, id: 't6' })
    expect(rpc).toHaveBeenCalledWith('renombrar_etiqueta', { p_id: 't8', p_nombre: 'dorado' })
  })

  it('traduce los errores de la base', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '22023', message: 'datos_invalidos: nombre' } })
    await expect(renombrarEtiqueta('t8', ' ')).rejects.toMatchObject({ message: 'Escribí un nombre para la etiqueta.' })
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'no_autorizado' } })
    await expect(renombrarEtiqueta('t8', 'x')).rejects.toMatchObject({ codigo: 'sin_acceso' })
  })
})

describe('crearEtiqueta y eliminarEtiqueta', () => {
  it('crea con el nombre normalizado y avisa si ya existe', async () => {
    consulta.respuesta = { data: { nombre: 'oro rosa' }, error: null }
    await expect(crearEtiqueta('  Oro   Rosa ')).resolves.toBe('oro rosa')
    expect(consulta.llamadas).toContainEqual(['insert', [{ nombre: 'oro rosa' }]])

    consulta.respuesta = { data: null, error: { code: '23505', message: 'duplicate key' } }
    await expect(crearEtiqueta('Dorado')).rejects.toMatchObject({ message: '«dorado» ya existe.' })
  })

  it('eliminar sin filas borradas avisa', async () => {
    consulta.respuesta = { data: [{ id: 't9' }], error: null }
    await expect(eliminarEtiqueta('t9')).resolves.toBeUndefined()
    consulta.respuesta = { data: [], error: null }
    await expect(eliminarEtiqueta('t9')).rejects.toMatchObject({ codigo: 'sin_cambios' })
  })
})
