import z from 'zod'

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
  tablero: number[][]
  turno: 1 | 2
  capturasNegras: number
  capturasBlancas: number
  pases: number
  /** Hashes de posiciones ya vistas en la partida, para detectar ko / superko. */
  historial: string[]
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

export const desafioSchema = z.object({
  rivalId: z.string().min(1),
  tamaño: z.union([z.literal(9), z.literal(13), z.literal(19)]).default(9),
})
export type Desafio = z.infer<typeof desafioSchema>

export const partidaIdSchema = z.object({
  partidaId: z.string().min(1),
})

export const jugadaSchema = z.object({
  partidaId: z.string().min(1),
  x: z.number().int(),
  y: z.number().int(),
})
