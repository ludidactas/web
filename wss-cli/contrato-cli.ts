import type { Socket } from 'socket.io-client'
import type { Contrato, Entrada, EventosServidor, ListenersDe } from '@/wss/contrato/definir'
import type { Comando } from '@/wss/contrato/definir'
import type { Ack } from '@/wss/middleware/error-handling'

const TIMEOUT_ACK_MS = 5000

/** Claves del contrato cuyo comando responde por ack. */
type ConAck<C extends Contrato> = { [K in keyof C]: C[K] extends Comando<any, any, true> ? K : never }[keyof C] & string

/** Claves del contrato cuyo comando no responde datos. */
type SinAck<C extends Contrato> = Exclude<keyof C & string, ConAck<C>>

/** Argumentos de un comando: el payload es opcional si su schema acepta `undefined`. */
type ArgsDe<C extends Contrato, K extends keyof C> = undefined extends Entrada<C[K]>
  ? [payload?: Entrada<C[K]>]
  : [payload: Entrada<C[K]>]

type RespuestaDe<D> = D extends Comando<any, infer R, true> ? R : never

/**
 * Emisor tipado contra el contrato `C` (los comandos que el rol del socket puede mandar):
 * - `enviar`: comando sin respuesta. Si el server falla, el error llega por `wss:error`.
 * - `pedir`: comando con ack. Resuelve con el dato de la respuesta y rechaza con el error del server.
 *
 * Sin socket (`null`, todavía no conectó) `enviar` no hace nada y `pedir` rechaza.
 */
export function comandos<C extends Contrato>(socket: Socket | null) {
  return {
    enviar: <K extends SinAck<C>>(evento: K, ...[payload]: ArgsDe<C, K>): void => {
      socket?.emit(evento, payload)
    },

    pedir: async <K extends ConAck<C>>(
      evento: K,
      ...[payload]: ArgsDe<C, K>
    ): Promise<RespuestaDe<C[K]>> => {
      if (!socket) throw new Error('Sin conexión')
      const res: Ack<RespuestaDe<C[K]>> = await socket.timeout(TIMEOUT_ACK_MS).emitWithAck(evento, payload)
      if (!res.ok) throw new Error(res.error)
      return res.data
    },
  }
}

/**
 * Suscribe `handlers` a los eventos del server `E`. Devuelve la función que quita exactamente esos
 * listeners (no los de otros módulos sobre el mismo evento).
 */
export function escuchar<E extends EventosServidor>(
  socket: Socket | null,
  handlers: Partial<ListenersDe<E>>
): () => void {
  if (!socket) return () => {}
  const registrados = Object.entries(handlers) as [string, (payload: unknown) => void][]
  for (const [evento, handler] of registrados) socket.on(evento, handler)
  return () => {
    for (const [evento, handler] of registrados) socket.off(evento, handler)
  }
}
