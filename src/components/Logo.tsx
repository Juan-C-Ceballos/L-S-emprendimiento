import { cn } from '@/lib/utils'

type Props = {
  /** `header`: 27 px (32 px en escritorio). `grande`: 52 px, para el login. */
  tamano?: 'header' | 'grande'
  className?: string
}

/** Marca "L&S" con el `&` en vino (prototipo: `.mark`, `.amp`). */
export function Logo({ tamano = 'header', className }: Props) {
  return (
    <span
      className={cn(
        'font-display leading-none font-semibold tracking-[-0.03em]',
        tamano === 'header' ? 'text-[27px] lg:text-[32px]' : 'text-[52px]',
        className,
      )}
    >
      L<span className="mx-px font-normal text-vino">&amp;</span>S
    </span>
  )
}
