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

/**
 * Borra la sala del hash `salas` y TODAS sus claves derivadas (`sala:<id>:*`): estudiantes,
 * asistencia, lista de permitidos, encuestas y votos. No toca las relaciones profe-sala
 * (de eso se encarga `eliminarSalaDeProfe`). Usa SCAN para no bloquear redis.
 */
export async function borrarSala(salaId: string): Promise<void> {
  await redis.hdel('salas', salaId)

  const patron = `sala:${salaId}:*`
  let cursor = '0'
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', patron, 'COUNT', 100)
    cursor = next
    if (keys.length > 0) await redis.del(...keys)
  } while (cursor !== '0')
}

// -- Relaciones profe-sala (1 profe → N salas) --

// El índice directo es un Set por profe (`profe:<email>:salas`), que admite varias salas.
// El índice inverso (`salas_owners`, sala → email) lo usamos para chequear propiedad.
//
// RETROCOMPAT (migración expand/contract): el modelo viejo guardaba la única sala del profe en el
// hash `owners_salas` (email → idSala). NO migramos ni borramos ese hash: lo leemos en paralelo
// para que los profes creados antes de multisala sigan viendo y operando su sala. Cuando todas las
// instancias corran este código y querramos cerrar la migración ("contract"), se elimina el bloque
// marcado abajo y, recién ahí, el hash `owners_salas`. (Las salas viejas ya tienen `salas_owners`,
// así que propiedad y operación funcionan sin tocar nada.)

/** Devuelve los IDs de las salas de un profe (puede ser vacío). Une el Set nuevo con el legacy. */
export async function getIdsSalasDeProfe(email: string): Promise<string[]> {
  const nuevas = await redis.smembers(`profe:${email}:salas`)
  // RETROCOMPAT owners_salas (1:1): incluimos la sala del modelo viejo si todavía existe.
  const vieja = await redis.hget('owners_salas', email)
  return vieja ? Array.from(new Set([...nuevas, vieja])) : nuevas
}

/** Devuelve el email del profe dueño de la sala, o `null`. */
export async function getEmailProfe(salaId: string): Promise<string | null> {
  return redis.hget('salas_owners', salaId)
}

/** Registra la relación bidireccional entre un profe y una de sus salas. */
export async function agregarSalaAProfe(email: string, salaId: string): Promise<void> {
  await Promise.all([redis.sadd(`profe:${email}:salas`, salaId), redis.hset('salas_owners', salaId, email)])
}

/** Quita la relación bidireccional entre un profe y una de sus salas. */
export async function eliminarSalaDeProfe(email: string, salaId: string): Promise<void> {
  await Promise.all([redis.srem(`profe:${email}:salas`, salaId), redis.hdel('salas_owners', salaId)])
  // RETROCOMPAT owners_salas (1:1): si la sala borrada era la del modelo viejo, limpiamos el legacy
  // para que no quede colgada en el listado (que une ambas formas).
  if ((await redis.hget('owners_salas', email)) === salaId) await redis.hdel('owners_salas', email)
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
