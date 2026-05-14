import redis from "../redis"

// -- Lista de participantes permitidos (excluyente) --

export async function addAllowedParticipants(list: string[], roomID: string): Promise<void> {
  console.log(`✅ Agregando ${list.length} DNI(s) a lista de sala ${roomID}:`, list)
  const pipeline = redis.pipeline()
  for (const dni of list) {
      pipeline.sadd(`sala:${roomID}:allowed_list`, dni)
  }
  await pipeline.exec()
}

export async function getAllowedParticipantsListFrom(roomID: string): Promise<string[]> {
  return await redis.smembers(`sala:${roomID}:allowed_list`)
}

export async function removeAllowedParticipantsListFrom(roomID: string): Promise<void> {
  console.log(`🗑️  Borrando lista de permitidos de sala ${roomID}`)
  await redis.del(`sala:${roomID}:allowed_list`)
}

export async function removeAllowedParticipants(list: string[], roomID: string): Promise<void> {
  console.log(`➖ Removiendo ${list.length} DNI(s) de lista de sala ${roomID}:`, list)
  await redis.srem(`sala:${roomID}:allowed_list`, ...list)
}