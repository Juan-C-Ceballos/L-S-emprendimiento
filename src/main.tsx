import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import './index.css'
import { ToastProvider } from '@/components/Toast'
import { resultadoEnv } from '@/lib/env'
import { ConfigFaltantePage } from '@/pages/ConfigFaltantePage'
import { crearRouter } from '@/router'

const raiz = document.getElementById('root')
if (raiz === null) throw new Error('No se encontró el elemento #root en index.html.')

createRoot(raiz).render(
  <StrictMode>
    {resultadoEnv.ok ? (
      <ToastProvider>
        <RouterProvider router={crearRouter()} />
      </ToastProvider>
    ) : (
      <ConfigFaltantePage problemas={resultadoEnv.problemas} />
    )}
  </StrictMode>,
)
