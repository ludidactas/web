'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { DesafioDojoGo, type DesafioDojoGoTheme } from './desafio-dojo-go'
import { useDesafioGo } from './use-desafio-go'
import type { Desafio } from '../tipos'

/**
 * Tarjeta de un desafío: combina `useDesafioGo` (estado) con `DesafioDojoGo` (tablero) y agrega el
 * resto de la UI de la tarjeta — título, instrucción, banner de feedback, explicación, botones.
 */
export interface TarjetaDesafioGoProps {
  desafio: Desafio
  theme?: Partial<DesafioDojoGoTheme>
  className?: string
  /** Se llama una sola vez, la primera vez que el estudiante responde bien. Útil para trackear progreso. */
  onSolved?: (desafioId: string) => void
}

export function TarjetaDesafioGo({ desafio, theme, className, onSolved }: TarjetaDesafioGoProps) {
  const {
    piedras,
    jugadaJugador,
    estado,
    cantidadCapturas,
    ayudaVisible,
    explicacionVisible,
    jugadasCorrectasReveladas,
    textoActivo,
    marcasVisibles,
    puntoDeAyuda,
    respondido,
    jugar,
    reiniciar,
    mostrarAyuda,
    mostrarExplicacion,
  } = useDesafioGo(desafio)

  // Dispara onSolved exactamente una vez, en el render donde estado pasa a "correcto".
  const notifiedRef = useRef(false)
  useEffect(() => {
    if (estado === 'correcto' && !notifiedRef.current) {
      notifiedRef.current = true
      onSolved?.(desafio.id)
    }
    if (estado === 'inactivo') notifiedRef.current = false // permite volver a notificar tras un reset
  }, [estado, desafio.id, onSolved])

  const isPositive = estado === 'correcto' || estado === 'jugando'

  return (
    <div className={className ?? 'bg-white p-6 rounded-xl'}>
      <div className="flex items-baseline gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{desafio.titulo}</h3>
          {desafio.etiqueta && (
            <span className="inline-block text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1">
              {desafio.etiqueta}
            </span>
          )}
        </div>
      </div>

      <DesafioDojoGo
        boardSize={desafio.tamañoTablero}
        stones={piedras}
        ghost={ayudaVisible ? puntoDeAyuda : null}
        correctMoveMarkers={jugadasCorrectasReveladas}
        marks={marcasVisibles}
        playedPoint={jugadaJugador}
        nextMoveColor={desafio.tipo === 'exploracion' ? undefined : desafio.turno}
        onPointClick={jugar}
        disabled={respondido}
        theme={theme}
        aria-label={desafio.titulo}
      />

      {desafio.instruccion && <p className="text-sm text-slate-500 mt-2 text-center">{desafio.instruccion}</p>}

      {estado !== 'inactivo' && (
        <div
          className={cn(
            'mt-4 px-4 py-3 text-sm leading-relaxed rounded-lg border-l-4',
            isPositive ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-red-500 bg-red-50 text-red-700'
          )}
          role="status"
        >
          {textoActivo ??
            (estado === 'correcto'
              ? desafio.mensajeExito ?? 'Correcto! Bien jugado.'
              : desafio.mensajeError ?? 'Hmmm, no. La jugada correcta está marcada en verde.')}
          {cantidadCapturas > 0 && ` Capturaste ${cantidadCapturas} piedra${cantidadCapturas > 1 ? 's' : ''}.`}
        </div>
      )}

      {explicacionVisible && desafio.explicacion && (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm leading-7">
          <strong>Explicación: </strong>
          {desafio.explicacion}
        </div>
      )}

      <div className="w-full mt-6 flex gap-3 flex-wrap items-center justify-between">
        <button
          type="button"
          onClick={reiniciar}
          className="text-sm px-4 py-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
        >
          Reiniciar
        </button>
        {desafio.tipo !== 'exploracion' && (
          <button
            type="button"
            onClick={mostrarAyuda}
            className="text-sm px-4 py-2 rounded-full border border-ld-violeta text-ld-violeta-oscuro hover:bg-ld-violeta/10 transition"
          >
            Pista
          </button>
        )}
        {desafio.explicacion && (
          <button
            type="button"
            onClick={mostrarExplicacion}
            className="text-sm px-4 py-2 rounded-full bg-orange-400 text-white hover:bg-orange-500 transition"
          >
            Explicación
          </button>
        )}
      </div>
    </div>
  )
}
