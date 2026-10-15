import { Logo } from '@/components/Logo'

/** Se muestra si faltan variables de entorno, en lugar de una pantalla en blanco. */
export function ConfigFaltantePage({ problemas }: { problemas: string[] }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center gap-4 px-5">
      <Logo />
      <h1 className="m-0 font-display text-[28px] leading-[1.08] font-semibold tracking-[-0.02em]">
        Falta configurar el sitio
      </h1>
      <p className="m-0 text-texto-medio">
        Copiá <code>.env.example</code> a <code>.env.local</code>, completá los valores y reiniciá el
        servidor.
      </p>
      <ul className="m-0 rounded-alerta border border-peligro-borde bg-peligro-fondo py-4 pr-4 pl-8 text-sm text-peligro-texto">
        {problemas.map((problema) => (
          <li key={problema}>{problema}</li>
        ))}
      </ul>
    </main>
  )
}
