const ZONA_HORARIA = 'America/Argentina/Buenos_Aires' // D-23

/** `14500` → `$14.500` (pesos enteros, sin centavos). */
export function formatearPrecio(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

/** `7` → `#0007`; `12345` → `#12345`. */
export function formatearNumeroPedido(n: number): string {
  return '#' + String(n).padStart(4, '0')
}

const formatoFechaCorta = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA_HORARIA,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** ISO → `15 oct, 09:12` en hora de Buenos Aires. */
export function formatearFechaCorta(iso: string): string {
  const partes = formatoFechaCorta.formatToParts(new Date(iso))
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)?.value ?? ''
  const mes = valor('month').replace('.', '').toLowerCase()
  return `${valor('day')} ${mes}, ${valor('hour')}:${valor('minute')}`
}

/** Para búsquedas: minúsculas, sin tildes ni diacríticos, sin espacios a los costados. */
export function normalizarTexto(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/** Para etiquetas: sin espacios a los costados, minúsculas, espacios múltiples → uno. */
export function normalizarEtiqueta(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}
