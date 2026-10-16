import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { RutaProtegida } from './RutaProtegida'
import { SesionContext, type EstadoSesion } from '@/lib/useSesion'

function Ubicacion() {
  const { pathname, search } = useLocation()
  return <p data-testid="ubicacion">{pathname + search}</p>
}

function renderizar(sesion: EstadoSesion, ruta = '/admin/productos') {
  const router = createMemoryRouter(
    [
      { path: '/admin/ingresar', element: <Ubicacion /> },
      {
        path: '/admin',
        element: <RutaProtegida />,
        children: [{ path: 'productos', element: <p>Contenido del panel</p> }],
      },
    ],
    { initialEntries: [ruta] },
  )
  render(
    <SesionContext value={sesion}>
      <RouterProvider router={router} />
    </SesionContext>,
  )
}

describe('RutaProtegida', () => {
  it('mientras carga muestra una pantalla neutra, sin login ni contenido', () => {
    renderizar({ estado: 'cargando', email: undefined })
    expect(screen.getByText('Cargando…')).toBeInTheDocument()
    expect(screen.queryByText('Contenido del panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ubicacion')).not.toBeInTheDocument()
  })

  it('sin sesión redirige al login con volver', () => {
    renderizar({ estado: 'sin-sesion', email: undefined })
    expect(screen.getByTestId('ubicacion')).toHaveTextContent(
      '/admin/ingresar?volver=/admin/productos',
    )
  })

  it('con sesión de admin muestra la ruta', () => {
    renderizar({ estado: 'admin', email: 'admin@ls.test' })
    expect(screen.getByText('Contenido del panel')).toBeInTheDocument()
  })
})
