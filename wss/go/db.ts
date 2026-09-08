import redis from '../redis'
import { Partida } from '../validators/go'

const k = {
  /** STRING — JSON de la partida completa. */
  partida: (salaId: string, partidaId: string) => `sala:${salaId}:go:${partidaId}`,
  /** SET — IDs de todas las partidas (pendientes, en curso o terminadas) de la sala. */
  partidasIndex: (salaId: string) => `sala:${salaId}:go`,
  /** STRING — ID de la partida pendiente/en curso de un usuario en la sala (una por vez). */
  partidaActiva: (salaId: string, userId: string) => `sala:${salaId}:go:activa:${userId}`,
  /** HASH — estadísticas acumuladas de un usuario: { jugadas, ganadas }. */
  stats: (userId: string) => `usuario:${userId}:go:stats`,
}

/** Devuelve la partida, o `null` si no existe. */
export async function getPartida(salaId: string, partidaId: string): Promise<Partida | null> {
  const str = await redis.get(k.partida(salaId, partidaId))
  return str ? (JSON.parse(str) as Partida) : null
}

/** Persiste el JSON completo de la partida. */
export async function guardarPartida(partida: Partida): Promise<void> {
  await redis.set(k.partida(partida.salaId, partida.id), JSON.stringify(partida))
}

/** Devuelve los IDs de todas las partidas de la sala. */
export async function getIdsPartidas(salaId: string): Promise<string[]> {
  return redis.smembers(k.partidasIndex(salaId))
}

/** Agrega una partida al índice de la sala. */
export async function registrarPartida(salaId: string, partidaId: string): Promise<void> {
  await redis.sadd(k.partidasIndex(salaId), partidaId)
}

/** Devuelve el ID de la partida activa (pendiente o en curso) de un usuario, o `null`. */
export async function getPartidaActiva(salaId: string, userId: string): Promise<string | null> {
  return redis.get(k.partidaActiva(salaId, userId))
}

/** Marca una partida como la activa de un usuario. */
export async function setPartidaActiva(salaId: string, userId: string, partidaId: string): Promise<void> {
  await redis.set(k.partidaActiva(salaId, userId), partidaId)
}

/** Limpia la partida activa de un usuario (al terminar o al rechazar un desafío). */
export async function limpiarPartidaActiva(salaId: string, userId: string): Promise<void> {
  await redis.del(k.partidaActiva(salaId, userId))
}

/** Suma una partida jugada (y, si ganó, una ganada) a las estadísticas del usuario. */
export async function incrementarStats(userId: string, gano: boolean): Promise<void> {
  await redis.hincrby(k.stats(userId), 'jugadas', 1)
  if (gano) await redis.hincrby(k.stats(userId), 'ganadas', 1)
}
