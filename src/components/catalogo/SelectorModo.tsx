import { SelectPildora } from '@/components/catalogo/SelectPildora'
import type { ModoEtiquetas } from '@/lib/filtros'

const OPCIONES = [
  { valor: 'todas', texto: 'Que tenga todas' },
  { valor: 'alguna', texto: 'Que tenga alguna' },
] as const

type Props = {
  modo: ModoEtiquetas
  onCambiar: (modo: ModoEtiquetas) => void
}

/** "Que tenga todas / Que tenga alguna" (prototipo: `.selw` + `.sel`). */
export function SelectorModo({ modo, onCambiar }: Props) {
  return (
    <SelectPildora ariaLabel="Cómo combinar las etiquetas" valor={modo} opciones={OPCIONES} onCambiar={onCambiar} />
  )
}
