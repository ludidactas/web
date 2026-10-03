'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { DesafioDojoGo, type DesafioDojoGoTheme } from './desafio-dojo-go'
import { useDesafioGo } from './use-desafio-go'
import type { Desafio } from '../tipos'
import { Icon } from '@iconify/react/dist/iconify.js'

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

/** Tipos donde un click no pone una piedra del `turno`, así que el hover no previsualiza ninguna. */
const SIN_PREVIEW: Desafio['tipo'][] = ['exploracion', 'opciones', 'retirar']

export function TarjetaDesafioGo({ desafio, theme, className, onSolved }: TarjetaDesafioGoProps) {
  const {
    piedras,
    piedrasMuertas,
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
    opcionElegida,
    reiniciar,
    mostrarAyuda,
    mostrarExplicacion,
    elegirOpcion,
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
  // Cualquier jugada saca al desafío de "inactivo", y reiniciar lo devuelve ahí.
  const seJugo = estado !== 'inactivo'

  return (
    <div className={className ?? 'bg-white p-6 rounded-xl text-center'}>
      <div className="flex items-center justify-center gap-4 mb-4">
        <div>
          <h3 className="text-2xl font-semibold text-ld-violeta-oscuro">{desafio.titulo}</h3>
          {desafio.etiqueta && (
            <span className="inline-block text-xs text-ld-violeta-oscuro bg-ld-violeta-oscuro/10 px-2 py-0.5 rounded-full mt-1">
              {desafio.etiqueta}
            </span>
          )}
        </div>
      </div>

      <DesafioDojoGo
        boardSize={desafio.tamañoTablero}
        stones={piedras}
        ghost={ayudaVisible ? puntoDeAyuda : null}
        deadStones={piedrasMuertas}
        correctMoveMarkers={jugadasCorrectasReveladas}
        marks={marcasVisibles}
        playedPoint={jugadaJugador}
        nextMoveColor={SIN_PREVIEW.includes(desafio.tipo) ? undefined : desafio.turno}
        onPointClick={desafio.tipo === 'opciones' ? undefined : jugar}
        esSeleccionable={desafio.tipo === 'retirar' ? (r, c) =>
            piedras.some((p) => p.r === r && p.c === c) && !piedrasMuertas.some((p) => p.r === r && p.c === c) : undefined}
        disabled={respondido}
        theme={theme}
        aria-label={desafio.titulo}
      />

      {desafio.instruccion && <p className="text-sm text-slate-500 mt-2 text-center">{desafio.instruccion}</p>}

      {desafio.tipo === 'opciones' && (
        <div className="mt-4 flex gap-3 flex-wrap justify-center">
          {desafio.opciones?.map((opcion, i) => {
            const elegida = opcionElegida === i
            return (
              <button
                key={i}
                type="button"
                onClick={() => elegirOpcion(i)}
                disabled={respondido}
                className={cn(
                  'min-w-14 px-5 py-2 rounded-full border text-base font-semibold transition',
                  elegida && opcion.correcta && 'border-emerald-600 bg-emerald-50 text-emerald-800',
                  elegida && !opcion.correcta && 'border-red-500 bg-red-50 text-red-700',
                  !elegida && !respondido && 'border-ld-violeta text-ld-violeta-oscuro hover:bg-ld-violeta/10',
                  !elegida && respondido && 'border-slate-300 text-slate-400'
                )}
              >
                {opcion.texto}
              </button>
            )
          })}
        </div>
      )}

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
          disabled={!seJugo}
          className={cn(
            'flex gap-1 items-center text-sm px-4 py-2 rounded-full border transition',
            seJugo
              ? 'border-emerald-500 text-emerald-700 hover:bg-emerald-50'
              : 'border-slate-300 text-slate-600 opacity-40 cursor-not-allowed'
          )}
        >
          Reiniciar
          <Icon className='' icon={'iconamoon:restart-bold'} />

        </button>
        {puntoDeAyuda && (
          <button
            type="button"
            onClick={mostrarAyuda}
            className="flex gap-1 items-center text-sm px-4 py-2 rounded-full border border-ld-violeta text-ld-violeta-oscuro hover:bg-ld-violeta/10 transition"
          >
            Pista
            <Icon className='' icon={'fluent:search-12-filled'} />
          </button>
        )}
        {desafio.explicacion && (
          <button
            type="button"
            onClick={mostrarExplicacion}
            className="flex gap-1 items-center text-sm px-4 py-2 rounded-full bg-ld-amarillo-oscuro text-white hover:bg-orange-500 transition"
          >
            Explicación
            <Icon className='' icon={'fluent:text-description-20-filled'} />

          </button>
        )}
      </div>
    </div>
  )
}
