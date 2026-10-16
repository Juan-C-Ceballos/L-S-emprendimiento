import { useState } from 'react'
import { useNavigate } from 'react-router'
import { claseBotonIcono } from '@/components/estilos'
import { useToast } from '@/components/useToast'
import { salir } from '@/services/auth'
import { ErrorServicio, MENSAJE_GENERICO } from '@/services/errores'

/** Ícono de puerta del header del Resumen (prototipo: "Salir del panel"). */
export function BotonSalir() {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()
  const [saliendo, setSaliendo] = useState(false)

  async function alTocar() {
    setSaliendo(true)
    try {
      await salir()
      void navigate('/admin/ingresar', { replace: true })
    } catch (e) {
      setSaliendo(false)
      mostrarToast(e instanceof ErrorServicio ? e.message : MENSAJE_GENERICO)
    }
  }

  return (
    <button
      type="button"
      aria-label="Salir del panel"
      className={claseBotonIcono}
      disabled={saliendo}
      onClick={() => void alTocar()}
    >
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
        <path d="M10 16l-4-4 4-4" />
        <path d="M6 12h10" />
      </svg>
    </button>
  )
}
