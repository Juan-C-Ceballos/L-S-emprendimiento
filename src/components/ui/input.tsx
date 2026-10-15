import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Estilo del prototipo (.in, .in.err): 50 px, radio 10 px, 16 px (evita el zoom de iOS).
        "min-h-[50px] w-full min-w-0 rounded-input border border-borde-fuerte bg-white px-3.5 text-base transition-colors placeholder:text-texto-suave focus:border-tinta focus:shadow-foco disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-peligro aria-invalid:bg-fondo-error",
        className
      )}
      {...props}
    />
  )
}

export { Input }
