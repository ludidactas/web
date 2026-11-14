import redis from '../redis'

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

// -- Nombres provistos por el profe para las entradas de la lista (entrada → nombre) --

/** Persiste el nombre que el profe le asignó a una entrada de la lista. */
export async function setNombrePermitido(salaId: string, entrada: string, nombre: string): Promise<void> {
  await redis.hset(`sala:${salaId}:allowed_names`, entrada, nombre)
}

/** Devuelve el mapa entrada → nombre provisto de la lista de la sala. */
export async function obtenerNombresPermitidos(salaId: string): Promise<Record<string, string>> {
  return (await redis.hgetall(`sala:${salaId}:allowed_names`)) ?? {}
}

/** Borra los nombres provistos de las entradas dadas (al removerlas de la lista). */
export async function quitarNombresPermitidos(list: string[], salaId: string): Promise<void> {
  await redis.hdel(`sala:${salaId}:allowed_names`, ...list)
}

/** Borra todos los nombres provistos de la sala (al borrar la lista completa). */
export async function limpiarNombresPermitidosDe(salaId: string): Promise<void> {
  await redis.del(`sala:${salaId}:allowed_names`)
}
