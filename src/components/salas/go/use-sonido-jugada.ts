import { useEffect, useRef } from 'react'
import { sonarJugada } from '@/lib/go/sonido-jugada'
import { Partida } from '@/wss/validators/go'

/**
 * Suena cada vez que una jugada se confirma en el server, propia o del contrincante (o que entra una
 * piedra en la partida que se observa). Se detecta por el crecimiento del historial de la misma
 * partida, así que la respuesta del comando y el broadcast (mismo estado) suenan una sola vez; cargar
 * o cambiar de partida no suena.
 */
export function useSonidoJugada(partida: Partida | null) {
  const previa = useRef<{ id: string; jugadas: number } | null>(null)

  useEffect(() => {
    if (!partida) {
      previa.current = null
      return
    }

    const jugadas = partida.historial.length
    if (previa.current?.id === partida.id && jugadas > previa.current.jugadas) sonarJugada()
    previa.current = { id: partida.id, jugadas }
  }, [partida])
}
