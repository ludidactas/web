import { randomUUID } from 'crypto'
import { DefaultEventsMap, ExtendedError, Socket } from 'socket.io'
import db from '../db'
import { nombreDeFantasia } from '../salas/utils'
import { RolEncuesta } from '../tipos'
import { socketIp } from '../utils'
import { Pasaporte, PasaporteSchema, SesionSchema } from '../validators/auth'
import { WssEstudianteSession, WssServerSession, WssServerSessionSchema } from '../validators/session'
import { decodearTokenNextAuth, registradoComoAdmin } from './auth'

// Acá tipamos el socket con la data de sesión, dependiendo del rol

/** Socket que ya pasó por autenticación y tiene una sesión válida, tiene .session */
export type SocketConSesion = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  {
    session: WssServerSession
  }
>

// Funciones de manejo de sesiones en memoria - Pasar a redis?

const sessions = new Map<string, WssServerSession>()

/** Abre la sesión en el storage, la attachea al socket y la emite de inmediato al cliente */
const openSession = <T extends Partial<Pasaporte>>(socket: Socket, payload: T) => {
  // Creamos el objeto (y lo validamos)
  const sessionData = WssServerSessionSchema.parse({
    ...payload,
    sessionId: randomUUID().split('-')[0],
    userIp: socketIp(socket),
    agente: socket.handshake.headers['user-agent'],
  }) as WssEstudianteSession // Workaround de TS para que entienda que puede tener campos de estudiante

  // Caso especial anónimos:
  // Si es estudiante y no tiene id (es decir, si el pasaporte llegó sin dni ni email ni nombre), le asignamos un nombre de fantasía y el sessionId como id
  if (payload.rol === RolEncuesta.Estudiante && !sessionData.id) {
    sessionData.nombre = nombreDeFantasia()
    sessionData.id = sessionData.sessionId
  }

  // Guardamos la sesión
  sessions.set(sessionData.sessionId, sessionData)

  // La adjuntamos al socket
  socket.data.session = sessionData

  console.log(`🤝 Abriendo sesión ${sessionData.sessionId} para ${sessionData.nombre}`)

  // La emitimos al cliente
  socket.emit('session:opened', sessionData)
}

// getSession es el único público

/** Devuelve una sesión dado su sessionId, o undefined si no existe */
export const getSession = (sessionId: string) => {
  return sessions.get(sessionId)
}

/**
 * Hace login al server de websockets.
 * - Valida el auth del socket
 * - Abre una sesión acorde al rol
 *  - Si es estudiante, verifica que la sala exista y abre una sesión anónima.
 * - Si es profe o admin:
 *  - Valida el token, autentica que sea emitido por el servidor Next y usa su info para abrir una sesión.
 * - Adjunta la sesión al socket
 */
const login = async (socket: SocketConSesion) => {
  // Extraemos el auth del socket y lo validamos
  const { data: auth, error, success } = PasaporteSchema.safeParse(socket.handshake.auth)

  if (!success) throw new Error(`Auth inválido: ${error ? error.message : 'error desconocido'}`)

  // Sesión de estudiante
  if (auth.rol === RolEncuesta.Estudiante) {
    console.log(`👤 Iniciando sesión anónima en la sala ${auth.idSala} desde IP ${socketIp(socket)}...`)

    // Verificamos que la sala exista
    if (!(await db.hexists('salas', auth.idSala))) throw new Error(`La sala ${auth.idSala} no existe!`)

    openSession(socket, { ...auth, id: auth.dni || auth.email || auth.nombre }) // Si no tiene dni, usamos el nombre como id
  }

  // Sesión de profe o admin
  if (auth.rol === RolEncuesta.Profe || auth.rol === RolEncuesta.Admin) {
    // Si es profe o admin, necesitamos token
    console.log(`🪪  Iniciando sesión autenticada con usuario de google desde IP ${socketIp(socket)}...`)
    const payload = decodearTokenNextAuth(auth.token)

    // Si está en la lista de admins, lo tratamos como admin, sino como profe
    if (registradoComoAdmin(payload.email) && auth.rol === RolEncuesta.Admin) {
      openSession(socket, { rol: RolEncuesta.Admin, ...payload, nombre: payload.name, avatar: payload.image })
    } else {
      openSession(socket, { rol: RolEncuesta.Profe, ...payload, nombre: payload.name, avatar: payload.image })
    }
  }

  // Publico y test no establecen sesión y por lo tanto tampoco hacen login
}

const validarSession = async (socket: SocketConSesion) => {
  // Si estamos acá, es porque socket.handshake.auth.sessionId está definido

  const { data: sessionData, success, error } = SesionSchema.safeParse(socket.handshake.auth)

  if (!success) throw new Error(`Sesión inválida: ${error ? error.message : 'error desconocido'}`)

  try {
    // Puede venir:
    // - solo sessionId, si es un estudiante anónimo
    // - solo token de autenticación, si es profe o admin
    // - ambos, si es profesor o admin con sesión existente

    const session = getSession(sessionData.sessionId)

    // Si el id que nos mandaron no coincide con el de la sesión, bochamos
    if (!session) throw new Error(`Sesión ${sessionData.sessionId} no encontrada!`)

    console.log(
      `🔄 Reutilizando sesión para ${session?.nombre ?? session.email ?? session.sessionId} (${
        session?.rol
      }) desde IP ${socketIp(socket)}`
    )

    // Sesión de estudiante (anónima)
    // Válida para profes o admins si están solicitando entrar como estudiantes
    if (sessionData.rol === RolEncuesta.Estudiante) {
      // Verificamos que la sala siga existiendo
      if (!(await db.hexists('salas', sessionData.idSala)))
        throw new Error(`La sala ${sessionData.idSala} ya no existe!`)
      // Le attacheamos al socket la data de sesión
      socket.data.session = session
      return
    }

    // Pasado este punto nos aseguramos que el rol que viene en la sesión coincida con el de la sesión guardada
    if (sessionData.rol !== session.rol)
      throw new Error(`Rol de sesión inválido: se esperaba ${session.rol} y se recibió ${sessionData.rol}`)

    // Sesión de profe o admin
    if (session.rol === RolEncuesta.Profe || session.rol === RolEncuesta.Admin) {
      // Extraemos la data del token
      const payload = decodearTokenNextAuth(sessionData.token)

      // Si el username de sesión no coincide con el email del token, bochamos
      if (session.email !== payload.email)
        throw new Error(`Sesión ${session.sessionId} no válida para el usuario ${payload.email}!`)

      // Le attacheamos al socket la data de sesión
      socket.data.session = session
    }
  } catch (err: any) {
    // Si hubo un error, cerramos la sesión y emitimos el error
    console.log(`⛔ Revocando sesión! Causa: ${err.message || 'Error de sesión'}`)
    sessions.delete(sessionData.sessionId)
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
      // Si el socket trae sessionId, validamos la sesión existente
      console.log('\n🔑 Conexión entrante con sesión existente...')
      await validarSession(socket)
    } else {
      // Si no, login
      console.log('\n🔑 Conexión entrante efectuando login...')
      await login(socket)
    }

    next()
  } catch (err) {
    // Cómo tipar los errores que van entre wss y fe?
    err.data = {
      type: 'SessionError',
      action: 'clear_session', // Le decimos al cliente que porfa limpie la sesión
      message: err.message ?? 'Error de sesión',
    }

    next(err)
  }
}
