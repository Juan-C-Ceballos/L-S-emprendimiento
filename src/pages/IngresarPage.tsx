import { useState, type SubmitEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { Logo } from '@/components/Logo'
import { PantallaCargando } from '@/components/PantallaCargando'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSesion } from '@/lib/useSesion'
import { ingresar } from '@/services/auth'
import { ErrorServicio, MENSAJE_GENERICO } from '@/services/errores'

const esquemaIngreso = z.object({
  email: z.email({ error: 'Escribí un email válido.' }),
  contrasena: z.string().min(1, { error: 'Escribí tu contraseña.' }),
})

type Campo = keyof z.infer<typeof esquemaIngreso>
type Errores = Partial<Record<Campo, string>>

/** Solo vuelve a rutas del panel (evita redirigir a otro sitio con `?volver=//…`). */
function destinoSeguro(volver: string | null): string {
  if (volver === null || volver.startsWith('/admin/ingresar')) return '/admin'
  return /^\/admin(?:[/?#]|$)/.test(volver) ? volver : '/admin'
}

export function IngresarPage() {
  const sesion = useSesion()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const destino = destinoSeguro(params.get('volver'))

  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [errores, setErrores] = useState<Errores>({})
  const [errorServicio, setErrorServicio] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (sesion.estado === 'cargando') return <PantallaCargando />
  if (sesion.estado === 'admin' && !enviando) return <Navigate to={destino} replace />

  async function alEnviar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    const resultado = esquemaIngreso.safeParse({ email: email.trim(), contrasena })
    if (!resultado.success) {
      const nuevos: Errores = {}
      for (const problema of resultado.error.issues) {
        const campo = problema.path[0]
        if ((campo === 'email' || campo === 'contrasena') && nuevos[campo] === undefined) {
          nuevos[campo] = problema.message
        }
      }
      setErrores(nuevos)
      return
    }
    setErrores({})
    setErrorServicio(null)
    setEnviando(true)
    try {
      await ingresar(resultado.data.email, resultado.data.contrasena)
      void navigate(destino, { replace: true })
    } catch (e) {
      setEnviando(false)
      setErrorServicio(e instanceof ErrorServicio ? e.message : MENSAJE_GENERICO)
    }
  }

  return (
    <main className="mx-auto flex max-w-[440px] flex-col px-6 pt-14 pb-8 lg:pt-20">
      <Logo tamano="grande" />
      <h1 className="m-0 mt-3.5 text-[11px] font-semibold tracking-[0.16em] text-texto-suave uppercase">
        Panel de la tienda
      </h1>
      <p className="mt-1.5 text-[15px] leading-[1.55] text-texto-medio">
        Ingresá para ver pedidos y cargar productos.
      </p>
      <form noValidate className="mt-7" onSubmit={(e) => void alEnviar(e)}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="l-email">Email</Label>
          <Input
            id="l-email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            aria-invalid={errores.email !== undefined}
            aria-describedby={errores.email !== undefined ? 'l-email-error' : undefined}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrorServicio(null)
            }}
          />
          {errores.email !== undefined && (
            <p id="l-email-error" className="text-[13px] font-semibold text-peligro">
              {errores.email}
            </p>
          )}
        </div>
        <div className="mt-[18px] flex flex-col gap-1.5">
          <Label htmlFor="l-pass">Contraseña</Label>
          <Input
            id="l-pass"
            type="password"
            autoComplete="current-password"
            placeholder="Tu contraseña"
            value={contrasena}
            aria-invalid={errores.contrasena !== undefined}
            aria-describedby={errores.contrasena !== undefined ? 'l-pass-error' : undefined}
            onChange={(e) => {
              setContrasena(e.target.value)
              setErrorServicio(null)
            }}
          />
          {errores.contrasena !== undefined && (
            <p id="l-pass-error" className="text-[13px] font-semibold text-peligro">
              {errores.contrasena}
            </p>
          )}
        </div>
        {errorServicio !== null && (
          <p role="alert" className="mt-3 text-[13px] font-semibold text-peligro">
            {errorServicio}
          </p>
        )}
        <Button type="submit" className="mt-6 w-full" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </main>
  )
}
