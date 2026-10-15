import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { rutas } from './router'

function renderizarEn(ruta: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] })
  render(<RouterProvider router={router} />)
}

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
    ['/admin/ingresar', 'Panel de la tienda'],
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

  it('una ruta inexistente muestra la página 404', () => {
    renderizarEn('/ruta-inexistente')
    expect(screen.getByRole('heading', { name: 'No encontramos esta página' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al catálogo' })).toHaveAttribute('href', '/')
  })
})
