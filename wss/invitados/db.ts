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
