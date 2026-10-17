import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'
import { ToastProvider } from '@/components/Toast'
import { CarritoProvider } from '@/lib/carrito'

/** Monta rutas del sitio público con los providers que tiene la app (toasts y carrito). */
export function renderizarRutas(rutas: RouteObject[], ruta: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] })
  render(
    <ToastProvider>
      <CarritoProvider>
        <RouterProvider router={router} />
      </CarritoProvider>
    </ToastProvider>,
  )
  return router
}
