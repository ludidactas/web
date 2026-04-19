import { Pasaporte } from '@/wss/validators/auth'
import { io, Socket } from 'socket.io-client'
import { RazonExpiracion } from './conexion-wss'

if (!process.env.NEXT_PUBLIC_ENCUESTA_HOST) {
  throw new Error('Falta la dirección del host de websockets!')
}

/** Auth que espera el server de sockets */
export type SocketServerAuth = Pasaporte

/**
 * Definición local del tipo de Socket con nuestro objeto 'auth' tipado.
 */
export interface SocketWssCli extends Socket {
  auth: SocketServerAuth
}

/** Conecta el socket al servidor de encuestas con el token que devuelve `solicitarAuth`. Stateless. */
export async function handshake(auth: SocketServerAuth) {
  return io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}`, { auth, autoConnect: false }) as SocketWssCli
}

/**
 * Attachea event listeners. Imperativo.
 */
export async function configurarListeners({
  sock,
  listeners,
}: {
  sock: SocketWssCli
  listeners: {
    onConnect: (socket: SocketWssCli) => void
    onError: (socket: SocketWssCli, error: Error) => void
    onDisconnect: (socket: SocketWssCli, reason: string) => void
    onExpired: (socket: SocketWssCli, data: RazonExpiracion) => void
  }
}) {
  const { onConnect, onError, onDisconnect } = listeners

  // En cualquier caso, le suscribimos unos handlers básicos
  sock.on('connect_error', (error) => onError(sock, error))
  sock.on('disconnect', (reason: string) => onDisconnect(sock, reason))
  sock.on('connect', () => onConnect(sock))
  sock.on('connect_timeout', (error) =>
    onError(sock, new Error(`Timeout al conectar con el servidor de encuestas: ${error.message}`))
  )

  return sock
}

/** Limpia event listeners base y de sesión del socket */
export const limpiarListeners = (socket: SocketWssCli) => {
  socket.off('connect_error')
  socket.off('disconnect')
  socket.off('connect')
  socket.off('connect_timeout')
  socket.off('session:opened')
  socket.off('session:expired')
}
