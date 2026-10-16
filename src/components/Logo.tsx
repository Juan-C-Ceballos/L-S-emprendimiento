import { cn } from '@/lib/utils'

/**
 * Marca "L&S" en texto con el `&` en bronce (prototipo: `.mark`, `.amp`), 27 px (32 px en
 * escritorio). El logo con marco (`public/logo.webp`) va donde hay lugar, como el login (D-33).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-display text-[27px] leading-none font-semibold tracking-[-0.03em] lg:text-[32px]',
        className,
      )}
    >
      L<span className="mx-px font-normal text-bronce">&amp;</span>S
    </span>
  )
}
