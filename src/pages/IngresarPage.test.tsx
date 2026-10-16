import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IngresarPage } from './IngresarPage'
import { SesionContext, type EstadoSesion } from '@/lib/useSesion'
import { ingresar } from '@/services/auth'
import { ErrorServicio } from '@/services/errores'

vi.mock('@/services/auth', () => ({ ingresar: vi.fn() }))

const ingresarMock = vi.mocked(ingresar)

function Ubicacion() {
  const { pathname } = useLocation()
  return <p data-testid="ubicacion">{pathname}</p>
}

function renderizar(ruta = '/admin/ingresar', sesion: EstadoSesion = { estado: 'sin-sesion', email: undefined }) {
  const router = createMemoryRouter(
    [
      { path: '/admin/ingresar', element: <IngresarPage /> },
      { path: '/admin/*', element: <Ubicacion /> },
    ],
    { initialEntries: [ruta] },
  )
  render(
    <SesionContext value={sesion}>
      <RouterProvider router={router} />
    </SesionContext>,
  )
}

beforeEach(() => {
  ingresarMock.mockReset()
})

describe('IngresarPage', () => {
  it('valida el email y la contraseña antes de llamar al servicio', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await usuario.type(screen.getByLabelText('Email'), 'no-es-un-email')
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(screen.getByText('Escribí un email válido.')).toBeInTheDocument()
    expect(screen.getByText('Escribí tu contraseña.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(ingresarMock).not.toHaveBeenCalled()
  })

  it('muestra el error del servicio sin borrar el email', async () => {
    ingresarMock.mockRejectedValue(
      new ErrorServicio('credenciales', 'El email o la contraseña no coinciden.'),
    )
    const usuario = userEvent.setup()
    renderizar()
    await usuario.type(screen.getByLabelText('Email'), 'admin@ls.test')
    await usuario.type(screen.getByLabelText('Contraseña'), 'mal{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El email o la contraseña no coinciden.',
    )
    expect(screen.getByLabelText('Email')).toHaveValue('admin@ls.test')
    expect(ingresarMock).toHaveBeenCalledWith('admin@ls.test', 'mal')
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled()
  })

  it('al ingresar vuelve a la ruta de volver', async () => {
    ingresarMock.mockResolvedValue({ email: 'admin@ls.test' })
    const usuario = userEvent.setup()
    renderizar('/admin/ingresar?volver=/admin/productos')
    await usuario.type(screen.getByLabelText('Email'), 'admin@ls.test')
    await usuario.type(screen.getByLabelText('Contraseña'), 'clave')
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByTestId('ubicacion')).toHaveTextContent('/admin/productos')
  })

  it('ignora un volver que no es del panel', async () => {
    ingresarMock.mockResolvedValue({ email: 'admin@ls.test' })
    const usuario = userEvent.setup()
    renderizar('/admin/ingresar?volver=//otro-sitio.com')
    await usuario.type(screen.getByLabelText('Email'), 'admin@ls.test')
    await usuario.type(screen.getByLabelText('Contraseña'), 'clave{Enter}')

    expect(await screen.findByTestId('ubicacion')).toHaveTextContent(/^\/admin$/)
  })

  it('con sesión activa redirige al panel', () => {
    renderizar('/admin/ingresar', { estado: 'admin', email: 'admin@ls.test' })
    expect(screen.getByTestId('ubicacion')).toHaveTextContent(/^\/admin$/)
  })
})
