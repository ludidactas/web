import z from 'zod'
import type { Color, Tablero } from '@/lib/go/motor'

/**
 * Zod schemas + tipos de una partida de Go — el contrato entre servidor y cliente (`Partida` es lo
 * que viaja por el socket y se persiste tal cual en Redis). `Color`/`Tablero` vienen del motor
 * compartido (`@/lib/go/motor`), no se redefinen acá.
 */

export const TAMAÑOS_TABLERO = [9, 13, 19] as const
export type TamañoTablero = (typeof TAMAÑOS_TABLERO)[number]

export const EstadoPartida = {
  Pendiente: 'pendiente',
  Jugando: 'jugando',
  Contando: 'contando',
  Terminada: 'terminada',
} as const
export type EstadoPartida = (typeof EstadoPartida)[keyof typeof EstadoPartida]

export interface JugadorPartida {
  userId: string
  nombre: string
}

export interface Resultado {
  negro: number
  blanco: number
  ganador: 'negro' | 'blanco' | 'empate'
}

/** Estado completo de una partida de Go, persistido tal cual en Redis. */
export interface Partida {
  id: string
  salaId: string
  tamaño: TamañoTablero
  negro: JugadorPartida
  blanco: JugadorPartida
  tablero: Tablero
  turno: Color
  capturasNegras: number
  capturasBlancas: number
  pases: number
  /** Hashes de posiciones ya vistas en la partida, para detectar ko / superko. */
  historial: string[]
  /** Coordenadas de la última piedra jugada (no cambia al pasar), para resaltarla en el tablero. */
  ultimaJugada: { fila: number; columna: number } | null
  /** Solo se usa durante la fase de conteo (`estado === 'contando'`). */
  removidas: boolean[][] | null
  /**
   * Matriz calculada una vez al entrar en conteo: `true` en los puntos de cadenas incondicionalmente
   * vivas (algoritmo de Benson). Esos grupos no se pueden marcar como muertos. Solo se usa durante
   * `estado === 'contando'`.
   */
  vivo: boolean[][] | null
  /** Quiénes confirmaron el conteo actual. Se resetea con cada marcado de piedra muerta. */
  confirmaron: { negro: boolean; blanco: boolean }
  estado: EstadoPartida
  resultado: Resultado | null
  motivoFin: 'conteo' | 'abandono' | null
  ganadorUserId: string | null
  creadaEn: string
}

export const invitacionSchema = z.object({
  contrincanteId: z.string().min(1),
  tamaño: z.union([z.literal(9), z.literal(13), z.literal(19)]).default(9),
})
export type Invitacion = z.infer<typeof invitacionSchema>

export const partidaIdSchema = z.object({
  partidaId: z.string().min(1),
})

export const jugadaSchema = z.object({
  partidaId: z.string().min(1),
  fila: z.number().int(),
  columna: z.number().int(),
})
