import { Link } from 'react-router'

export function NoEncontradaPage() {
  return (
    <section className="mx-auto flex min-h-dvh max-w-[420px] flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="m-0 font-display text-[28px] leading-[1.08] font-semibold tracking-[-0.02em]">
        No encontramos esta página
      </h1>
      <p className="m-0 text-sm text-texto-suave">
        Puede que el link esté mal escrito o que la página ya no exista.
      </p>
      <Link
        to="/"
        className="flex min-h-11 items-center px-1 text-sm font-semibold text-vino underline underline-offset-[3px] hover:text-vino-hover"
      >
        Volver al catálogo
      </Link>
    </section>
  )
}
