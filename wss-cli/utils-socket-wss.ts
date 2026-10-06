import { Pasaporte } from '@/wss/validators/auth'
import { io, Socket, type ManagerOptions, type SocketOptions } from 'socket.io-client'

const encuestaHost = process.env.NEXT_PUBLIC_ENCUESTA_HOST
if (!encuestaHost) {
  throw new Error('Falta NEXT_PUBLIC_ENCUESTA_HOST')
}

/**
 * Definición local del tipo de Socket con nuestro objeto 'auth' tipado.
 */
export interface SocketWssCli extends Socket {
  auth: Pasaporte
}

/**
 * Conecta el socket al servidor de encuestas con el token que devuelve `solicitarAuth`. Stateless.
 * `opciones` pisa los defaults (por ejemplo `reconnection` para el dojo, que se reconecta solo).
 */
export async function handshake(auth: Pasaporte, opciones?: Partial<ManagerOptions & SocketOptions>) {
  return io(encuestaHost, {
    auth,
    autoConnect: false,
    reconnection: false,
    ...opciones,
  }) as SocketWssCli
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
    onConnectionError: (socket: SocketWssCli, error: Error) => void
    onDisconnect: (socket: SocketWssCli, reason: string) => void
  }
}) {
  const { onConnect, onConnectionError, onDisconnect } = listeners

  // En cualquier caso, le suscribimos unos handlers básicos
  sock.on('connect_error', (error) => onConnectionError(sock, error))
  sock.on('disconnect', (reason: string) => onDisconnect(sock, reason))
  sock.on('connect', () => onConnect(sock))
  sock.on('connect_timeout', (error) =>
    onConnectionError(sock, new Error(`Timeout al conectar con el servidor de encuestas: ${error.message}`))
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
}
