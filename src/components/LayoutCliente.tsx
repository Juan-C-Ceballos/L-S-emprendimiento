import { Outlet } from 'react-router'
import { HeaderCliente } from '@/components/HeaderCliente'

export function LayoutCliente() {
  return (
    <div className="min-h-dvh">
      <HeaderCliente />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
