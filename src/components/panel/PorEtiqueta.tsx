import { useState } from 'react'
import { Link } from 'react-router'
import { claseLink } from '@/components/estilos'
import { SelectorEtiquetasResumen } from '@/components/panel/SelectorEtiquetasResumen'
import { STOCK_BAJO } from '@/lib/constantes'
import { etiquetasAMostrar, plural } from '@/lib/resumen'
import { cn } from '@/lib/utils'
import type { StockEtiqueta } from '@/types/dominio'

const columnas = 'grid grid-cols-[minmax(0,1fr)_repeat(3,52px)] items-center gap-2 px-3.5'

type Props = {
  etiquetas: StockEtiqueta[]
  /** Después de guardar las seguidas, relee el Resumen. */
  onGuardado: () => void
}

/** Resumen > "Por etiqueta": unidades que quedan y vendidas, de las etiquetas que se siguen (etapa 11). */
export function PorEtiqueta({ etiquetas, onGuardado }: Props) {
  const [eligiendo, setEligiendo] = useState(false)
  if (etiquetas.length === 0) return null

  const seguidas = etiquetas.filter((e) => e.seguida).length
  const mostrar = etiquetasAMostrar(etiquetas)

  return (
    <section aria-labelledby="titulo-por-etiqueta" className="mb-6">
      <div className="flex items-center justify-between px-4 pt-[18px] pb-2 lg:px-8">
        <div>
          <h2 id="titulo-por-etiqueta" className="m-0 font-display text-lg font-semibold">
            Por etiqueta
          </h2>
          <p className="m-0 text-[12.5px] text-texto-suave">
            {seguidas > 0 ? plural(seguidas, 'etiqueta elegida', 'etiquetas elegidas') : 'Todas las etiquetas'}
          </p>
        </div>
        {!eligiendo && (
          <button
            type="button"
            className={`${claseLink} flex items-center`}
            onClick={() => {
              setEligiendo(true)
            }}
          >
            Elegir etiquetas
          </button>
        )}
      </div>

      {eligiendo ? (
        <SelectorEtiquetasResumen
          etiquetas={etiquetas}
          onCancelar={() => {
            setEligiendo(false)
          }}
          onGuardado={() => {
            setEligiendo(false)
            onGuardado()
          }}
        />
      ) : (
        <>
          <div className="mx-4 mb-2 overflow-hidden rounded-tarjeta border border-borde bg-white lg:mx-8">
            <div
              aria-hidden="true"
              className={cn(
                columnas,
                'border-b border-divisor py-2 text-[11px] font-semibold tracking-[0.08em] text-texto-suave uppercase',
              )}
            >
              <span>Etiqueta</span>
              <span className="text-right">Quedan</span>
              <span className="text-right">Mes</span>
              <span className="text-right">Total</span>
            </div>
            <ul className="m-0 list-none p-0">
              {mostrar.map((e) => (
                <li key={e.id} className="border-b border-divisor last:border-b-0">
                  <Link
                    to={`/admin/productos?q=${encodeURIComponent(e.nombre)}`}
                    aria-label={`${e.nombre}: quedan ${plural(e.unidades, 'unidad', 'unidades')}; vendidas ${e.vendidasMes} este mes y ${e.vendidasTotal} en total. Ver sus productos`}
                    className={cn(columnas, 'min-h-[52px] py-2 text-tinta no-underline hover:bg-fila-hover')}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[15px] font-semibold">{e.nombre}</span>
                      <span className="text-[12.5px] text-texto-suave">
                        {plural(e.piezas, 'pieza con stock', 'piezas con stock')}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'text-right text-[15px] font-bold tabular-nums',
                        e.unidades === 0 ? 'text-peligro' : e.unidades <= STOCK_BAJO && 'text-aviso',
                      )}
                    >
                      {e.unidades}
                    </span>
                    <span className="text-right text-[15px] tabular-nums">{e.vendidasMes}</span>
                    <span className="text-right text-[15px] tabular-nums">{e.vendidasTotal}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="m-0 px-4 text-[12.5px] leading-[1.45] text-texto-suave lg:px-8">
            Quedan: unidades en stock. Mes y Total: unidades vendidas. Una pieza con varias etiquetas cuenta en cada
            una.
          </p>
        </>
      )}
    </section>
  )
}
