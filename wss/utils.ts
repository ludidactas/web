import { Socket } from 'socket.io'
import { z } from 'zod'

export function extractZodErrorMessages(error: z.ZodError): string {
  return error.issues.map((err) => err.message).join(', ')
}

export function sendError(socket: Socket, message: string) {
  socket.emit('wss:error', { message })
  // socket.disconnect(true);
}

/** Función para extraer el IP de un socket */
export function socketIp(socket: Socket) {
  // En prod usamos el IP forwardeado por nginx
  const forwarded = socket.handshake.headers['x-forwarded-for']
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : socket.handshake.address

  return ip
}
