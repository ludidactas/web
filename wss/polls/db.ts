import { mapValues } from 'remeda'
import redis from '../redis'
import { Encuesta } from '../validators/polls'

const k = {
  /** STRING — JSON de las propiedades estáticas de la encuesta (título, opciones, estado). */
  poll: (salaId: string, pollId: string) => `sala:${salaId}:polls:${pollId}`,
  /** SET — IDs de todas las encuestas que existen en la sala. */
  pollsIndex: (salaId: string) => `sala:${salaId}:polls`,
  /** STRING — ID de la encuesta que el profe tiene actualmente en pantalla. */
  focused: (salaId: string) => `sala:${salaId}:polls:focused`,
  /** HASH — contadores de votos por opción: { [optionId]: count }. */
  votos: (salaId: string, pollId: string) => `sala:${salaId}:poll:${pollId}:votos`,
  /** SET — IDs de las opciones que eligió un usuario concreto. */
  votosUsuario: (salaId: string, pollId: string, userId: string) => `sala:${salaId}:poll:${pollId}:votos:${userId}`,
  /** SET — IDs de todos los usuarios que votaron en la encuesta (sin importar opción). */
  votantes: (salaId: string, pollId: string) => `sala:${salaId}:poll:${pollId}:votantes`,
  /** SET — IDs de los usuarios que votaron una opción específica. */
  votantesOpcion: (salaId: string, pollId: string, optionId: string) =>
    `sala:${salaId}:poll:${pollId}:opcion:${optionId}:votantes`,
}

// -- Encuestas --

/** Devuelve la encuesta, o `null` si no existe. */
export async function getEncuesta(salaId: string, pollId: string): Promise<Encuesta | null> {
  const str = await redis.get(k.poll(salaId, pollId))
  return str ? (JSON.parse(str) as Encuesta) : null
}

/** Persiste el JSON de la encuesta. */
export async function guardarEncuesta(salaId: string, poll: Encuesta): Promise<void> {
  await redis.set(k.poll(salaId, poll.id), JSON.stringify(poll))
}

/** Borra la clave JSON de la encuesta (no toca índice ni votos). */
export async function borrarEncuesta(salaId: string, pollId: string): Promise<void> {
  await redis.del(k.poll(salaId, pollId))
}

/** Devuelve los IDs de todas las encuestas de la sala. */
export async function getIdsEncuestas(salaId: string): Promise<string[]> {
  return redis.smembers(k.pollsIndex(salaId))
}

/** Agrega una encuesta al índice de la sala. */
export async function registarEncuestas(salaId: string, pollId: string): Promise<void> {
  await redis.sadd(k.pollsIndex(salaId), pollId)
}

/** Elimina una encuesta del índice de la sala. */
export async function desregistrarEncuesta(salaId: string, pollId: string): Promise<void> {
  await redis.srem(k.pollsIndex(salaId), pollId)
}

/** Verifica si existe la clave JSON de una encuesta. */
export async function existeEncuesta(salaId: string, pollId: string): Promise<boolean> {
  return !!(await redis.exists(k.poll(salaId, pollId)))
}

// -- Encuesta enfocada --

/** Devuelve el ID de la encuesta enfocada actualmente, o `null`. */
export async function getEnfocada(salaId: string): Promise<string | null> {
  return redis.get(k.focused(salaId))
}

/** Establece la encuesta enfocada (reemplaza la anterior sin desfocarla). */
export async function setEnfocada(salaId: string, pollId: string): Promise<void> {
  await redis.set(k.focused(salaId), pollId)
}

/** Elimina la encuesta enfocada. */
export async function limpiarEnfocada(salaId: string): Promise<void> {
  await redis.del(k.focused(salaId))
}

// -- Votos (conteos por opción) --

/** Devuelve los conteos de votos por ID de opción. */
export async function getVotos(salaId: string, pollId: string): Promise<Record<string, number>> {
  const raw = await redis.hgetall(k.votos(salaId, pollId))
  return raw ? mapValues(raw, (v) => parseInt(v)) : {} // hgetall devuelve strings
}

/** Incrementa atómicamente el contador de votos de una opción. */
export async function incrementarVoto(salaId: string, pollId: string, optionId: string): Promise<void> {
  await redis.hincrby(k.votos(salaId, pollId), optionId, 1)
}

/** Borra el hash de votos de una encuesta. */
export async function limpiarVotos(salaId: string, pollId: string): Promise<void> {
  await redis.del(k.votos(salaId, pollId))
}

// -- Votos por usuario --

/** Devuelve los IDs de opción que votó un usuario. */
export async function getVotosUsuario(salaId: string, pollId: string, userId: string): Promise<string[]> {
  return redis.smembers(k.votosUsuario(salaId, pollId, userId))
}

/** Registra que un usuario votó una opción. */
export async function addVotoUsuario(salaId: string, pollId: string, userId: string, optionId: string): Promise<void> {
  await redis.sadd(k.votosUsuario(salaId, pollId, userId), optionId)
}

/** Borra el set de opciones votadas por un usuario. */
export async function borrarVotosUsuario(salaId: string, pollId: string, userId: string): Promise<void> {
  await redis.del(k.votosUsuario(salaId, pollId, userId))
}

/** Cuenta cuántas opciones votó un usuario en la encuesta. */
export async function contarVotosUsuario(salaId: string, pollId: string, userId: string): Promise<number> {
  return redis.scard(k.votosUsuario(salaId, pollId, userId))
}

// -- Votantes --

/** Devuelve los IDs de los usuarios que votaron en la encuesta. */
export async function getVotantes(salaId: string, pollId: string): Promise<string[]> {
  return redis.smembers(k.votantes(salaId, pollId))
}

/** Registra a un usuario como votante de la encuesta. */
export async function addVotante(salaId: string, pollId: string, userId: string): Promise<void> {
  await redis.sadd(k.votantes(salaId, pollId), userId)
}

/** Borra el set de votantes de una encuesta. */
export async function borrarVotantes(salaId: string, pollId: string): Promise<void> {
  await redis.del(k.votantes(salaId, pollId))
}

/** Verifica si un usuario ya votó en la encuesta. */
export async function yaVoto(salaId: string, pollId: string, userId: string): Promise<boolean> {
  return !!(await redis.sismember(k.votantes(salaId, pollId), userId))
}

// -- Votantes por opción --

/** Devuelve los IDs de los usuarios que votaron una opción específica. */
export async function getVotantesOpcion(salaId: string, pollId: string, optionId: string): Promise<string[]> {
  return redis.smembers(k.votantesOpcion(salaId, pollId, optionId))
}

/** Registra a un usuario como votante de una opción específica. */
export async function addVotanteOpcion(
  salaId: string,
  pollId: string,
  optionId: string,
  userId: string
): Promise<void> {
  await redis.sadd(k.votantesOpcion(salaId, pollId, optionId), userId)
}

/** Borra el set de votantes de una opción específica. */
export async function borrarVotantesOpcion(salaId: string, pollId: string, optionId: string): Promise<void> {
  await redis.del(k.votantesOpcion(salaId, pollId, optionId))
}
