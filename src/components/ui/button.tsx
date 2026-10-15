import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// Variantes ajustadas al prototipo (.btn, .ghost, .wa, .danger, .danger-solid, .sm).
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent font-bold whitespace-nowrap no-underline transition-colors select-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-deshabilitado disabled:text-texto-suave [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-tinta text-white hover:bg-tinta-hover",
        ghost:
          "border-borde-fuerte bg-transparent text-tinta hover:bg-rosa-suave",
        wa: "bg-wa text-white hover:bg-wa-hover",
        danger:
          "border-peligro-borde-boton bg-transparent text-peligro hover:bg-peligro-fondo",
        dangerSolid: "bg-peligro text-white hover:bg-peligro-hover",
      },
      size: {
        default: "min-h-[52px] w-full flex-1 px-[22px] text-[15px]",
        sm: "min-h-11 w-auto flex-none px-[18px] text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
