import db from '../redis'
import { ConfigSala } from '../validators/salas'

export interface SalaData {
  id: string
  profe: {
    email: string
    nombre?: string
  }
  config: ConfigSala
}

// -- Salas --

/** Devuelve la data de la sala, o `null` si no existe. */
export async function getSala(salaId: string): Promise<SalaData | null> {
  const str = await db.hget('salas', salaId)
  return str ? (JSON.parse(str) as SalaData) : null
}

/** Persiste la data de la sala. */
export async function guardarSala(sala: SalaData): Promise<void> {
  await db.hset('salas', sala.id, JSON.stringify(sala))
}

/** Verifica si una sala existe. */
export async function existeSala(salaId: string): Promise<boolean> {
  return (await db.hexists('salas', salaId)) === 1
}

// -- Relaciones profe-sala --

/** Devuelve el ID de sala asociado al email de un profe, o `null`. */
export async function getIdSalaDeProfe(email: string): Promise<string | null> {
  return db.hget('owners_salas', email)
}

/** Devuelve el email del profe dueño de la sala, o `null`. */
export async function getEmailProfe(salaId: string): Promise<string | null> {
  return db.hget('salas_owners', salaId)
}

/** Registra la relación bidireccional entre un profe y su sala. */
export async function registrarProfe(email: string, salaId: string): Promise<void> {
  await Promise.all([db.hset('owners_salas', email, salaId), db.hset('salas_owners', salaId, email)])
}

// -- Estudiantes --

/** Devuelve el mapa `userId → "1"|"0"` de estudiantes de la sala. */
export async function getEstudiantes(salaId: string): Promise<Record<string, string>> {
  return (await db.hgetall(`sala:${salaId}:estudiantes`)) ?? {}
}

/** Marca a un estudiante como presente. */
export async function marcarPresente(salaId: string, userId: string): Promise<void> {
  await db.hset(`sala:${salaId}:estudiantes`, userId, '1')
}

/** Marca a un estudiante como ausente. */
export async function marcarAusente(salaId: string, userId: string): Promise<void> {
  await db.hset(`sala:${salaId}:estudiantes`, userId, '0')
}

/** Borra un estudiante de la sala. */
export async function borrarEstudiante(salaId: string, userId: string): Promise<void> {
  await db.hdel(`sala:${salaId}:estudiantes`, userId)
}

/** Borra varios estudiantes en un pipeline (evita múltiples round-trips). */
export async function borrarEstudiantes(salaId: string, userIds: string[]): Promise<void> {
  const pipeline = db.pipeline()
  for (const id of userIds) {
    pipeline.hdel(`sala:${salaId}:estudiantes`, id)
  }
  await pipeline.exec()
}
