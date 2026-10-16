import type { ModoEtiquetas } from '@/lib/filtros'

type Props = {
  modo: ModoEtiquetas
  onCambiar: (modo: ModoEtiquetas) => void
}

/** Select nativo "Que tenga todas / Que tenga alguna" (prototipo: `.selw` + `.sel`). */
export function SelectorModo({ modo, onCambiar }: Props) {
  return (
    <span className="relative inline-flex items-center">
      <select
        aria-label="Cómo combinar las etiquetas"
        value={modo}
        className="min-h-10 cursor-pointer appearance-none rounded-full border border-borde-chip bg-white pr-[38px] pl-[15px] text-[13px] font-semibold text-tinta transition-colors hover:border-tinta"
        onChange={(e) => {
          onCambiar(e.target.value === 'alguna' ? 'alguna' : 'todas')
        }}
      >
        <option value="todas">Que tenga todas</option>
        <option value="alguna">Que tenga alguna</option>
      </select>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="pointer-events-none absolute right-[13px]"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  )
}
