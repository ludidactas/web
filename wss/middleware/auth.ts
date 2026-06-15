import jwt from 'jsonwebtoken'
import { isDefined } from 'remeda'
import { ExtendedError } from 'socket.io'
import db from '../redis'
import { Sala, SalaData } from '../salas/app'
import { MetodosLogin, RolSala } from '../validators/auth'
import { ErrorSesion, TipoErrorSesion } from '../validators/errors'
import { WssEstudianteSession } from '../validators/session'
import { SocketConSesion } from './session'

// Cargamos el secret para decodear los JWT y la lista de admins desde las variables de entorno.
// Si no está seteada, tiramos un error para que no arranque el server.
const secret = process.env.NEXTAUTH_SECRET
const ADMINS = process.env.POLLS_ADMINS?.split(',').map((email) => email.trim())
if (!secret || !ADMINS) {
  console.error('Error: NEXTAUTH_SECRET o POLLS_ADMINS no están seteadas.')
  process.exit(1)
}

/** Data que devuelve el server de Next cuando sella el token */
interface NextAuth {
  exp: number
  email: string
  name?: string
  image?: string
}

/**
 * Autenticación.
 * Decodea un token emitido por nuestro server de Next, que es el que autentica al usuario con google.
 * @param token presentado por el frontend previamente obtenido desde next, que lo firma para que sepamos que es legítimo, y que contiene datos de usuario de google.
 * @returns { exp: number, email: string, name?: string } payload del token, con email y fecha de expiración y opcionalmente nombre e imagen (de google).
 */
export const decodearTokenNextAuth = (token?: string) => {
  if (!isDefined(token)) throw new ErrorSesion(TipoErrorSesion.AuthInvalido, `Falta token de Google!`)

  // Verificar que el token no haya expirado
  const payload = jwt.verify(token, secret, { audience: 'wss-client', algorithms: ['HS256'] }) as NextAuth

  if (!payload) throw new ErrorSesion(TipoErrorSesion.AuthInvalido, 'Token de autenticación inválido')
  if (!payload.email)
    throw new ErrorSesion(TipoErrorSesion.AuthInvalido, 'Token de autenticación inválido. Falta email!')

  return { email: payload.email, nombre: payload.name, avatar: payload.image }
}

export type AuthGoogle = ReturnType<typeof decodearTokenNextAuth>

/** Verifica si un email está registrado en la lista de admins del .env */
export const registradoComoAdmin = (email: string) => {
  return ADMINS.includes(email)
}

// --

export const conPermisosDeSala = async (socket: SocketConSesion, next: (err?: ExtendedError) => void) => {
  const session = socket.data.session
  if (session.rol === RolSala.Estudiante) conPermisosDe(session.idSala)(socket, next)
}

/**
 * Autorización del canal de estudiantes.
 *
 * La autenticación contra el esquema de la sala (dni en lista, nombre libre, etc.) ya ocurrió en
 * `login` vía `verificarYAutorizar`. Acá solo guardamos el canal por rol.
 */
export const conPermisosDe =
  (salaId: string) => async (socket: SocketConSesion, next: (err?: ExtendedError) => void) => {
    // Si estamos acá, la existencia de la sala ya fue verificada en `login` o `validarSession`
    const sala = await db.hget('salas', salaId)
    if (!sala) return next(new Error(`La sala ${salaId} no existe!`))

    // Parseamos la configuración de la sala (solo para validar que sea legible)
    try {
      JSON.parse(sala) as SalaData
    } catch {
      return next(new Error(`No se pudo parsear la configuración de la sala ${salaId}`))
    }

    // Si admin, puede entrar
    if (socket.data.session.rol === RolSala.Admin) return next()

    // Si es profe, no puede entrar por acá (canal de estudiantes), precisa en cambio abrir una sesión de estudiante
    if (socket.data.session.rol === RolSala.Profe)
      return next(new Error(`Los profes no pueden entrar como estudiantes`))

    // Los estudiantes ya fueron autenticados contra el esquema de la sala en el login
    next()
  }

/**
 * Verifica una sesión de estudiante ya construida contra las políticas de la sala.
 * El `metodo` de la sesión coincide con `config.esquema` (lo inyectó el login), y el `userId` ya
 * está resuelto al campo de identidad del esquema.
 */
export async function verificarYAutorizar(session: WssEstudianteSession, sala: Sala) {
  const config = await sala.config()
  switch (session.metodo) {
    // Si es por DNI o Google, verificamos que el userId esté en la lista de permitidos si la sala es excluyente
    case MetodosLogin.Google:
    case MetodosLogin.DNI:
      if (config.solo_invitados && !(await sala.listaPermitidos().autorizar(session.userId)))
        throw new ErrorSesion(
          session.metodo === MetodosLogin.DNI ? TipoErrorSesion.DniNoPermitido : TipoErrorSesion.EmailNoPermitido,
          `El ${session.metodo === MetodosLogin.DNI ? 'DNI' : 'email'} ${
            session.userId
          } no está en la lista de participantes permitidos.`
        )
      break

    case MetodosLogin.Nombre:
      // El nombre (identidad) no puede estar ya en uso por otro cliente CONECTADO en la sala.
      // (La planilla ahora incluye desconectados; un nombre liberado puede reutilizarse.)
      const enUso = (await sala.listarEstudiantes()).some(
        (s) => s.conectado && s.userId === session.userId && s.clientId !== session.clientId
      )
      if (enUso)
        throw new ErrorSesion(TipoErrorSesion.NombreEnUso, `El nombre "${session.userId}" ya está en uso en la sala.`)
      break
  }
}
