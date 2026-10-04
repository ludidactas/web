import { Socket } from 'socket.io'
import { conAck } from '../middleware/error-handling'
import {
  FORMATO_ID_DOJO,
  desafioDojoSchema,
  identificarseDojoSchema,
  sincronizarDojoSchema,
} from '../validators/dojo'
import * as db from './db'

async function resolverId(pedido: string | undefined): Promise<string> {
  if (pedido && FORMATO_ID_DOJO.test(pedido) && (await db.existe(pedido))) return pedido
  return db.emitirId()
}

/**
 * Comandos de un visitante anónimo del dojo de Go. `dojo:identificarse` va primero: devuelve el id
 * pedido si fue emitido por el server, o uno nuevo. Los demás comandos esperan a que termine.
 */
export const handlersDojo = async (socket: Socket) => {
  const ack = conAck(socket)
  let identificacion: Promise<string> | null = null

  function identificado(): Promise<string> {
    if (!identificacion) throw new Error('Visitante del dojo sin identificar')
    return identificacion
  }

  socket.on(
    'dojo:identificarse',
    ack(async (payload: unknown) => {
      const { idDojo: pedido } = identificarseDojoSchema.parse(payload)
      identificacion = resolverId(pedido)
      return identificacion
    })
  )

  socket.on(
    'dojo:sincronizar',
    ack(async (payload: unknown) => {
      const id = await identificado()
      const { capitulo, resueltos } = sincronizarDojoSchema.parse(payload)
      await db.agregarResueltos(id, capitulo, resueltos)
      return db.getProgreso(id, capitulo)
    })
  )

  socket.on(
    'dojo:resuelto',
    ack(async (payload: unknown) => {
      const id = await identificado()
      const { capitulo, desafio } = desafioDojoSchema.parse(payload)
      await db.agregarResueltos(id, capitulo, [desafio])
    })
  )

  socket.on(
    'dojo:actual',
    ack(async (payload: unknown) => {
      const id = await identificado()
      const { capitulo, desafio } = desafioDojoSchema.parse(payload)
      await db.setActual(id, capitulo, desafio)
    })
  )
}
