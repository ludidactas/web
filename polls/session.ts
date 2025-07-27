import { randomUUID } from "crypto"
import { Socket } from "socket.io"
import { RolEncuesta } from "./encuestas"
import { closeWithError } from "./utils"

// Cargamos la password maestra desde las variables de entorno. 
// Si no está seteada, tiramos un error para que no arranque el server.
const masterPwd = process.env.POLLS_ADMIN_PASS
if (!masterPwd) {
  console.error("Error: POLLS_ADMIN_PASS no está seteada.")
  process.exit(1)
}

// Payload de login
export interface AuthData {
  username: string
  rol: RolEncuesta
  password?: string
}

// Sesión del server
export interface PollsSession {
  userId: string
  sessionId: string
  userIp: string
  username: string
  rol: RolEncuesta
}

const sessions = new Map<string, PollsSession>()

export const getSession = (sessionId: string) => {
  return sessions.get(sessionId)
}

export const setSession = (sessionId: string, data: PollsSession) => {
  sessions.set(sessionId, data)
}

export const deleteSession = (sessionId: string) => {
  sessions.delete(sessionId)
}

export const createSession = (socket: Socket, rol: RolEncuesta, username: string): PollsSession => ({
  userId: randomUUID(),
  sessionId: randomUUID(),
  userIp: socketIp(socket),
  rol,
  username,
})

export const openSession = (socket: Socket, rol: RolEncuesta, username: string) => {

  // Creamos el objeto
  const session = createSession(socket, rol, username)

  // Guardamos la sesión
  setSession(session.sessionId, session)

  // La adjuntamos al socket
  socket.data = { ...socket.data || {}, ...session }

  // La emitimos al cliente
  socket.emit("session:opened", session)
}

const login = (socket: Socket) => {
  const authData = socket.handshake.auth

  console.log(`Efectuando login con `, authData)

  // Admin
  if (authData.rol === RolEncuesta.Admin) {
    if (!authData.password) closeWithError(socket, 'Contraseña maestra requerida para rol Admin')
    if (authData.password !== process.env.NEXT_PUBLIC_ENCUESTA_PWD) closeWithError(socket, 'Contraseña maestra incorrecta')
    openSession(socket, RolEncuesta.Admin, authData.username || 'Admin')
  }

  // Estudiante
  else if (authData.rol === RolEncuesta.Estudiante) {
    openSession(socket, RolEncuesta.Estudiante, authData.username || 'Anónimo')
  }

}

/** Middleware de sesión */
export const conSession = (socket: Socket, next: () => void) => {
  const sessionId = socket.handshake.auth.sessionId

  console.log(`Se conectó alguien ${sessionId ? `con sesión ${sessionId}` : 'sin sesión'}`)

  // Si ya hay sesión, attacheamos la data al socket y seguimos
  if (sessionId) {
    const session = getSession(sessionId)
    if (session) {
      socket.data = { ...socket.data || {}, ...session }
      return next()
    }
  }

  login(socket)

  console.log(`Sesión abierta! Derivando al canal...`)

  next()
}

export const esAdmin = (socket: Socket, next: () => void) => { 
  if (socket.data.rol !== RolEncuesta.Admin)
    return closeWithError(socket, 'Acción solo permitida para administradores')
  next()
}

/** 
 * Función para extraer el IP del socket
 */
export function socketIp(socket: Socket) {
  // En prod usamos el IP forwardeado por nginx
  const forwarded = socket.handshake.headers['x-forwarded-for']
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : socket.handshake.address

  return ip
}
