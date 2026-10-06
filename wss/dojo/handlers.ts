import { Socket } from 'socket.io'
import { conAck } from '../middleware/error-handling'
import { PasaporteDojoSchema } from '../validators/auth'
import { FORMATO_ID_DOJO, desafioDojoSchema, sincronizarDojoSchema } from '../validators/dojo'
import * as db from './db'

async function resolverId(pedido: string | undefined): Promise<string> {
  if (pedido && FORMATO_ID_DOJO.test(pedido) && (await db.existe(pedido))) return pedido
  return db.emitirId()
}

/**
 * Comandos de un visitante anónimo del dojo de Go. El id se resuelve al conectar, a partir del `idDojo`
 * del pasaporte: el pedido si el server lo emitió, o uno nuevo. Registra sus listeners de forma
 * síncrona y cada comando espera esa resolución, así que no importa en qué orden lleguen.
 * `dojo:identificarse` devuelve el id definitivo, que el cliente guarda para pedirlo al reconectar.
 */
export function handlersDojo(socket: Socket) {
  const ack = conAck(socket)
  const { idDojo: pedido } = PasaporteDojoSchema.parse(socket.handshake.auth)
  const identificacion = resolverId(pedido)
  // Si el rechazo no lo espera ningún comando, `unhandledRejection` tira el proceso (ver `mount.ts`).
  identificacion.catch(() => {})

  socket.on(
    'dojo:identificarse',
    ack(async () => identificacion)
  )

  socket.on(
    'dojo:sincronizar',
    ack(async (payload: unknown) => {
      const id = await identificacion
      const { resueltos, ...capitulo } = sincronizarDojoSchema.parse(payload)
      await db.agregarResueltos(id, capitulo, resueltos)
      return db.getProgreso(id, capitulo)
    })
  )

  socket.on(
    'dojo:resuelto',
    ack(async (payload: unknown) => {
      const id = await identificacion
      const { desafio, ...capitulo } = desafioDojoSchema.parse(payload)
      await db.agregarResueltos(id, capitulo, [desafio])
    })
  )

  socket.on(
    'dojo:actual',
    ack(async (payload: unknown) => {
      const id = await identificacion
      const { desafio, ...capitulo } = desafioDojoSchema.parse(payload)
      await db.setActual(id, capitulo, desafio)
    })
  )
}
