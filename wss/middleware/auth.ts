import jwt from 'jsonwebtoken'

// Cargamos el secret para decodear los JWT y la lista de admins desde las variables de entorno. 
// Si no está seteada, tiramos un error para que no arranque el server.
const secret = process.env.NEXTAUTH_SECRET
const ADMINS = process.env.POLLS_ADMINS?.split(',').map(email => email.trim())
if (!secret || !ADMINS) {
  console.error("Error: NEXTAUTH_SECRET o POLLS_ADMINS no están seteadas.")
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
 * Decodea un token emitido por nuestro server de Next, que es el que autentica al usuario con google.
 * @param token presentado por el frontend previamente obtenido desde next, que lo firma para que sepamos que es legítimo, y que contiene datos de usuario de google.
 * @returns { exp: number, email: string, name?: string } payload del token, con email y fecha de expiración y opcionalmente nombre e imagen (de google).
 */
export const decodearTokenNextAuth = (token: string) => {
  // Verificar que el token no haya expirado
  const payload = jwt.verify(token, secret, { audience: 'wss-client', algorithms: ['HS256'] }) as NextAuth

  if (!payload) throw new Error('Token de autenticación inválido')
  if (!payload.email) throw new Error('Token de autenticación inválido. Falta email!')

  return payload
}

/** Verifica si un email está registrado en la lista de admins del .env */
export const registradoComoAdmin = (email: string) => {
  return ADMINS.includes(email)
}
