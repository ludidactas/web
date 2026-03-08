import { Pasaporte } from '@/wss/validators/auth'
import { WssServerSession } from '@/wss/validators/session'
import { io, Socket } from 'socket.io-client'
import { RazonExpiracion } from './wss-cli/conexion-wss'

if (!process.env.NEXT_PUBLIC_ENCUESTA_HOST) {
  throw new Error('Falta la dirección del host de websockets!')
}

/** Auth que espera el server de sockets */
export type SocketServerAuth = { sessionId?: string } & Pasaporte

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
    onSession: (socket: SocketWssCli, session: WssServerSession) => void
    onExpired: (socket: SocketWssCli, data: RazonExpiracion) => void
  }
}) {
  const { onConnect, onError, onDisconnect: onDisconect, onSession, onExpired } = listeners

  // En cualquier caso, le suscribimos unos handlers básicos
  sock.on('connect_error', (error) => onError(sock, error))
  sock.on('disconnect', (reason: string) => onDisconect(sock, reason))
  sock.on('connect', () => onConnect(sock))
  sock.on('connect_timeout', (error) =>
    onError(sock, new Error(`Timeout al conectar con el servidor de encuestas: ${error.message}`))
  )

  // Suscribimos a la sesión abierta y la persistimos
  sock.on('session:opened', (session) => onSession(sock, session))
  sock.on('session:expired', (razon) => onExpired(sock, razon))

  return sock
}

/**
 * Le pide al server de next, que es el que autentica con Google,
 * un token JWT para conectarse al server de encuestas. Stateless.
 */
export async function solicitarAuth() {
  console.log(`Obteniendo token de auth del server de next...`)
  const respuesta = await fetch('/api/auth/token', { credentials: 'include' })
  const payload = await respuesta.json()
  return payload.token as string
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
