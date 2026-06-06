import { randomUUID } from 'crypto'
import redis from '../redis'

export interface Identidad {
  id: string
  sesionId?: string // clientId:nombre
  dni?: string
}

const keys = (salaId: string) => ({
  tabla:    `sala:${salaId}:identidades`,
  porSesion: `sala:${salaId}:identidades:por_sesion`,
  porDni:   `sala:${salaId}:identidades:por_dni`,
})

/**
 * Resuelve la identidad de un estudiante en la sala.
 * Busca por DNI primero, luego por sesionId (clientId+nombre).
 * Si no existe, crea una nueva entrada.
 * Si existe pero le faltan datos, los agrega (enriquecimiento).
 */
export async function resolverIdentidad(
  salaId: string,
  { dni, clientId, nombre }: { dni?: string; clientId?: string; nombre?: string }
): Promise<Identidad> {
  const k = keys(salaId)
  const sesionId = clientId && nombre ? `${clientId}:${nombre}` : undefined

  let uuid: string | null = null

  if (dni) {
    uuid = await redis.hget(k.porDni, dni)
  } else if (sesionId) {
    uuid = await redis.hget(k.porSesion, sesionId)
  }

  if (uuid) {
    const raw = await redis.hget(k.tabla, uuid)
    const identidad: Identidad = raw ? JSON.parse(raw) : { id: uuid }

    // Enriquecer con datos nuevos
    let modificada = false
    if (dni && !identidad.dni) {
      identidad.dni = dni
      await redis.hset(k.porDni, dni, uuid)
      modificada = true
    }
    if (sesionId && !identidad.sesionId) {
      identidad.sesionId = sesionId
      await redis.hset(k.porSesion, sesionId, uuid)
      modificada = true
    }
    if (modificada) await redis.hset(k.tabla, uuid, JSON.stringify(identidad))

    return identidad
  }

  // Nueva identidad
  uuid = randomUUID()
  const identidad: Identidad = { id: uuid, sesionId, dni }

  const pipe = redis.pipeline()
  pipe.hset(k.tabla, uuid, JSON.stringify(identidad))
  if (dni) pipe.hset(k.porDni, dni, uuid)
  if (sesionId) pipe.hset(k.porSesion, sesionId, uuid)
  await pipe.exec()

  return identidad
}
