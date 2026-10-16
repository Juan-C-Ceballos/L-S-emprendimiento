import { createBrowserRouter, Outlet, type RouteObject } from 'react-router'
import { LayoutCliente } from '@/components/LayoutCliente'
import { PanelLayout } from '@/components/panel/PanelLayout'
import type { RutaPanel } from '@/components/panel/rutasPanel'
import { RutaProtegida } from '@/components/RutaProtegida'
import { formatearNumeroPedido } from '@/lib/formato'
import { SesionProvider } from '@/lib/sesion'
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

function tituloPedido(numero: string | undefined): string {
  const n = Number(numero)
  return Number.isInteger(n) && n > 0 ? `Pedido ${formatearNumeroPedido(n)}` : 'Pedido'
}

// `handle` de cada ruta del panel: título, tabs en móvil, "Volver" y acción del header.
const resumen: RutaPanel = { titulo: () => 'Resumen', tabs: true, accion: 'salir' }
const productos: RutaPanel = { titulo: () => 'Productos', tabs: true, accion: 'nuevo-producto' }
const productoNuevo: RutaPanel = { titulo: () => 'Nuevo producto', volver: '/admin/productos' }
const productoEditar: RutaPanel = { titulo: () => 'Editar producto', volver: '/admin/productos' }
const pedidos: RutaPanel = { titulo: () => 'Pedidos', tabs: true }
const pedidoDetalle: RutaPanel = {
  titulo: (params) => tituloPedido(params.numero),
  volver: '/admin/pedidos',
}
const ajustes: RutaPanel = { titulo: () => 'Ajustes', tabs: true }

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
  {
    // La sesión solo se escucha en el panel: el catálogo no la necesita.
    element: (
      <SesionProvider>
        <Outlet />
      </SesionProvider>
    ),
    children: [
      { path: '/admin/ingresar', element: <IngresarPage /> },
      {
        path: '/admin',
        element: <RutaProtegida />,
        children: [
          {
            element: <PanelLayout />,
            children: [
              { index: true, element: <ResumenPage />, handle: resumen },
              { path: 'productos', element: <ProductosPage />, handle: productos },
              { path: 'productos/nuevo', element: <ProductoFormPage />, handle: productoNuevo },
              { path: 'productos/:id', element: <ProductoFormPage />, handle: productoEditar },
              { path: 'pedidos', element: <PedidosPage />, handle: pedidos },
              { path: 'pedidos/:numero', element: <PedidoDetallePage />, handle: pedidoDetalle },
              { path: 'ajustes', element: <AjustesPage />, handle: ajustes },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NoEncontradaPage /> },
]

export function crearRouter() {
  return createBrowserRouter(rutas)
}
