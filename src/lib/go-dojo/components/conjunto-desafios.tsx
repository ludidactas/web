'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { TarjetaDesafioGo } from './tarjeta-desafio-go'
import type { DesafioDojoGoTheme } from './desafio-dojo-go'
import type { Desafio } from '../tipos'

export interface ConjuntoDesafiosProps {
  desafios: Desafio[]
  theme?: Partial<DesafioDojoGoTheme>
  /** Muestra los pills de filtro por etiqueta arriba del índice. Default true si hay más de una etiqueta. */
  showFilters?: boolean
  className?: string
}

/**
 * Guía lineal de desafíos: un índice (por título, con su progreso) más el desafío actual, uno por
 * vez, con navegación anterior/siguiente — en vez de mostrarlos todos juntos en una grilla.
 */
export function ConjuntoDesafios({ desafios, theme, showFilters, className }: ConjuntoDesafiosProps) {
  const [filtro, setFiltro] = useState<string>('todos')
  const [indice, setIndice] = useState(0)
  const [resueltos, setResueltos] = useState<Set<string>>(new Set())

  const etiquetas = useMemo(() => [...new Set(desafios.map((d) => d.etiqueta))], [desafios])
  const mostrarFiltros = showFilters ?? etiquetas.length > 1

  const visibles = useMemo(
    () => desafios.filter((d) => filtro === 'todos' || d.etiqueta === filtro),
    [desafios, filtro]
  )

  // Al cambiar de filtro, el índice anterior puede apuntar a un desafío que ya no está visible.
  const cambiarFiltro = (etiqueta: string) => {
    setFiltro(etiqueta)
    setIndice(0)
  }

  const indiceActivo = Math.min(indice, Math.max(visibles.length - 1, 0))
  const actual = visibles[indiceActivo]
  const irA = (i: number) => setIndice(Math.min(Math.max(i, 0), visibles.length - 1))

  const porcentajeProgreso = desafios.length ? Math.round((resueltos.size / desafios.length) * 100) : 0

  const handleResuelto = (id: string) => setResueltos((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))

  return (
    <div className={className}>
      <div className="text-xs text-slate-500 mb-2">Progreso</div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-8">
        <div
          className={cn(
            'h-full transition-all duration-300',
            porcentajeProgreso < 100 ? 'bg-indigo-500' : 'bg-emerald-500'
          )}
          style={{ width: `${porcentajeProgreso}%` }}
        />
      </div>

      {mostrarFiltros && (
        <div className="flex gap-2 flex-wrap justify-center mb-8">
          {['todos', ...etiquetas].map((etiqueta) => (
            <button
              key={etiqueta}
              type="button"
              onClick={() => cambiarFiltro(etiqueta)}
              className={cn(
                'text-sm px-4 py-1.5 rounded-full transition',
                filtro === etiqueta
                  ? 'bg-ld-violeta text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {etiqueta === 'todos' ? 'Todos' : etiqueta.replace('-', ' ')}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start">
        <nav
          className={cn(
            'order-2 md:order-1 flex flex-col gap-2 w-full md:w-56 md:shrink-0',
            'overflow-x-auto md:overflow-x-visible pb-2 md:pb-0',
            'max-w-[30rem] md:max-w-none md:max-h-[30rem] md:overflow-y-auto'
          )}
        >
          {visibles.map((desafio, i) => {
            const esActual = i === indiceActivo
            const resuelto = resueltos.has(desafio.id)
            return (
              <button
                key={desafio.id}
                type="button"
                onClick={() => setIndice(i)}
                className={cn(
                  'flex items-center gap-2 shrink-0 md:shrink text-left px-3 py-2 rounded-xl border text-sm transition whitespace-nowrap md:whitespace-normal bg-white',
                  esActual
                    ? 'border-ld-violeta text-ld-violeta-oscuro font-semibold'
                    : 'text-slate-600 border-slate-200 hover:border-slate-300'
                )}
              >
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-5 h-5 rounded-full text-[0.65rem] shrink-0',
                    resuelto
                      ? 'bg-emerald-500 text-white'
                      : esActual
                      ? 'bg-ld-violeta text-white'
                      : 'bg-slate-200 text-slate-600'
                  )}
                >
                  {resuelto ? '✓' : i + 1}
                </span>
                <span>{desafio.titulo}</span>
              </button>
            )
          })}
        </nav>

        <div className="order-1 md:order-2 flex-1 w-full flex flex-col items-center">
          <div className="w-full max-w-md">
            {actual ? (
              <>
                <TarjetaDesafioGo key={actual.id} desafio={actual} theme={theme} onSolved={handleResuelto} />

                <div className="flex justify-between items-center mt-6">
                  <button
                    type="button"
                    onClick={() => irA(indiceActivo - 1)}
                    disabled={indiceActivo === 0}
                    className="text-sm px-4 py-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 transition disabled:opacity-30 disabled:pointer-events-none"
                  >
                    ← Anterior
                  </button>

                  {/* Centro */}
                  <span className="text-xs text-slate-500">
                    {indiceActivo + 1} / {visibles.length}
                  </span>

                  {/* Derecha */}
                  {indiceActivo < visibles.length - 1 && (
                    <button
                      type="button"
                      onClick={() => irA(indiceActivo + 1)}
                      className="text-sm px-4 py-2 rounded-full bg-ld-violeta text-white hover:scale-105 transition disabled:opacity-30 disabled:pointer-events-none"
                    >
                      Siguiente →
                    </button>
                  )}
                  {indiceActivo >= visibles.length - 1 && <div className="w-32" />}
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-sm text-center py-12">No hay desafíos en esta categoría.</p>
            )}
          </div>
        </div>

        {/* Espaciador fantasma del mismo ancho que el índice, para que el área del desafío quede
            centrada respecto a todo el ancho disponible y no solo al espacio que le queda al lado. */}
        <div aria-hidden className="order-3 hidden md:block md:w-56 md:shrink-0" />
      </div>
    </div>
  )
}
