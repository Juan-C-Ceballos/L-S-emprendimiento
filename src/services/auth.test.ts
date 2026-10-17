import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorServicio, MENSAJE_SIN_CONEXION } from './errores'
import { escucharSesion, ingresar, MENSAJE_CREDENCIALES, MENSAJE_SIN_ACCESO, obtenerSesion } from './auth'

const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({ obtenerSupabase: () => ({ auth }) }))

function sesionCon(appMetadata: Record<string, unknown>, email = 'admin@ls.test') {
  return { user: { email, app_metadata: appMetadata } }
}

async function capturar(promesa: Promise<unknown>): Promise<ErrorServicio> {
  try {
    await promesa
  } catch (e) {
    if (e instanceof ErrorServicio) return e
    throw e
  }
  throw new Error('Se esperaba un ErrorServicio.')
}

beforeEach(() => {
  vi.resetAllMocks()
  auth.signOut.mockResolvedValue({ error: null })
})

describe('ingresar', () => {
  it('con una cuenta admin devuelve la sesión', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { session: sesionCon({ provider: 'email', role: 'admin' }) },
      error: null,
    })
    await expect(ingresar('admin@ls.test', 'clave')).resolves.toEqual({ email: 'admin@ls.test' })
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@ls.test',
      password: 'clave',
    })
    expect(auth.signOut).not.toHaveBeenCalled()
  })

  it('sin rol admin cierra la sesión y lanza sin_acceso', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { session: sesionCon({ provider: 'email' }, 'vendedora@ls.test') },
      error: null,
    })
    const error = await capturar(ingresar('vendedora@ls.test', 'clave'))
    expect(error.codigo).toBe('sin_acceso')
    expect(error.message).toBe(MENSAJE_SIN_ACCESO)
    expect(auth.signOut).toHaveBeenCalledOnce()
  })

  it('con credenciales inválidas lanza credenciales', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: new AuthApiError('Invalid login credentials', 400, 'invalid_credentials'),
    })
    const error = await capturar(ingresar('admin@ls.test', 'mal'))
    expect(error.codigo).toBe('credenciales')
    expect(error.message).toBe(MENSAJE_CREDENCIALES)
  })

  it('sin red lanza sin_conexion', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: new AuthRetryableFetchError('Failed to fetch', 0),
    })
    const error = await capturar(ingresar('admin@ls.test', 'clave'))
    expect(error.codigo).toBe('sin_conexion')
    expect(error.message).toBe(MENSAJE_SIN_CONEXION)
  })
})

describe('obtenerSesion', () => {
  it('devuelve null si la sesión guardada no es de una admin', async () => {
    auth.getSession.mockResolvedValue({ data: { session: sesionCon({}) }, error: null })
    await expect(obtenerSesion()).resolves.toBeNull()
  })

  it('devuelve el email si es admin', async () => {
    auth.getSession.mockResolvedValue({
      data: { session: sesionCon({ role: 'admin' }) },
      error: null,
    })
    await expect(obtenerSesion()).resolves.toEqual({ email: 'admin@ls.test' })
  })
})

describe('escucharSesion', () => {
  it('traduce cada evento y se desuscribe', () => {
    const unsubscribe = vi.fn()
    auth.onAuthStateChange.mockImplementation((cb: (evento: string, sesion: unknown) => void) => {
      cb('INITIAL_SESSION', sesionCon({ role: 'admin' }))
      cb('SIGNED_OUT', null)
      return { data: { subscription: { unsubscribe } } }
    })
    const cb = vi.fn()
    const desuscribir = escucharSesion(cb)
    expect(cb.mock.calls).toEqual([[{ email: 'admin@ls.test' }], [null]])
    desuscribir()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
