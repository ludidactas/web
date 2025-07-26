// Cargamos la password maestra desde las variables de entorno. 

import { Socket } from "socket.io"

// Si no está seteada, tiramos un error para que no arranque el server.
const masterPwd = process.env.POLLS_ADMIN_PASS
if (!masterPwd) {
  console.error("Error: POLLS_ADMIN_PASS no está seteada.")
  process.exit(1)
}

export function assertValidPassword(pwd: string) {
  if (pwd !== masterPwd) throw new Error('Contraseña maestra incorrecta')
}

/**
 * Auth middleware.
 */
export function conAuth(socket: Socket, next: () => void) {
  assertValidPassword(socket.handshake.auth.masterPassword)
  next()
}