import { Socket } from 'socket.io'
import { comandosDojo } from '../contrato/dojo'
import { registrar } from '../contrato/registrar'
import { PasaporteDojoSchema } from '../validators/auth'
import { FORMATO_ID_DOJO } from '../validators/dojo'
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
  const { idDojo: pedido } = PasaporteDojoSchema.parse(socket.handshake.auth)
  const identificacion = resolverId(pedido)
  // Si el rechazo no lo espera ningún comando, `unhandledRejection` tira el proceso (ver `mount.ts`).
  identificacion.catch(() => {})

  registrar(socket, comandosDojo, {
    'dojo:identificarse': async () => identificacion,

    'dojo:sincronizar': async ({ resueltos, ...capitulo }) => {
      const id = await identificacion
      await db.agregarResueltos(id, capitulo, resueltos)
      return db.getProgreso(id, capitulo)
    },

    'dojo:resuelto': async ({ desafio, ...capitulo }) => {
      const id = await identificacion
      await db.agregarResueltos(id, capitulo, [desafio])
    },

    'dojo:actual': async ({ desafio, ...capitulo }) => {
      const id = await identificacion
      await db.setActual(id, capitulo, desafio)
    },
  })
}
