/** Contenido provisorio de las secciones del panel que llegan en etapas siguientes. */
export function SeccionPendiente({ etapa }: { etapa: number }) {
  return (
    <p className="mx-auto max-w-[760px] px-4 py-8 text-center text-sm text-texto-suave lg:px-8">
      Esta sección se completa en la etapa {etapa}.
    </p>
  )
}
