import type { Ack } from '@/wss/middleware/error-handling'
import type { Socket } from 'socket.io-client'

/** Emite un comando y espera su ack (`conAck` del server). Rechaza con el error del server o por timeout. */
export async function emitirConAck<T>(socket: Socket, evento: string, payload?: unknown, timeoutMs = 5000): Promise<T> {
  const res: Ack<T> = await socket.timeout(timeoutMs).emitWithAck(evento, payload)
  if (!res.ok) throw new Error(res.error)
  return res.data
}
