import { cn } from '@/lib/utils'

/** "Activo: visible en el catálogo" (prototipo: `.swrow` + `.sw`). */
export function InterruptorActivo({
  activo,
  onCambiar,
}: {
  activo: boolean
  onCambiar: (activo: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-describedby="activo-ayuda"
      className="flex min-h-14 w-full items-center justify-between gap-4 py-1.5 text-left"
      onClick={() => {
        onCambiar(!activo)
      }}
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-[13px] font-bold">Activo: visible en el catálogo</span>
        <span id="activo-ayuda" className="text-[13px] leading-[1.45] text-texto-suave">
          {activo
            ? 'Los clientes lo ven en la vidriera.'
            : 'Oculto para los clientes. Los productos no se borran: se desactivan.'}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'relative h-8 w-[52px] flex-none rounded-full transition-colors',
          activo ? 'bg-wa' : 'bg-borde-fuerte',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] size-[26px] rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-[left]',
            activo ? 'left-[23px]' : 'left-[3px]',
          )}
        />
      </span>
    </button>
  )
}
