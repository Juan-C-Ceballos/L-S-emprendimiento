import type { ReactNode } from 'react'

/** Título provisorio de las pantallas que todavía no están implementadas. */
export function TituloPagina({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto max-w-[720px] px-5 py-8 lg:max-w-none lg:px-8">
      <h1 className="m-0 font-display text-[28px] leading-[1.08] font-semibold tracking-[-0.02em]">
        {children}
      </h1>
    </section>
  )
}
