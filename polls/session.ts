import { randomUUID } from "crypto"
import jwt from 'jsonwebtoken'
import { ExtendedError, Socket } from "socket.io"
import { RolEncuesta } from "./encuestas"
import { salas } from "./polls"


// Cargamos el secret para decodear los JWT y la lista de admins desde las variables de entorno. 
// Si no está seteada, tiramos un error para que no arranque el server.
const secret = process.env.NEXTAUTH_SECRET
const ADMINS = process.env.POLLS_ADMINS?.split(',').map(email => email.trim())
if (!secret || !ADMINS) {
  console.error("Error: NEXTAUTH_SECRET o POLLS_ADMINS no están seteadas.")
  process.exit(1)
}

/**
 * Decodea un token emitido por nuestro server de Next, que es el que autentica al usuario con google.
 * @param token 
 * @returns { exp: number, email: string, name?: string }
 */
const decodearTokenNextAuth = (socket: Socket, token: string) => {
  // Verificar que el token no haya expirado
  const payload = jwt.verify(token, secret) as { exp: number, email: string, name?: string }

  if (!payload) throw new Error('Token de autenticación inválido')
  if (!payload.email) throw new Error('Token de autenticación inválido. Falta email!')
  if (!payload.exp) throw new Error('Token de autenticación inválido. Falta expiración!')
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Sesión expirada')

  return payload
}


// Payload de login
export interface AuthData {
  username: string
  rol: RolEncuesta
  password?: string
}

// Sesión del server
export interface PollsServerSession {
  sessionId: string
  userIp: string
  username: string // Email del profe o nombre arbitrario del estudianteß
  rol: RolEncuesta
}

const sessions = new Map<string, PollsServerSession>()

export const getSession = (sessionId: string) => {
  return sessions.get(sessionId)
}

export const setSession = (sessionId: string, data: PollsServerSession) => {
  sessions.set(sessionId, data)
}

export const deleteSession = (sessionId: string) => {
  sessions.delete(sessionId)
}

export const createSession = (socket: Socket, rol: RolEncuesta, username: string): PollsServerSession => ({
  sessionId: randomUUID(),
  userIp: socketIp(socket),
  rol,
  username,
})

export const openSession = (socket: Socket, rol: RolEncuesta, username: string) => {

  // Creamos el objeto - Ojo que le estoy agregando info arbitraria que venga en el data
  const session = { ...socket.data || {}, ...createSession(socket, rol, username) }

  // Guardamos la sesión
  setSession(session.sessionId, session)

  // La adjuntamos al socket
  socket.data = session

  // La emitimos al cliente
  socket.emit("session:opened", session)
}


/** 
 * Hace login al server de websockets
 * 
 * Si hay token, autentica que sea emitido por el servidor Next y usa su info para abrir una sesión.
 * 
 * Si no hay token, abre una sesión anónima de estudiante.
 */
const login = (socket: Socket) => {
  const token = socket.handshake.auth.token

  // Si no hay token, abrimos una sesión anónima (de estudiante)
  if (!token) {
    console.log(`Iniciando sesión anónima en la sala ${socket.handshake.auth.idSala} desde IP ${socketIp(socket)}`)

    // Para iniciar sesión como anónimo, tiene que proveer la sala a la que quiere unirse
    if (!socket.handshake.auth.idSala) throw new Error('Clientes anónimos tienen que proveer sala en auth')

    // Verificamos que la sala exista
    if (!salas.has(socket.handshake.auth.idSala)) throw new Error(`La sala ${socket.handshake.auth.idSala} no existe!`)
    
    socket.data.sala = socket.handshake.auth.idSala
    openSession(socket, RolEncuesta.Estudiante, 'Anónimo') // Acá podría crearle un nombre aleatorio

    return
  }

  // Si hay token, lo verificamos
  console.log(`Verificando token desde IP ${socketIp(socket)}`)
  const payload = decodearTokenNextAuth(socket, token)

  // Le seteamos al user el email y el nombre del token emitido por next
  socket.data.user = {
    email: payload.email,
    name: payload.name,
  }

  // Si está en la lista de admins, lo tratamos como admin, sino como profe
  if (ADMINS.includes(payload.email)) {
    openSession(socket, RolEncuesta.Admin, payload.email)
  } else {
    openSession(socket, RolEncuesta.Profe, payload.email)
  }

}

const validarSession = (socket: Socket) => {
  // Si estamos acá, es porque socket.handshake.auth.sessionId está definido
  const { sessionId, token, rol: rolSolicitado } = socket.handshake.auth

  try {

    // Puede venir:
    // - solo sessionId, si es un estudiante anónimo
    // - solo token de autenticación, si es profe o admin
    // - ambos, si es profesor o admin con sesión existente

    const session = getSession(sessionId)

    // Si el id que nos mandaron no coincide con el de la sesión, bochamos
    if (!session) throw new Error(`Sesión ${sessionId} no encontrada!`)

    // Sesión de estudiante (anónima)
    // Válida para profes o admins si están solicitando entrar como estudiantes
    if (rolSolicitado === RolEncuesta.Estudiante && session.rol === RolEncuesta.Estudiante) {

      // Llegados a este punto tenemos un estudiante anónimo válido
      console.log(`Reutilizando sesión ${sessionId} para ${session?.username} (${session?.rol}) desde IP ${socketIp(socket)}`)

      // Le attacheamos al socket la data de sesión
      socket.data = { ...socket.data || {}, ...session }
    }

    // Sesión de profe o admin
    if (session.rol === RolEncuesta.Profe || session.rol === RolEncuesta.Admin) {

      // Si es profe o admin y no hay token, bochamos
      if (!token) throw new Error(`Se requiere un token de autenticación para conectarse como profe o admin`)

      const payload = decodearTokenNextAuth(socket, token)

      // Si el username de sesión no coincide con el email del token, bochamos
      if (session.username !== payload.email) throw new Error(`Sesión ${sessionId} no válida para el usuario ${payload.email}!`)

      // Llegados a este punto tenemos un profe o admin válido
      console.log(`Reutilizando sesión ${sessionId} para ${session?.username} (${session?.rol}) desde IP ${socketIp(socket)}`)

      // Le attacheamos al socket la data de sesión
      socket.data = { ...socket.data || {}, ...session }
    }

  } catch (err: any) {
    // Si hubo un error, cerramos la sesión y emitimos el error
    console.log(`Sesión expirando! Error al validar sesión: ${err.message || 'Error de sesión'}`)
    // socket.emit('session:expired', { message: err.message || 'Error de sesión' })
    deleteSession(sessionId)
    throw err
  }
}

/** 
 * Middleware de sesión 
 * 
 * Las sesiones de estudiante son durables y anónimas.
 * Las sesiones de profe requieren token y caducan. 
 */
export const conSession = (socket: Socket, next: (err?: ExtendedError) => void) => {

  try {

    if (socket.handshake.auth.sessionId) {
      validarSession(socket)
    } else {
      login(socket)
    }

    next()

  } catch (err) {

    err.data = {
      type: 'session_error',
      action: 'clear_session', // Le decimos al cliente que porfa limpie la sesión
      message: err.message ?? 'Error de sesión'
    }

    next(err)
  }
}

export const esAdmin = (socket: Socket, next: (err?: ExtendedError) => void) => {
  if (socket.data.rol !== RolEncuesta.Admin)
    next(new Error('Acción solo permitida para administradores'))
  next()
}


export const esProfe = (socket: Socket, next: (err?: ExtendedError) => void) => {
  if (socket.data.rol !== RolEncuesta.Profe && socket.data.rol !== RolEncuesta.Admin)
    next(new Error('Acción solo permitida para profes'))
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
