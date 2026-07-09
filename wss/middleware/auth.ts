import jwt from 'jsonwebtoken'
import { isDefined } from 'remeda'
import { Sala } from '../salas/app'
import { MetodosLogin } from '../validators/auth'
import { ErrorSesion, TipoErrorSesion } from '../validators/errors'
import { WssEstudianteSession } from '../validators/session'

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

/**
 * Verifica una sesión de estudiante ya construida contra las políticas de la sala.
 * El `metodo` de la sesión coincide con `config.metodo_login` (lo inyectó el login), y el `userId` ya
 * está resuelto al campo de identidad del metodo_login.
 */
export async function verificarYAutorizarAccesoEstudianteASala(session: WssEstudianteSession, sala: Sala) {
  const config = await sala.config()
  switch (session.metodo) {
    // Si es por DNI o Google, verificamos que el userId esté en la lista de permitidos si la sala es excluyente
    case MetodosLogin.Google:
    case MetodosLogin.DNI:
      if (config.solo_invitados && !(await sala.listaPermitidos().incluye(session.userId)))
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
