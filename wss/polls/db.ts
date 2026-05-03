import { mapValues } from 'remeda'
import db, { WssHashmaps, WssKeys, WssSets } from '../redis'
import { Encuesta } from '../validators/polls'

// -- Keys --

const k = {
  poll: (salaId: string, pollId: string): WssKeys => `sala:${salaId}:polls:${pollId}`,
  pollsIndex: (salaId: string): WssSets => `sala:${salaId}:polls`,
  focused: (salaId: string): WssKeys => `sala:${salaId}:polls:focused`,
  votos: (salaId: string, pollId: string): WssHashmaps => `sala:${salaId}:poll:${pollId}:votos`,
  votosUsuario: (salaId: string, pollId: string, userId: string): WssSets =>
    `sala:${salaId}:poll:${pollId}:votos:${userId}`,
  votantes: (salaId: string, pollId: string): WssSets => `sala:${salaId}:poll:${pollId}:votantes`,
  votantesOpcion: (salaId: string, pollId: string, optionId: string): WssSets =>
    `sala:${salaId}:poll:${pollId}:opcion:${optionId}:votantes`,
}

// -- Encuestas --

/** Devuelve la encuesta, o `null` si no existe. */
export async function getEncuesta(salaId: string, pollId: string): Promise<Encuesta | null> {
  const str = await db.get(k.poll(salaId, pollId))
  return str ? (JSON.parse(str) as Encuesta) : null
}

/** Persiste el JSON de la encuesta. */
export async function guardarEncuesta(salaId: string, poll: Encuesta): Promise<void> {
  await db.set(k.poll(salaId, poll.id), JSON.stringify(poll))
}

/** Borra la clave JSON de la encuesta (no toca índice ni votos). */
export async function borrarEncuesta(salaId: string, pollId: string): Promise<void> {
  await db.del(k.poll(salaId, pollId))
}

/** Devuelve los IDs de todas las encuestas de la sala. */
export async function getIdsEncuestas(salaId: string): Promise<string[]> {
  return db.smembers(k.pollsIndex(salaId))
}

/** Agrega una encuesta al índice de la sala. */
export async function registarEncuestas(salaId: string, pollId: string): Promise<void> {
  await db.sadd(k.pollsIndex(salaId), pollId)
}

/** Elimina una encuesta del índice de la sala. */
export async function desregistrarEncuesta(salaId: string, pollId: string): Promise<void> {
  await db.srem(k.pollsIndex(salaId), pollId)
}

/** Verifica si existe la clave JSON de una encuesta. */
export async function existeEncuesta(salaId: string, pollId: string): Promise<boolean> {
  return !!(await db.exists(k.poll(salaId, pollId)))
}

// -- Encuesta enfocada --

/** Devuelve el ID de la encuesta enfocada actualmente, o `null`. */
export async function getEnfocada(salaId: string): Promise<string | null> {
  return db.get(k.focused(salaId))
}

/** Establece la encuesta enfocada (reemplaza la anterior sin desfocarla). */
export async function setEnfocada(salaId: string, pollId: string): Promise<void> {
  await db.set(k.focused(salaId), pollId)
}

/** Elimina la encuesta enfocada. */
export async function limpiarEnfocada(salaId: string): Promise<void> {
  await db.del(k.focused(salaId))
}

// -- Votos (conteos por opción) --

/** Devuelve los conteos de votos por ID de opción. */
export async function getVotos(salaId: string, pollId: string): Promise<Record<string, number>> {
  const raw = await db.hgetall(k.votos(salaId, pollId))
  return raw ? mapValues(raw, (v) => parseInt(v)) : {} // hgetall devuelve strings
}

/** Incrementa atómicamente el contador de votos de una opción. */
export async function incrementarVoto(salaId: string, pollId: string, optionId: string): Promise<void> {
  await db.hincrby(k.votos(salaId, pollId), optionId, 1)
}

/** Borra el hash de votos de una encuesta. */
export async function limpiarVotos(salaId: string, pollId: string): Promise<void> {
  await db.del(k.votos(salaId, pollId))
}

// -- Votos por usuario --

/** Devuelve los IDs de opción que votó un usuario. */
export async function getVotosUsuario(salaId: string, pollId: string, userId: string): Promise<string[]> {
  return db.smembers(k.votosUsuario(salaId, pollId, userId))
}

/** Registra que un usuario votó una opción. */
export async function addVotoUsuario(salaId: string, pollId: string, userId: string, optionId: string): Promise<void> {
  await db.sadd(k.votosUsuario(salaId, pollId, userId), optionId)
}

/** Borra el set de opciones votadas por un usuario. */
export async function borrarVotosUsuario(salaId: string, pollId: string, userId: string): Promise<void> {
  await db.del(k.votosUsuario(salaId, pollId, userId))
}

/** Cuenta cuántas opciones votó un usuario en la encuesta. */
export async function contarVotosUsuario(salaId: string, pollId: string, userId: string): Promise<number> {
  return db.scard(k.votosUsuario(salaId, pollId, userId))
}

// -- Votantes --

/** Devuelve los IDs de los usuarios que votaron en la encuesta. */
export async function getVotantes(salaId: string, pollId: string): Promise<string[]> {
  return db.smembers(k.votantes(salaId, pollId))
}

/** Registra a un usuario como votante de la encuesta. */
export async function addVotante(salaId: string, pollId: string, userId: string): Promise<void> {
  await db.sadd(k.votantes(salaId, pollId), userId)
}

/** Borra el set de votantes de una encuesta. */
export async function borrarVotantes(salaId: string, pollId: string): Promise<void> {
  await db.del(k.votantes(salaId, pollId))
}

/** Verifica si un usuario ya votó en la encuesta. */
export async function yaVoto(salaId: string, pollId: string, userId: string): Promise<boolean> {
  return !!(await db.sismember(k.votantes(salaId, pollId), userId))
}

// -- Votantes por opción --

/** Devuelve los IDs de los usuarios que votaron una opción específica. */
export async function getVotantesOpcion(salaId: string, pollId: string, optionId: string): Promise<string[]> {
  return db.smembers(k.votantesOpcion(salaId, pollId, optionId))
}

/** Registra a un usuario como votante de una opción específica. */
export async function addVotanteOpcion(
  salaId: string,
  pollId: string,
  optionId: string,
  userId: string
): Promise<void> {
  await db.sadd(k.votantesOpcion(salaId, pollId, optionId), userId)
}

/** Borra el set de votantes de una opción específica. */
export async function borrarVotantesOpcion(salaId: string, pollId: string, optionId: string): Promise<void> {
  await db.del(k.votantesOpcion(salaId, pollId, optionId))
}
