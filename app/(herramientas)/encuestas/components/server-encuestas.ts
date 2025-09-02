import { PollsServerSession } from "@/wss/session"
import { RolEncuesta } from "@/wss/tipos"
// import { setupSocketLogging } from "@/polls/test/test-funcs"
import { io, Socket } from "socket.io-client"

if (!process.env.NEXT_PUBLIC_ENCUESTA_HOST) {
  throw new Error('Falta la dirección del host de websockets!')
}

/** Auth que espera el server de sockets */
export interface SocketServerAuth {
  // Rol con el que se conecta
  rol: RolEncuesta
  // Token JWT que devuelve el server de next
  token?: string
  // Nombre que den en la ui
  nombre?: string
  // El email para profes y admins, el idSala de la url para estudiantes
  idSala?: string
  // Session ID para reutilizar una sesión existente
  sessionId?: string
}

/** Contiene los endpoints para cada rol */
export const conectar = {
  [RolEncuesta.Tester]: (auth: SocketServerAuth) => io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}/test`, { auth, autoConnect: false, transports: ['websocket'] }),
  [RolEncuesta.Admin]: (auth: SocketServerAuth) => io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}/polls/admin`, { auth, autoConnect: false, transports: ['websocket'] }),
  [RolEncuesta.Profe]: (auth: SocketServerAuth) => io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}/polls/profe`, { auth, autoConnect: false, transports: ['websocket'] }),
  [RolEncuesta.Estudiante]: (auth: SocketServerAuth) => io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}/polls/${auth.idSala}/estudiante`, { auth, autoConnect: false, transports: ['websocket'] }),
}

/** Conecta el socket al servidor de encuestas con el token que devuelve `solicitarAuth`. Stateless. */
export async function conectarSocket({ auth, listeners }: {
  auth: {
    test?: boolean,
    url?: string,
    /** Sesión del localStorage emitida por el server de ws */
    sessionId?: string,
    /** Token de autenticación de sesión de google en next */
    token?: string,
    /** Id de sala para conectarse como usuario no-logueado */
    idSala?: string
    /** Rol al que conectar... dependiendo de esto se requiere token o idSala */
    rol: RolEncuesta
    /** Opcionalmente puede attachear un nombre custom */
    nombre?: string
  },
  listeners: {
    onConnect: (socket: Socket) => void,
    onError: (socket: Socket, error: Error) => void,
    onDisconect: (socket: Socket, reason: string) => void
    onSession: (socket: Socket, session: PollsServerSession) => void
    onExpired: (socket: Socket) => void
  }
}) {

  const { sessionId, token, rol, idSala, nombre, test, url } = auth
  const { onConnect, onError, onDisconect, onSession, onExpired } = listeners

  let sock
  if (test) {
    console.log(`Creando socket: Conectando en modo test...`)
    sock = io(url, { auth: { rol: RolEncuesta.Tester }, autoConnect: false, transports: ['websocket'] })

  } else if (sessionId) {
    // Si hay una sesión guardada, la reutilizamos
    console.log(`Creando socket: Reestableciendo sesión ${sessionId} con el servidor de encuestas como ${rol}...`)
    if (rol === RolEncuesta.Estudiante && !idSala)
      throw new Error(`Se requiere un idSala para conectarse como estudiante al servidor de encuestas`)
    // Conectamos el socket con sessionId
    sock = conectar[rol]({ token, sessionId, rol, idSala })

  } else {
    // Sino, creamos una nueva sesión usando el token que nos dió next
    console.log(`Creando socket: Iniciando nueva sesión el server de encuestas como ${rol}...`)
    // if (!token) throw new Error(`Se require una sesión de Google para conectarse al servidor de encuestas`)
    sock = conectar[rol]({ token, nombre, rol, idSala })
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