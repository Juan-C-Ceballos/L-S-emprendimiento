import { Outlet, ScrollRestoration } from 'react-router'
import { HeaderCliente } from '@/components/HeaderCliente'

export function LayoutCliente() {
  return (
    <div className="min-h-dvh">
      <HeaderCliente />
      <main>
        <Outlet />
      </main>
      {/* Arriba al abrir una pantalla nueva; al volver, donde estaba (por ejemplo, en la grilla). */}
      <ScrollRestoration />
    </div>
  )
}
