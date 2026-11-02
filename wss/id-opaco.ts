import { createHmac } from 'crypto'

// Sin la clave el wss no arranca: los ids opacos son la identidad que ve la sala, no pueden caer a un valor de default.
const secreto = process.env.SECRETO_ID_OPACO
if (!secreto) {
  console.error('Error: SECRETO_ID_OPACO no está seteada.')
  process.exit(1)
}

/**
 * Id opaco por sala de un usuario: HMAC de `salaId:userId`, así el mismo `userId` (DNI o email) da
 * ids distintos en salas distintas. Los eventos de la sala hacia los clientes llevan este id, nunca
 * el `userId` real; el server resuelve la vuelta (payloads entrantes con id opaco) recalculando el
 * id de cada persona de la sala en `wss/go/app.ts`.
 */
export const idOpaco = (salaId: string, userId: string): string =>
  createHmac('sha256', secreto).update(`${salaId}:${userId}`).digest('hex').slice(0, 16)
