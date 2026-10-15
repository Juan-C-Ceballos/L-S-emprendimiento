// Genera los SVG de las semillas de desarrollo (D-27) a partir del componente `Ph`
// de prototype/src/placeholder.html y de los datos de seed() en prototype/src/main.html.
// Se corre una vez y los SVG se commitean: `node scripts/generar-placeholders.mjs`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const plantilla = readFileSync(join(raiz, 'prototype/src/placeholder.html'), 'utf8')
const destino = join(raiz, 'public/seed')

// Mapas copiados de main.html (tone() y metal()) y de renderVals() de placeholder.html.
const TONOS = {
  blush: '#EBDCD4',
  sage: '#DCE2D5',
  sand: '#E9E0CF',
  mist: '#DDE1E6',
  lilac: '#E3DDE6',
  shell: '#F0E7DF',
  stone: '#E4E1DB',
}
const metal = (tags) => {
  if (tags.includes('dorado')) return '#9C7426'
  if (tags.includes('plateado')) return '#737B84'
  if (tags.includes('acero')) return '#535B63'
  return '#6B665E'
}
const TRANSFORMACIONES = [
  '',
  'rotate(-14 100 125)',
  'translate(100 125) scale(1.5) translate(-100 -118)',
  'translate(100 125) rotate(10) scale(0.9) translate(-92 -122)',
]
const BRILLOS = [
  [150, 64],
  [52, 84],
  [140, 196],
  [62, 200],
]
const CLASES = {
  hoop: 'isHoop',
  stud: 'isStud',
  drop: 'isDrop',
  bracelet: 'isBracelet',
  bangle: 'isBangle',
  pendant: 'isPendant',
  pearls: 'isPearls',
  chain: 'isChain',
  ring: 'isRing',
}

// [id, tags, kind, tonos] de seed().
const PRODUCTOS = [
  [1, ['aros', 'dorado', 'acero'], 'hoop', ['sand', 'blush', 'stone']],
  [2, ['aros', 'plateado', 'perlas'], 'stud', ['mist', 'shell']],
  [3, ['aros', 'dorado'], 'drop', ['blush', 'sand']],
  [4, ['aros', 'acero'], 'stud', ['stone']],
  [5, ['pulseras', 'dorado', 'acero'], 'bracelet', ['sand', 'shell', 'blush']],
  [6, ['pulseras', 'plateado'], 'bangle', ['mist', 'lilac']],
  [7, ['pulseras', 'acero', 'dijes'], 'bracelet', ['sage']],
  [8, ['collares', 'plateado', 'dijes'], 'pendant', ['lilac', 'mist', 'stone', 'shell']],
  [9, ['collares', 'dorado', 'dijes'], 'pendant', ['shell', 'sand', 'blush']],
  [10, ['collares', 'perlas', 'dorado'], 'pearls', ['sage', 'shell']],
  [11, ['cadenas', 'plateado', 'acero'], 'chain', ['mist', 'stone']],
  [12, ['cadenas', 'dorado', 'acero'], 'chain', ['sand', 'blush', 'shell']],
  [13, ['anillos', 'dorado', 'acero'], 'ring', ['blush', 'sand']],
  [14, ['anillos', 'dorado'], 'ring', ['sage']],
]

const contenidoSvg = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')

const fondo = plantilla.match(/<svg[^>]*aria-hidden="true">.*?<\/svg>/)?.[0]
if (!fondo) throw new Error('No encontré el fondo del placeholder')

const figuras = {}
for (const [kind, clase] of Object.entries(CLASES)) {
  const bloque = plantilla.match(new RegExp(`<sc-if value="\\{\\{${clase}\\}\\}"[^>]*>\\s*(<svg[^>]*>.*?</svg>)`))
  const svg = bloque?.[1]
  if (!svg) throw new Error(`No encontré la figura ${kind}`)
  figuras[kind] = { etiqueta: svg.match(/aria-label="([^"]*)"/)?.[1] ?? 'Producto', interior: contenidoSvg(svg) }
}

const generar = ({ kind, tono, colorMetal, v }) => {
  const [sx, sy] = BRILLOS[v]
  const valores = { metal: colorMetal, tf: TRANSFORMACIONES[v], sx: String(sx), sy: String(sy) }
  const reemplazar = (texto) => texto.replace(/\{\{(\w+)\}\}/g, (_, clave) => valores[clave] ?? '')
  const figura = figuras[kind]
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 250" width="800" height="1000" role="img" aria-label="${figura.etiqueta}">`,
    `<rect width="200" height="250" fill="${tono}"/>`,
    reemplazar(contenidoSvg(fondo)),
    reemplazar(figura.interior).replace(' transform=""', ''),
    '</svg>',
    '',
  ].join('\n')
}

mkdirSync(destino, { recursive: true })
let total = 0
for (const [id, tags, kind, tonos] of PRODUCTOS) {
  tonos.forEach((tono, i) => {
    const nombre = `p${String(id).padStart(2, '0')}-${i}.svg`
    writeFileSync(join(destino, nombre), generar({ kind, tono: TONOS[tono], colorMetal: metal(tags), v: i % 4 }))
    total++
  })
}
console.log(`Listo: ${total} SVG en public/seed/`)
