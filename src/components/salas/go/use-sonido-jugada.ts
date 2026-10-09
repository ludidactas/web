import { useEffect, useRef } from 'react'
import { NEGRO, rival } from '@/lib/go/motor'
import { sonarJugada } from '@/lib/go/sonido-jugada'
import { Partida } from '@/wss/validators/go'

/**
 * Suena cada vez que el contrincante juega (o que entra una piedra en la partida que se observa). Las
 * jugadas de `userId` no suenan acá: suenan al colocar la piedra en el tablero, antes de confirmarla.
 * Se detecta por el crecimiento del historial de la misma partida, así que la respuesta del comando y
 * el broadcast (mismo estado) suenan una sola vez; cargar o cambiar de partida no suena.
 */
export function useSonidoJugada(partida: Partida | null, userId: string) {
  const previa = useRef<{ id: string; jugadas: number } | null>(null)

  useEffect(() => {
    if (!partida) {
      previa.current = null
      return
    }

    const jugadas = partida.historial.length
    if (previa.current?.id === partida.id && jugadas > previa.current.jugadas) {
      // Tras jugar, el turno pasa al rival: quien movió es el color contrario al del turno.
      const mover = rival(partida.turno) === NEGRO ? partida.negro : partida.blanco
      if (mover.userId !== userId) sonarJugada()
    }
    previa.current = { id: partida.id, jugadas }
  }, [partida])
}
