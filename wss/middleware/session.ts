import { randomUUID } from "crypto"
import { pick } from "remeda"
import { DefaultEventsMap, ExtendedError, Socket } from "socket.io"
import db from "../db"
import { nombreDeFantasia } from "../salas/app"
import { RolEncuesta } from "../tipos"
import { socketIp } from "../utils"
import { decodearTokenNextAuth, registradoComoAdmin } from "./auth"

// Sesión del server
export interface WssServerSession {
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

// Acá tipamos el socket con la data de sesión, dependiendo del rol

/** Socket que ya pasó por autenticación y tiene una sesión válida, tiene .session */
export type SocketConSesion = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, {
  session: WssServerSession
  [etc: string]: any
}>


// Funciones de manejo de sesiones en memoria - Pasar a redis?

const sessions = new Map<string, WssServerSession>()

const setSession = (sessionId: string, data: WssServerSession) => {
  sessions.set(sessionId, data)
}

const deleteSession = (sessionId: string) => {
  sessions.delete(sessionId)
}

const createSession = <T extends object>(data: T): T & { sessionId: string } => ({
  sessionId: randomUUID().split('-')[0],
  ...data
})

const openSession = <T extends { rol: RolEncuesta, nombre?: string }>(socket: Socket, payload: T) => {

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

// getSession es el único público 

/** Devuelve una sesión dado su sessionId, o undefined si no existe */
export const getSession = (sessionId: string) => {
  return sessions.get(sessionId)
}




/** 
 * Hace login al server de websockets.
 * 
 * Si hay token, autentica que sea emitido por el servidor Next y usa su info para abrir una sesión.
 * 
 * Si no hay token, abre una sesión anónima de estudiante.
 */
const login = async (socket: SocketConSesion) => {

  // Extraemos el auth del socket
  const auth = socket.handshake.auth

  // Vemos si hay token
  const token = auth.token

  if (!token) {
    // Si no hay token, abrimos una sesión anónima (de estudiante)
    console.log(`👤 Iniciando sesión anónima en la sala ${auth.idSala} desde IP ${socketIp(socket)}...`)

    // Para iniciar sesión como anónimo, tiene que proveer la sala a la que quiere unirse
    if (!auth.idSala) throw new Error('Clientes anónimos tienen que proveer sala en auth')

    // Verificamos que la sala exista
    const salaExiste = await db.hexists('salas', auth.idSala)

    // Si no existe bochamos
    if (!salaExiste) throw new Error(`La sala ${auth.idSala} no existe!`)

    // Por seguridad, el login anónimo es estricto, solo agregamos a la sesión la data que esperamos (nombre y icono)
    socket.data.sala = auth.idSala

    // Reemplazar por un schema de zod!
    openSession(socket, { rol: RolEncuesta.Estudiante, ...pick(auth, ['nombre', 'icono', 'dni']) })

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
    if (registradoComoAdmin(payload.email)) {
      openSession(socket, { rol: RolEncuesta.Admin, ...payload, nombre: payload.name, avatar: payload.image })
    } else {
      openSession(socket, { rol: RolEncuesta.Profe, ...payload, nombre: payload.name, avatar: payload.image })
    }
  }
}

const validarSession = async (socket: SocketConSesion) => {
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
export const conSession = async (socket: Socket, next: (err?: ExtendedError) => void) => {

  try {

    if (socket.handshake.auth.sessionId) {
      console.log('\n🔑 Validando sesión existente...')
      await validarSession(socket)
    } else {
      console.log('\n🔑 Efectuando login...')
      await login(socket)
    }

    next()

  } catch (err) {

    // Cómo tipar los errores que van entre wss y fe?
    err.data = {
      type: 'SessionError',
      action: 'clear_session', // Le decimos al cliente que porfa limpie la sesión
      message: err.message ?? 'Error de sesión'
    }

    next(err)
  }
}

