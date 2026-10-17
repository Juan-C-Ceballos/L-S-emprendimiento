import { Button } from '@/components/ui/button'

type Props = {
  titulo: string
  texto: string
  confirmar: string
  confirmando: string
  procesando: boolean
  onConfirmar: () => void
  onVolver: () => void
}

/** Confirmación en el lugar, sin modal (prototipo: `.confirm`, `role="alertdialog"`). */
export function ConfirmacionInline({
  titulo,
  texto,
  confirmar,
  confirmando,
  procesando,
  onConfirmar,
  onVolver,
}: Props) {
  return (
    <div
      role="alertdialog"
      aria-label={titulo}
      className="rounded-alerta border border-peligro-borde-boton bg-white p-4 text-center"
    >
      <p className="m-0 text-[15px] font-bold">{titulo}</p>
      <p className="mt-1 mb-0 text-[13px] leading-[1.45] text-texto-suave">{texto}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Button variant="ghost" size="sm" disabled={procesando} onClick={onVolver}>
          No, volver
        </Button>
        <Button variant="dangerSolid" size="sm" disabled={procesando} onClick={onConfirmar}>
          {procesando ? confirmando : confirmar}
        </Button>
      </div>
    </div>
  )
}
