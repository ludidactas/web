import redis from '../redis'
import { infoEntrada, type InfoEntrada } from '../validators/invitados'

// -- Lista de la sala (identidades normalizadas, ver `identidad.ts`) --

export async function agregarPermitidosA(list: string[], salaId: string): Promise<void> {
  const pipeline = redis.pipeline()
  for (const entrada of list) {
    pipeline.sadd(`sala:${salaId}:allowed_list`, entrada)
  }
  await pipeline.exec()
}

export async function obtenerPermitidosDe(salaId: string): Promise<string[]> {
  return await redis.smembers(`sala:${salaId}:allowed_list`)
}

export async function limpiarListaPermitidosDe(salaId: string): Promise<void> {
  console.log(`🗑️  Borrando lista de permitidos de sala ${salaId}`)
  await redis.del(`sala:${salaId}:allowed_list`)
}

export async function quitarPermitidosDe(list: string[], salaId: string): Promise<void> {
  console.log(`➖ Removiendo ${list.length} entrada(s) de la lista de sala ${salaId}:`, list)
  await redis.srem(`sala:${salaId}:allowed_list`, ...list)
}

// -- Info que el profe anotó de las entradas de la lista (entrada → JSON de `infoEntrada`) --

/** Persiste la info de una entrada de la lista. */
export async function setInfoPermitido(salaId: string, entrada: string, info: InfoEntrada): Promise<void> {
  await redis.hset(`sala:${salaId}:allowed_info`, entrada, JSON.stringify(info))
}

/** Devuelve el mapa entrada → info de la lista de la sala. Una entrada ilegible se omite. */
export async function obtenerInfoPermitidos(salaId: string): Promise<Record<string, InfoEntrada>> {
  const crudo = (await redis.hgetall(`sala:${salaId}:allowed_info`)) ?? {}
  return Object.fromEntries(
    Object.entries(crudo).flatMap(([entrada, json]) => {
      try {
        return [[entrada, infoEntrada.parse(JSON.parse(json))]]
      } catch {
        console.warn(`⚠️  Sala ${salaId}: info de '${entrada}' ilegible, se omite`)
        return []
      }
    })
  )
}

/** Borra la info de las entradas dadas (al removerlas de la lista). */
export async function quitarInfoPermitidos(list: string[], salaId: string): Promise<void> {
  await redis.hdel(`sala:${salaId}:allowed_info`, ...list)
}

/** Borra la info de toda la lista de la sala (al borrar la lista completa). */
export async function limpiarInfoPermitidosDe(salaId: string): Promise<void> {
  await redis.del(`sala:${salaId}:allowed_info`)
}
