import { randomUUID } from 'crypto'
import { DefaultEventsMap, ExtendedError, Socket } from 'socket.io'
import db from '../db'
import { getSalaById } from '../salas/app'
import { RolEncuesta } from '../tipos'
import { socketIp } from '../utils'
import { Pasaporte, PasaporteSchema } from '../validators/auth'
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

/** Parsea (valida) y attachea la sesión al socket y la emite de inmediato al cliente */
const openSession = async <T extends Partial<Pasaporte>>(socket: Socket, payload: T) => {
  // Creamos el objeto (y lo validamos)
  const sessionData = WssServerSessionSchema.parse({
    ...payload,
    sessionId: randomUUID().split('-')[0],
    userIp: socketIp(socket),
    agente: socket.handshake.headers['user-agent'],
  }) as WssEstudianteSession // Workaround de TS para que entienda que puede tener campos de estudiante

  // La adjuntamos al socket
  socket.data.session = sessionData

  console.log(`🤝 Abriendo sesión ${sessionData.sessionId} para ${sessionData.nombre}`)

  // La emitimos al cliente
  socket.emit('session:opened', sessionData)
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

  if (!success)
    throw new Error(
      `Auth inválido: ${
        error ? error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') : 'error desconocido'
      }`
    )

  // Sesión de estudiante
  if (auth.rol === RolEncuesta.Estudiante) {
    console.log(`👤 Iniciando sesión anónima en la sala ${auth.idSala} desde IP ${socketIp(socket)}...`)

    // Verificamos que la sala exista
    if (!(await db.hexists('salas', auth.idSala))) throw new Error(`La sala ${auth.idSala} no existe!`)

    const sala = await getSalaById(auth.idSala)

    // Si la sala requiere dni y la sesión no lo tiene, bochamos
    if ((await sala.get()).config.pedir_dni && !auth.dni) throw new Error(`La sala ${auth.idSala} requiere dni!`)

    await openSession(socket, auth)
  }

  // Sesión de profe o admin
  else if (auth.rol === RolEncuesta.Profe || auth.rol === RolEncuesta.Admin) {
    // Si es profe o admin, necesitamos token
    console.log(`🪪  Iniciando sesión autenticada con usuario de google desde IP ${socketIp(socket)}...`)
    const payload = decodearTokenNextAuth(auth.token)

    // Si está en la lista de admins, lo tratamos como admin, sino como profe
    if (registradoComoAdmin(payload.email) && auth.rol === RolEncuesta.Admin) {
      await openSession(socket, { rol: RolEncuesta.Admin, ...payload, nombre: payload.name, avatar: payload.image })
    } else {
      await openSession(socket, { rol: RolEncuesta.Profe, ...payload, nombre: payload.name, avatar: payload.image })
    }
  }

  // Publico y test no establecen sesión y por lo tanto tampoco hacen login, se usa solo el auth del socket
  else {
    console.log(`👀 Cliente público conectado desde IP ${socketIp(socket)}...`)
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
    console.log('\n🔑 Conexión entrante efectuando login...')
    await login(socket)

    next()
  } catch (err) {
    // Cómo tipar los errores que van entre wss y fe?
    console.log(`@Error: `, err.message)
    err.data = {
      type: 'SessionError',
      action: 'clear_session', // Le decimos al cliente que porfa limpie la sesión
      message: err.message ?? 'Error de sesión',
    }

    next(err)
  }
}
