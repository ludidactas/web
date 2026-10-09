import { comando, comandoAck, devuelve, sinPayload } from './definir'
import {
  EncuestaConVotos,
  EncuestaHidratadaEstudiante,
  EncuestaHidratadaProfe,
  nuevaEncuesta,
  pollIdSchema,
  userIdSchema,
  voteValidator,
} from '../validators/polls'

/** Comandos de encuestas del profe, ligados a la sala que tiene abierta. */
export const comandosPollsProfe = {
  'poll:create': comandoAck(nuevaEncuesta, devuelve<void>()),
  'poll:votos:usuario': comando(userIdSchema),
  'poll:open': comando(pollIdSchema),
  'poll:close': comando(pollIdSchema),
  'poll:publish': comando(pollIdSchema),
  'poll:hide': comando(pollIdSchema),
  'poll:reveal': comando(pollIdSchema),
  'poll:unreveal': comando(pollIdSchema),
  'poll:focus': comando(pollIdSchema),
  'poll:unfocus': comando(pollIdSchema),
  'poll:delete': comando(pollIdSchema),
}

/** Comandos de encuestas del estudiante. */
export const comandosPollsEstudiante = {
  'polls:list': comando(sinPayload),
  'poll:vote': comando(voteValidator),
}

/** Comandos de encuestas del cliente público (overlay). */
export const comandosPollsOverlay = {
  'poll:pedir_enfocada': comandoAck(sinPayload, devuelve<EncuestaConVotos | null>()),
}

export interface EventosPollsProfe {
  'poll:updated': EncuestaHidratadaProfe
  'poll:deleted': { pollId: string }
  'poll:votos:usuario': { userId: string; votos: Record<string, string[]> }
}

export interface EventosPollsEstudiante {
  'polls:list': EncuestaHidratadaEstudiante[]
  'poll:updated': EncuestaHidratadaEstudiante
  'poll:deleted': { pollId: string }
}

export interface EventosPollsOverlay {
  'poll:updated': EncuestaConVotos
  'poll:deleted': { pollId: string }
}
