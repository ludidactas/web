import redis from '../redis'

// -- Lista de participantes permitidos (excluyente) --

export async function agregarPermitidosA(list: string[], salaId: string): Promise<void> {
  const pipeline = redis.pipeline()
  for (const dni of list) {
    pipeline.sadd(`sala:${salaId}:allowed_list`, dni)
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
  console.log(`➖ Removiendo ${list.length} DNI(s) de lista de sala ${salaId}:`, list)
  await redis.srem(`sala:${salaId}:allowed_list`, ...list)
}

// -- Nombres provistos por el profe para invitados (dni → nombre) --

/** Persiste el nombre que el profe le asignó a un DNI de la lista de invitados. */
export async function setNombrePermitido(salaId: string, dni: string, nombre: string): Promise<void> {
  await redis.hset(`sala:${salaId}:allowed_names`, dni, nombre)
}

/** Devuelve el mapa dni → nombre provisto de todos los invitados de la sala. */
export async function obtenerNombresPermitidos(salaId: string): Promise<Record<string, string>> {
  return (await redis.hgetall(`sala:${salaId}:allowed_names`)) ?? {}
}

/** Borra los nombres provistos de los DNIs dados (al removerlos de la lista de invitados). */
export async function quitarNombresPermitidos(list: string[], salaId: string): Promise<void> {
  await redis.hdel(`sala:${salaId}:allowed_names`, ...list)
}

/** Borra todos los nombres provistos de la sala (al borrar la lista completa de invitados). */
export async function limpiarNombresPermitidosDe(salaId: string): Promise<void> {
  await redis.del(`sala:${salaId}:allowed_names`)
}
