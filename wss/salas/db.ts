import redis from '../redis'
import {
  asistenciaDeClaseSchema,
  eventoAsistenciaSchema,
  registroDeClaseSchema,
  type AsistenciaDeClase,
  type EventoAsistencia,
  type RegistroDeClase,
} from '../validators/asistencia'
import { salaData, type SalaData } from '../validators/salas'
import { WssEstudianteSession, WssEstudianteSessionSchema } from '../validators/session'
import { versionado } from '../versionado'

export type { SalaData }

// -- Salas --

// Codecs de los documentos JSON de redis. Para evolucionar un shape ver `docs/versionado-redis.md`.
export const salaCodec = versionado({ schema: salaData })
const estudianteCodec = versionado({ schema: WssEstudianteSessionSchema })
const eventoAsistenciaCodec = versionado({ schema: eventoAsistenciaSchema })
const asistenciaDeClaseCodec = versionado({ schema: asistenciaDeClaseSchema })
const registroDeClaseCodec = versionado({ schema: registroDeClaseSchema })

/** Devuelve la data de la sala, o `null` si no existe. */
export async function getSala(salaId: string): Promise<SalaData | null> {
  const str = await redis.hget('salas', salaId)
  return str ? salaCodec.parsear(str) : null
}

/** Persiste la data de la sala. */
export async function guardarSala(sala: SalaData): Promise<void> {
  await redis.hset('salas', sala.id, salaCodec.serializar(sala))
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

/** Devuelve los IDs de las salas de un profe (puede ser vacío). */
export async function getIdsSalasDeProfe(email: string): Promise<string[]> {
  return redis.smembers(`profe:${email}:salas`)
}

/** Devuelve el email del profe dueño de la sala, o `null`. */
export async function getEmailProfe(salaId: string): Promise<string | null> {
  return redis.hget('salas_owners', salaId)
}

export async function agregarSalaAProfe(email: string, salaId: string): Promise<void> {
  await Promise.all([redis.sadd(`profe:${email}:salas`, salaId), redis.hset('salas_owners', salaId, email)])
}

export async function eliminarSalaDeProfe(email: string, salaId: string): Promise<void> {
  await Promise.all([redis.srem(`profe:${email}:salas`, salaId), redis.hdel('salas_owners', salaId)])
}

// -- Estudiantes --

/**
 * Devuelve la planilla de la sala: mapa `userId → sesión`. Es el registro durable de quiénes
 * pasaron por la sala. La presencia NO se guarda acá; se deduce de los sockets vivos al listar.
 * Un estudiante cuyo documento no cumple el schema se omite (con warning) para que no tire abajo la planilla.
 */
export async function getEstudiantes(salaId: string): Promise<Record<string, WssEstudianteSession>> {
  const raw = (await redis.hgetall(`sala:${salaId}:estudiantes`)) ?? {}
  return Object.fromEntries(
    Object.entries(raw).flatMap(([userId, str]) => {
      try {
        return [[userId, estudianteCodec.parsear(str)]]
      } catch (err) {
        console.warn(`⚠️  Sala ${salaId}: estudiante '${userId}' ilegible en la planilla, se omite:`, err)
        return []
      }
    })
  )
}

/** Agrega/actualiza al estudiante en la planilla, persistiendo su sesión (idempotente por `userId`). */
export async function guardarEstudiante(salaId: string, session: WssEstudianteSession): Promise<void> {
  await redis.hset(`sala:${salaId}:estudiantes`, session.userId, estudianteCodec.serializar(session))
}

// -- Asistencia (log de conexión/desconexión) --

// Nota: Este log de asistencia guarda los intervalos en los que estuvo conectado un `userId`
// y es independiente de la planilla, que deduce quién está presente a partir de los sokets conectados.

// Esta planilla de asistencia de momento solo se está almacenando y solo más adelante
// vamos a renderizarla o exportarla de alguna forma a través del FE.

export type { EventoAsistencia }

/** Un intervalo durante el cual el estudiante estuvo conectado. `fin: null` = intervalo aún abierto. */
export type IntervaloDeConexion = { inicio: number; fin: number | null }

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
  await redis.rpush(`sala:${salaId}:asistencia`, eventoAsistenciaCodec.serializar(evt))
}

/** Devuelve todos los eventos de asistencia de la sala, en orden de inserción. */
export async function getEventosAsistencia(salaId: string): Promise<EventoAsistencia[]> {
  const raw = await redis.lrange(`sala:${salaId}:asistencia`, 0, -1)
  return raw.map((s) => eventoAsistenciaCodec.parsear(s))
}

/** Borra el log de asistencia de la sala (la clase ya quedó resumida en un pendiente). */
export async function borrarLogDeAsistencia(salaId: string): Promise<void> {
  await redis.del(`sala:${salaId}:asistencia`)
}

// -- Asistencias pendientes (clase ya evaluada, pendiente de subir a Drive) --

/** Encola una clase evaluada al final de la cola de pendientes de subir a Drive. */
export async function encolarAsistencia(salaId: string, asistencia: AsistenciaDeClase): Promise<void> {
  await redis.rpush(`sala:${salaId}:asistencia_pendiente`, asistenciaDeClaseCodec.serializar(asistencia))
}

/**
 * Devuelve las asistencias pendientes de subir a Drive, en orden de cierre. Normalmente tiene 0 o 1
 * elemento: una clase se encola recién cuando el profe se retiró, y el FE la sube al volver a abrir la
 * sala. Puede haber varias sólo si alguna subida falló y la cola se fue acumulando.
 * NO las borra: el FE confirma con `sala:descartar_asistencias_pendientes` recién cuando la planilla
 * quedó escrita, así un fallo de subida no pierde la clase.
 */
export async function getAsistenciasPendientes(salaId: string): Promise<AsistenciaDeClase[]> {
  const raw = await redis.lrange(`sala:${salaId}:asistencia_pendiente`, 0, -1)
  return raw.map((s) => asistenciaDeClaseCodec.parsear(s))
}

/** Descarta las asistencias pendientes: se llama recién cuando el FE confirma que quedaron escritas en Drive. */
export async function borrarAsistenciasPendientes(salaId: string): Promise<void> {
  await redis.del(`sala:${salaId}:asistencia_pendiente`)
}

// -- Registro de la clase abierta (para el seguimiento de apertura/cierre en `wss/asistencia/seguimiento.ts`) --

export async function guardarRegistroDeClase(salaId: string, registro: RegistroDeClase): Promise<void> {
  await redis.set(`sala:${salaId}:registro_clase`, registroDeClaseCodec.serializar(registro))
}

export async function getRegistroDeClase(salaId: string): Promise<RegistroDeClase | null> {
  const raw = await redis.get(`sala:${salaId}:registro_clase`)
  return raw ? registroDeClaseCodec.parsear(raw) : null
}

export async function borrarRegistroDeClase(salaId: string): Promise<void> {
  await redis.del(`sala:${salaId}:registro_clase`)
}
