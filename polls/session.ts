import { randomUUID } from "crypto"
import { Socket } from "socket.io"
import { RolEncuesta } from "./encuestas"
import { closeWithError } from "./utils"
import jwt from 'jsonwebtoken'


// Cargamos la password maestra desde las variables de entorno. 
// Si no está seteada, tiramos un error para que no arranque el server.
const secret = process.env.NEXTAUTH_SECRET
if (!secret) {
  console.error("Error: NEXTAUTH_SECRET no está seteada.")
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

/** Autentica un JWT emitido por el servidor Next */
const login = async (socket: Socket) => {
  const token = socket.handshake.auth.token

  // Si no hay token, abrimos una sesión anónima (de estudiante)
  if (!token) { 
    openSession(socket, RolEncuesta.Estudiante, 'Anónimo')
    return
  }

  // Si hay token, lo verificamos
  try {
    const payload = jwt.verify(token, secret) as { exp: number, email: string, name?: string }

    // Verificar que el token no haya expirado
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return closeWithError(socket, 'Sesión expirada')
    }

    if (!payload) return closeWithError(socket, 'Token de autenticación inválido')
    if (!payload.email) return closeWithError(socket, 'Token de autenticación inválido. Falta email!')

    socket.data.user = {
      email: payload.email,
      name: payload.name,
    }

    openSession(socket, RolEncuesta.Admin, payload.email)

  } catch (err) {
    console.error('Error al verificar el token:', err)
    return closeWithError(socket, 'Token de autenticación inválido')
  }

}

/** Middleware de sesión */
export const conSession = (socket: Socket, next: () => void) => {
  const sessionId = socket.handshake.auth.sessionId

  // Si ya hay sesión, attacheamos la data al socket y seguimos
  if (sessionId) {
    const session = getSession(sessionId)
    if (session) {
      socket.data = { ...socket.data || {}, ...session }
      return next()
    }
  }

  login(socket)

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
