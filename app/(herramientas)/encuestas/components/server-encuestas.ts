import { PollsServerSession } from "@/wss/session"
import { RolEncuesta } from "@/wss/tipos"
import { io, Socket } from "socket.io-client"

if (!process.env.NEXT_PUBLIC_ENCUESTA_HOST) {
  throw new Error('Falta la dirección del host de websockets!')
}

interface SocketServerTestAuth { 
  rol: RolEncuesta.Tester,
  url: string,
  nombre?: string
}

interface SocketServerProfeAuth { 
  rol: RolEncuesta.Profe,
  token: string,
}

interface SocketServerAnonAuth { 
  rol: RolEncuesta.Estudiante,
  idSala: string,
  nombre?: string,
  icono?: string
}

type SocketServerAdminAuth = SocketServerProfeAuth

/** Auth que espera el server de sockets */
export type SocketServerAuth = {sessionId?: string} & (SocketServerTestAuth | SocketServerProfeAuth | SocketServerAnonAuth)

/** Contiene los endpoints para cada rol */
export const conectar = {
  [RolEncuesta.Admin]: (auth: SocketServerAdminAuth) => io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}/polls/admin`, { auth, autoConnect: false, transports: ['websocket'] }),
  [RolEncuesta.Profe]: (auth: SocketServerProfeAuth) => io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}/polls/profe`, { auth, autoConnect: false, transports: ['websocket'] }),
  [RolEncuesta.Estudiante]: (auth: SocketServerAnonAuth) => io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}/polls/${auth.idSala}/estudiante`, { auth, autoConnect: false, transports: ['websocket'] }),
}

/** Conecta el socket al servidor de encuestas con el token que devuelve `solicitarAuth`. Stateless. */
export async function conectarSocket({ auth, listeners }: {
  auth: SocketServerAuth
  listeners: {
    onConnect: (socket: Socket) => void,
    onError: (socket: Socket, error: Error) => void,
    onDisconect: (socket: Socket, reason: string) => void
    onSession: (socket: Socket, session: PollsServerSession) => void
    onExpired: (socket: Socket) => void
  }
}) {

  const { onConnect, onError, onDisconect, onSession, onExpired } = listeners

  let sock: Socket
  if (auth.rol === RolEncuesta.Tester) {
    sock = io(auth.url, { auth: { rol: RolEncuesta.Tester }, autoConnect: false, transports: ['websocket'] })
  } else if (auth.rol === RolEncuesta.Profe) {
    sock = conectar[RolEncuesta.Profe](auth)
  } else if (auth.rol === RolEncuesta.Estudiante) {
    sock = conectar[RolEncuesta.Estudiante](auth)
  } else {
    sock = conectar[RolEncuesta.Admin](auth)
   }

  // En cualquier caso, le suscribimos unos handlers básicos
  sock.on('connect_error', error => {
    onError(sock, error)
  })
  sock.on('disconnect', (reason: string) => onDisconect(sock, reason))
  sock.on('connect', () => onConnect(sock))
  sock.on('connect_timeout', (error) => {
    console.error('Connection timeout:', error)
    onError(sock, new Error(`Timeout al conectar con el servidor de encuestas: ${error.message}`))
  })

  // Suscribimos a la sesión abierta y la persistimos
  sock.on('session:opened', session => onSession(sock, session))
  sock.on('session:expired', () => onExpired(sock))

  console.log(`Intentando conectar con auth`, auth)
  // Una vez que le suscribimos listeners, le mandamos mecha
  sock.connect()

  return sock
}

/** 
 * Le pide al server de next, que es el que autentica con Google,
 * un token JWT para conectarse al server de encuestas. Stateless.
 */
export async function solicitarAuth() {
  console.log(`Obteniendo token de auth del server de next...`)
  const respuesta = await fetch('/api/auth/token', { credentials: 'include'})
  const payload = await respuesta.json()
  return payload.token as string
}

export const limpiarListeners = (socket: Socket) => { 
  socket.off('connect_error')
  socket.off('disconnect')
  socket.off('connect')
  socket.off('connect_timeout')
  socket.off('session:opened')
  socket.off('session:expired')
}