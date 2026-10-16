import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { rutas } from './router'
import { ToastProvider } from '@/components/Toast'
import type { SesionAdmin } from '@/types/dominio'

const auth = vi.hoisted(() => ({ sesion: null as SesionAdmin | null }))

vi.mock('@/services/auth', () => ({
  escucharSesion: (cb: (sesion: SesionAdmin | null) => void) => {
    cb(auth.sesion)
    return () => undefined
  },
  ingresar: vi.fn(),
  salir: vi.fn(),
}))

function renderizarEn(ruta: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] })
  render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  )
  return router
}

beforeEach(() => {
  auth.sesion = { email: 'admin@ls.test' }
})

describe('router', () => {
  it('en / muestra el header con el logo y el catálogo', () => {
    renderizarEn('/')
    expect(screen.getByRole('link', { name: 'L&S, ir al catálogo' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Carrito vacío' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Accesorios para usar todos los días.',
    )
  })

  it.each([
    ['/producto/abc', 'Producto'],
    ['/carrito', 'Tu carrito'],
    ['/confirmar', 'Confirmar pedido'],
    ['/pedido/confirmado', 'Pedido confirmado'],
    ['/admin', 'Resumen'],
    ['/admin/productos', 'Productos'],
    ['/admin/productos/nuevo', 'Nuevo producto'],
    ['/admin/productos/abc', 'Editar producto'],
    ['/admin/pedidos', 'Pedidos'],
    ['/admin/pedidos/7', 'Pedido #0007'],
    ['/admin/ajustes', 'Ajustes'],
  ])('%s muestra «%s»', (ruta, titulo) => {
    renderizarEn(ruta)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(titulo)
  })

  it('sin sesión, una ruta del panel lleva al login con volver', () => {
    auth.sesion = null
    const router = renderizarEn('/admin/productos')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Panel de la tienda')
    expect(router.state.location.pathname + router.state.location.search).toBe(
      '/admin/ingresar?volver=/admin/productos',
    )
  })

  it('el Resumen tiene Salir y las cuatro secciones del panel', () => {
    renderizarEn('/admin')
    expect(screen.getByRole('button', { name: 'Salir del panel' })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Secciones del panel' })
    expect(nav).toHaveClass('flex')
    for (const seccion of ['Resumen', 'Productos', 'Pedidos', 'Ajustes']) {
      expect(screen.getByRole('link', { name: seccion })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'Resumen' })).toHaveAttribute('aria-current', 'page')
  })

  it('en el formulario hay Volver y las tabs se ocultan en móvil', () => {
    renderizarEn('/admin/productos/nuevo')
    expect(screen.getByRole('link', { name: 'Volver' })).toHaveAttribute('href', '/admin/productos')
    expect(screen.getByRole('navigation', { name: 'Secciones del panel' })).toHaveClass('hidden')
  })

  it('una ruta inexistente muestra la página 404', () => {
    renderizarEn('/ruta-inexistente')
    expect(screen.getByRole('heading', { name: 'No encontramos esta página' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al catálogo' })).toHaveAttribute('href', '/')
  })
})
