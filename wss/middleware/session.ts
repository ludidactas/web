import { DefaultEventsMap, ExtendedError, Socket } from 'socket.io'
import { z } from 'zod'
import { Salas } from '../salas/app'
import { socketIp } from '../utils'
import { MetodosLogin, PasaporteSchema, RolSala } from '../validators/auth'
import { ErrorSesion, TipoErrorSesion } from '../validators/errors'
import { SESSION_ESTUDIANTE_POR_ESQUEMA, WssServerSession, WssServerSessionSchema } from '../validators/session'
import { AuthGoogle, decodearTokenNextAuth, registradoComoAdmin, verificarYAutorizar } from './auth'

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

/** Lanza un ErrorSesion legible si el parseo de zod falla, sino devuelve la data tipada. */
const parsearAuth = <S extends z.ZodTypeAny>(schema: S, raw: unknown): z.infer<S> => {
  const { data, error, success } = schema.safeParse(raw)
  if (!success)
    throw new ErrorSesion(
      TipoErrorSesion.AuthInvalido,
      `Auth inválido: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
    )
  return data
}

/** Parsea un payload contra un schema de sesión, agregándole los campos del server (ip, agente). */
const parsearSesion = <S extends z.ZodTypeAny>(
  socket: Socket,
  schema: S,
  payload: Record<string, unknown>
): z.infer<S> =>
  parsearAuth(schema, {
    ...payload,
    userIp: socketIp(socket),
    agente: socket.handshake.headers['user-agent'],
  })

/** Attachea la sesión al socket y la emite de inmediato al cliente. */
const abrirSesion = (socket: Socket, sessionData: WssServerSession) => {
  socket.data.session = sessionData
  console.log(`🤝 Abriendo sesión para ${sessionData.userId}`)
  socket.emit('session:opened', sessionData)
}

/**
 * Hace login al server de websockets.
 * - Determina el rol del pasaporte.
 * - Si es estudiante: la sala decide el esquema de auth. Construimos la sesión contra el schema de ese
 *   esquema (inyectando el `metodo`, que el FE no manda), la verificamos contra la config (dni en
 *   lista, nombre libre) y la abrimos. El `userId` lo resuelve el transform del schema, sin adivinar.
 * - Si es profe o admin: validamos el token de Next y usamos su info para abrir la sesión.
 * - Público no establece sesión.
 */
const login = async (socket: SocketConSesion) => {
  // const { auth } = socket.handshake

  // Determinamos el rol.
  const auth = parsearAuth(PasaporteSchema, socket.handshake.auth)

  // Sesión de estudiante -- consultamos la config de la sala para autorizar.
  if (auth.rol === RolSala.Estudiante) {
    // Verificamos que la sala exista -- si no existe tira un error:
    await Salas.assertExiste(auth.idSala)

    const sala = await Salas.get(auth.idSala)

    const config = await sala.config()
    // Para auth de google, decodeamos el token a datos de usuario (la identidad es el email).
    let datosGoogle: AuthGoogle | undefined
    if (config.esquema === MetodosLogin.Google) {
      datosGoogle = decodearTokenNextAuth(auth.token)
    }

    const session = parsearSesion(socket, SESSION_ESTUDIANTE_POR_ESQUEMA[config.esquema], {
      ...auth,
      ...datosGoogle,
      metodo: config.esquema,
    })

    // Verificamos la sesión contra la config de la sala (dni en lista, nombre libre, etc.)
    await verificarYAutorizar(session, sala)

    console.log(`👤 Iniciando sesión en la sala ${auth.idSala} desde IP ${socketIp(socket)}...`)
    abrirSesion(socket, session)
  }

  // Sesión de profe o admin
  else if (auth.rol === RolSala.Profe || auth.rol === RolSala.Admin) {
    const payload = decodearTokenNextAuth(auth.token)

    // Si está en la lista de admins, lo tratamos como admin, sino como profe
    const rolFinal = registradoComoAdmin(payload.email) && auth.rol === RolSala.Admin ? RolSala.Admin : RolSala.Profe
    const session = parsearSesion(socket, WssServerSessionSchema, {
      rol: rolFinal,
      ...payload,
    })

    console.log(`🪪  Iniciando sesión autenticada con usuario de google desde IP ${socketIp(socket)}...`)
    abrirSesion(socket, session)
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
    console.log(`@conSession Error: `, err.message, 'con socketdata al momento: ', socket.data)
    err.data = {
      type: err instanceof ErrorSesion ? err.tipo : 'SessionError',
      message: err.message ?? 'Error de sesión',
    }
    next(err)
  }
}
