import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Estilo del prototipo (.in.ta).
        "flex min-h-24 w-full resize-y rounded-input border border-borde-fuerte bg-white px-3.5 py-3 text-base leading-[1.45] transition-colors placeholder:text-texto-suave focus:border-tinta focus:shadow-foco disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-peligro aria-invalid:bg-fondo-error",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
