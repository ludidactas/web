import { randomUUID } from "crypto"
import jwt from 'jsonwebtoken'
import { DefaultEventsMap, ExtendedError, Socket } from "socket.io"
import { pick } from "remeda"
import { RolEncuesta } from "./tipos"
import { ConfigSala, nombreDeFantasia, salas } from "./salas/app"

// Sesión del server
export interface PollsServerSession {
  rol: RolEncuesta
  sessionId: string
  userIp?: string
  email?: string
  nombre?: string // Nombre de google del profe o nombre arbitrario del estudiante
  agente?: string
  avatar?: string // Avatar de google del profe
  icono?: string // Icono arbitrario del estudiante
  dni?: string
}

export type SocketConSesion = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, {
  session: PollsServerSession
  [etc: string]: any
}>

export type SocketProfe = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, {
  session: PollsServerSession
  user: { email: string, nombre?: string, dni?:string }
  /** _Puede_ venir la config de la sala al momento de crearla */
  config_sala?: Partial<ConfigSala> 
}>

export type SocketEstudiante = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, {
  session: PollsServerSession
  /** ID de la sala a la que se conecta el estudiante */
  sala: string
}>


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
const decodearTokenNextAuth = (token: string) => {
  // Verificar que el token no haya expirado
  const payload = jwt.verify(token, secret) as { exp: number, email: string, name?: string, image?: string }

  if (!payload) throw new Error('Token de autenticación inválido')
  if (!payload.email) throw new Error('Token de autenticación inválido. Falta email!')
  if (!payload.exp) throw new Error('Token de autenticación inválido. Falta expiración!')
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Sesión expirada')

  return payload
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

export const createSession = <T extends object>(data: T): T & { sessionId: string } => ({
  sessionId: randomUUID().split('-')[0],
  ...data
})

export const openSession = <T extends { rol: RolEncuesta, nombre?: string }>(socket: Socket, payload: T) => {

  const nombre = payload.nombre ?? nombreDeFantasia()

  // Creamos el objeto - Ojo que le estoy agregando info arbitraria que venga en el data
  const session = createSession({
    ...payload,
    nombre,
    userIp: socketIp(socket),
    agente: socket.handshake.headers['user-agent']
  })

  // Guardamos la sesión
  setSession(session.sessionId, session)

  // La adjuntamos al socket
  socket.data.session = session

  console.log(`🤝 Abriendo sesión ${session.sessionId} para ${nombre}`)

  // La emitimos al cliente
  socket.emit("session:opened", session)
}


/** 
 * Hace login al server de websockets.
 * 
 * Si hay token, autentica que sea emitido por el servidor Next y usa su info para abrir una sesión.
 * 
 * Si no hay token, abre una sesión anónima de estudiante.
 */
const login = (socket: SocketConSesion) => {
  const token = socket.handshake.auth.token

  if (!token) {
    // Si no hay token, abrimos una sesión anónima (de estudiante)
    console.log(`👤 Iniciando sesión anónima en la sala ${socket.handshake.auth.idSala} desde IP ${socketIp(socket)}...`)

    // Para iniciar sesión como anónimo, tiene que proveer la sala a la que quiere unirse
    if (!socket.handshake.auth.idSala) throw new Error('Clientes anónimos tienen que proveer sala en auth')

    // Verificamos que la sala exista - Dependencia de salas!
    if (!salas.has(socket.handshake.auth.idSala)) throw new Error(`La sala ${socket.handshake.auth.idSala} no existe!`)

    // Por seguridad, el login anónimo es estricto, solo agregamos a la sesión data que esperamos (nombre y icono)
    socket.data.sala = socket.handshake.auth.idSala
    openSession(socket, { rol: RolEncuesta.Estudiante, ...pick(socket.handshake.auth, ['nombre', 'icono', 'dni']) })

  } else {

    // Si hay token, lo verificamos
    console.log(`🪪  Iniciando sesión autenticada con usuario de google desde IP ${socketIp(socket)}...`)
    const payload = decodearTokenNextAuth(token)

    // Le seteamos al user el email y el nombre del token emitido por next
    socket.data.user = {
      email: payload.email,
      nombre: payload.name ?? 'Sin nombre',
    }

    // Si está en la lista de admins, lo tratamos como admin, sino como profe
    if (ADMINS.includes(payload.email)) {
      openSession(socket, { rol: RolEncuesta.Admin, ...payload, nombre: payload.name, avatar: payload.image })
    } else {
      openSession(socket, { rol: RolEncuesta.Profe, ...payload, nombre: payload.name, avatar: payload.image })
    }

  }


}

const validarSession = (socket: SocketConSesion) => {
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
    if (rolSolicitado === RolEncuesta.Estudiante) {

      // Llegados a este punto tenemos un estudiante anónimo válido
      console.log(`🔄 Reutilizando sesión ${sessionId} para ${session?.nombre} (${session?.rol}) desde IP ${socketIp(socket)}`)

      // Le attacheamos al socket la data de sesión
      socket.data = { ...socket.data || {}, session }

      return
    }

    // Sesión de profe o admin
    if (session.rol === RolEncuesta.Profe || session.rol === RolEncuesta.Admin) {

      // Si es profe o admin y no hay token, bochamos
      if (!token) throw new Error(`Se requiere un token de autenticación para conectarse como profe o admin`)

      const payload = decodearTokenNextAuth(token)

      // Si el username de sesión no coincide con el email del token, bochamos
      if (session.email !== payload.email) throw new Error(`Sesión ${sessionId} no válida para el usuario ${payload.email}!`)

      // Llegados a este punto tenemos un profe o admin válido
      console.log(`🔄 Reutilizando sesión ${sessionId} para ${session?.nombre} (${session?.rol}) desde IP ${socketIp(socket)}`)

      // Le attacheamos al socket la data de sesión
      socket.data = { ...socket.data || {}, session, user: pick(session, ['email', 'nombre']) }

      return
    }

  } catch (err: any) {
    // Si hubo un error, cerramos la sesión y emitimos el error
    console.log(`⛔ Revocando sesión! Causa: ${err.message || 'Error de sesión'}`)
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
      type: 'SessionError',
      action: 'clear_session', // Le decimos al cliente que porfa limpie la sesión
      message: err.message ?? 'Error de sesión'
    }

    next(err)
  }
}

export const esAdmin = (socket: SocketConSesion, next: (err?: ExtendedError) => void) => {
  if (socket.data.session.rol !== RolEncuesta.Admin)
    next(new Error('Acción solo permitida para administradores'))
  next()
}


export const esProfe = (socket: SocketConSesion, next: (err?: ExtendedError) => void) => {
  if (socket.data.session.rol !== RolEncuesta.Profe && socket.data.session.rol !== RolEncuesta.Admin)
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
