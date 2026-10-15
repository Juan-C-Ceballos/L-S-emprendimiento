import { createBrowserRouter, type RouteObject } from 'react-router'
import { LayoutCliente } from '@/components/LayoutCliente'
import { AjustesPage } from '@/pages/AjustesPage'
import { CarritoPage } from '@/pages/CarritoPage'
import { CatalogoPage } from '@/pages/CatalogoPage'
import { ConfirmarPage } from '@/pages/ConfirmarPage'
import { IngresarPage } from '@/pages/IngresarPage'
import { NoEncontradaPage } from '@/pages/NoEncontradaPage'
import { PedidoConfirmadoPage } from '@/pages/PedidoConfirmadoPage'
import { PedidoDetallePage } from '@/pages/PedidoDetallePage'
import { PedidosPage } from '@/pages/PedidosPage'
import { ProductoFormPage } from '@/pages/ProductoFormPage'
import { ProductoPage } from '@/pages/ProductoPage'
import { ProductosPage } from '@/pages/ProductosPage'
import { ResumenPage } from '@/pages/ResumenPage'

// Mapa de rutas: docs/prototype-analysis.md §2.
export const rutas: RouteObject[] = [
  {
    element: <LayoutCliente />,
    children: [
      { path: '/', element: <CatalogoPage /> },
      { path: '/producto/:id', element: <ProductoPage /> },
      { path: '/carrito', element: <CarritoPage /> },
      { path: '/confirmar', element: <ConfirmarPage /> },
      { path: '/pedido/confirmado', element: <PedidoConfirmadoPage /> },
    ],
  },
  { path: '/admin/ingresar', element: <IngresarPage /> },
  // La guardia (RutaProtegida) y PanelLayout llegan en la etapa 2.
  {
    path: '/admin',
    children: [
      { index: true, element: <ResumenPage /> },
      { path: 'productos', element: <ProductosPage /> },
      { path: 'productos/nuevo', element: <ProductoFormPage /> },
      { path: 'productos/:id', element: <ProductoFormPage /> },
      { path: 'pedidos', element: <PedidosPage /> },
      { path: 'pedidos/:numero', element: <PedidoDetallePage /> },
      { path: 'ajustes', element: <AjustesPage /> },
    ],
  },
  { path: '*', element: <NoEncontradaPage /> },
]

export function crearRouter() {
  return createBrowserRouter(rutas)
}
