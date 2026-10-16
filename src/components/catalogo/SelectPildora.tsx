type Opcion<T extends string> = { valor: T; texto: string }

type Props<T extends string> = {
  ariaLabel: string
  valor: T
  opciones: readonly Opcion<T>[]
  onCambiar: (valor: T) => void
}

/** Select nativo redondeado del catálogo (prototipo: `.selw` + `.sel`). */
export function SelectPildora<T extends string>({ ariaLabel, valor, opciones, onCambiar }: Props<T>) {
  return (
    <span className="relative inline-flex items-center">
      <select
        aria-label={ariaLabel}
        value={valor}
        className="min-h-10 cursor-pointer appearance-none rounded-full border border-borde-chip bg-white pr-[38px] pl-[15px] text-[13px] font-semibold text-tinta transition-colors hover:border-tinta"
        onChange={(e) => {
          const elegida = opciones.find((o) => o.valor === e.target.value)
          if (elegida !== undefined) onCambiar(elegida.valor)
        }}
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
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
