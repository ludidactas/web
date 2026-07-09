import redis from '../redis'
import { salaData, type SalaData } from '../validators/salas'
import { WssEstudianteSession } from '../validators/session'

export type { SalaData }

// -- Salas --

/** Devuelve la data de la sala, o `null` si no existe. */
export async function getSala(salaId: string): Promise<SalaData | null> {
  const str = await redis.hget('salas', salaId)
  return str ? salaData.parse(JSON.parse(str)) : null
}

/** Persiste la data de la sala. */
export async function guardarSala(sala: SalaData): Promise<void> {
  await redis.hset('salas', sala.id, JSON.stringify(sala))
}

/** Verifica si una sala existe. */
export async function existeSala(salaId: string): Promise<boolean> {
  return (await redis.hexists('salas', salaId)) === 1
}

// -- Relaciones profe-sala --

/** Devuelve el ID de sala asociado al email de un profe, o `null`. */
export async function getIdSalaDeProfe(email: string): Promise<string | null> {
  return redis.hget('owners_salas', email)
}

/** Devuelve el email del profe dueño de la sala, o `null`. */
export async function getEmailProfe(salaId: string): Promise<string | null> {
  return redis.hget('salas_owners', salaId)
}

/** Registra la relación bidireccional entre un profe y su sala. */
export async function registrarProfe(email: string, salaId: string): Promise<void> {
  await Promise.all([redis.hset('owners_salas', email, salaId), redis.hset('salas_owners', salaId, email)])
}

// -- Estudiantes --

/**
 * Devuelve la planilla de la sala: mapa `userId → sesión`. Es el registro durable de quiénes
 * pasaron por la sala. La presencia NO se guarda acá; se deduce de los sockets vivos al listar.
 */
export async function getEstudiantes(salaId: string): Promise<Record<string, WssEstudianteSession>> {
  const raw = (await redis.hgetall(`sala:${salaId}:estudiantes`)) ?? {}
  return Object.fromEntries(
    Object.entries(raw).map(([userId, str]) => [userId, JSON.parse(str) as WssEstudianteSession])
  )
}

/** Agrega/actualiza al estudiante en la planilla, persistiendo su sesión (idempotente por `userId`). */
export async function guardarEstudiante(salaId: string, session: WssEstudianteSession): Promise<void> {
  await redis.hset(`sala:${salaId}:estudiantes`, session.userId, JSON.stringify(session))
}

/** Borra varios estudiantes en un pipeline (evita múltiples round-trips). */
export async function borrarEstudiantes(salaId: string, userIds: string[]): Promise<void> {
  const pipeline = redis.pipeline()
  for (const id of userIds) {
    pipeline.hdel(`sala:${salaId}:estudiantes`, id)
  }
  await pipeline.exec()
}

// -- Asistencia (log de conexión/desconexión) --

// Nota: Este log de asistencia guarda los intervalos en los que estuvo conectado un `userId`
// y es independiente de la planilla, que deduce quién está presente a partir de los sokets conectados.

// Esta planilla de asistencia de momento solo se está almacenando y solo más adelante
// vamos a renderizarla o exportarla de alguna forma a través del FE.

/** Un evento crudo de presencia. `ts` es epoch ms. */
export type EventoAsistencia = { userId: string; evento: 'conexion' | 'desconexion'; ts: number }

/** Un intervalo durante el cual el estudiante estuvo conectado. `fin: null` = intervalo aún abierto. */
export type Intervalo = { inicio: number; fin: number | null }

/**
 * Appendea un evento de presencia al log de asistencia de la sala. Es append-only: los intervalos
 * se reconstruyen al leer (ver `getEventosAsistencia`), no se mutan eventos pasados.
 */
export async function registrarEventoAsistencia(
  salaId: string,
  userId: string,
  evento: EventoAsistencia['evento'],
  ts: number
): Promise<void> {
  const evt: EventoAsistencia = { userId, evento, ts }
  await redis.rpush(`sala:${salaId}:asistencia`, JSON.stringify(evt))
}

/** Devuelve todos los eventos de asistencia de la sala, en orden de inserción. */
export async function getEventosAsistencia(salaId: string): Promise<EventoAsistencia[]> {
  const raw = await redis.lrange(`sala:${salaId}:asistencia`, 0, -1)
  return raw.map((s) => JSON.parse(s) as EventoAsistencia)
}
