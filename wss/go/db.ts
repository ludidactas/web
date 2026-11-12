import redis from '../redis'
import { Partida, partidaDrivePendienteSchema, partidaSchema, type PartidaDrivePendiente } from '../validators/go'
import { versionado } from '../versionado'

const partidaCodec = versionado({ schema: partidaSchema })
const partidaDriveCodec = versionado({ schema: partidaDrivePendienteSchema })

/** Persistencia en Redis de una partida de Go — claves bajo `sala:<id>:go:...` (ver `k` abajo). */
const k = {
  /** STRING — JSON de la partida completa. */
  partida: (salaId: string, partidaId: string) => `sala:${salaId}:go:${partidaId}`,
  /** SET — IDs de todas las partidas (pendientes, en curso o terminadas) de la sala. */
  partidasIndex: (salaId: string) => `sala:${salaId}:go`,
  /** STRING — ID de la partida pendiente/en curso de un usuario en la sala (una por vez). */
  partidaActiva: (salaId: string, userId: string) => `sala:${salaId}:go:activa:${userId}`,
  /** HASH — estadísticas acumuladas de un usuario en la sala: { jugadas, ganadas }. Por sala, no
   * global: el userId de un estudiante (dni o nombre) no es único fuera de su propia sala. */
  stats: (salaId: string, userId: string) => `sala:${salaId}:go:stats:${userId}`,
}

/** Devuelve la partida, o `null` si no existe. */
export async function getPartida(salaId: string, partidaId: string): Promise<Partida | null> {
  const str = await redis.get(k.partida(salaId, partidaId))
  return str ? partidaCodec.parsear(str) : null
}

/** Persiste el JSON completo de la partida. */
export async function guardarPartida(partida: Partida): Promise<void> {
  await redis.set(k.partida(partida.salaId, partida.id), partidaCodec.serializar(partida))
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

/** Suma una partida jugada (y, si ganó, una ganada) a las estadísticas del usuario en esa sala. */
export async function incrementarStats(salaId: string, userId: string, gano: boolean): Promise<void> {
  await redis.hincrby(k.stats(salaId, userId), 'jugadas', 1)
  if (gano) await redis.hincrby(k.stats(salaId, userId), 'ganadas', 1)
}

// -- Partidas pendientes de subir a Drive (hash) --

export type { PartidaDrivePendiente }

const partidasDrivePendientes = (salaId: string) => `sala:${salaId}:partidas_drive_pendientes`

/** Encola una partida terminada para que el FE del profe la suba a Drive al abrir la sala. */
export async function encolarPartidaDrive(salaId: string, p: PartidaDrivePendiente): Promise<void> {
  await redis.hset(partidasDrivePendientes(salaId), p.id, partidaDriveCodec.serializar(p))
}

/** Devuelve las partidas pendientes de subir a Drive, sin borrarlas. */
export async function getPartidasDrivePendientes(salaId: string): Promise<PartidaDrivePendiente[]> {
  const raw = (await redis.hgetall(partidasDrivePendientes(salaId))) ?? {}
  return Object.values(raw).map((str) => partidaDriveCodec.parsear(str))
}

/** Descarta las partidas ya subidas: solo se llama cuando el FE confirmó que quedaron escritas en Drive. */
export async function descartarPartidasDrivePendientes(salaId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  await redis.hdel(partidasDrivePendientes(salaId), ...ids)
}
