import type { Socket } from 'socket.io-client'
import type { Ack, Comando, Contrato, Entrada, EventosServidor, ListenersDe } from '@/wss/contrato/definir'

const TIMEOUT_ACK_MS = 5000

export interface OpcionesComandos {
  /** Cuánto espera `pedir` el ack antes de rechazar. Default: 5000. */
  timeoutMs?: number
}

/** Claves del contrato cuyo comando responde por ack. */
type ConAck<C extends Contrato> = { [K in keyof C]: C[K] extends Comando<any, any, true> ? K : never }[keyof C] & string

/** Claves del contrato cuyo comando no responde. */
type SinAck<C extends Contrato> = Exclude<keyof C & string, ConAck<C>>

/** Argumentos de un comando: el payload es opcional si su schema acepta `undefined`. */
type ArgsDe<C extends Contrato, K extends keyof C> = undefined extends Entrada<C[K]>
  ? [payload?: Entrada<C[K]>]
  : [payload: Entrada<C[K]>]

type RespuestaDe<D> = D extends Comando<any, infer R, true> ? R : never

/**
 * Emisor tipado contra el contrato `C`:
 * - `enviar`: comando sin respuesta (un error del server llega por `wss:error`).
 * - `pedir`: comando con ack; rechaza con el error del server o por `timeoutMs`.
 *
 * Sin socket, `enviar` no hace nada y `pedir` rechaza.
 */
export function comandos<C extends Contrato>(socket: Socket | null, { timeoutMs = TIMEOUT_ACK_MS }: OpcionesComandos = {}) {
  return {
    enviar: <K extends SinAck<C>>(evento: K, ...[payload]: ArgsDe<C, K>): void => {
      socket?.emit(evento, payload)
    },

    pedir: async <K extends ConAck<C>>(
      evento: K,
      ...[payload]: ArgsDe<C, K>
    ): Promise<RespuestaDe<C[K]>> => {
      if (!socket) throw new Error('Sin conexión')
      const res: Ack<RespuestaDe<C[K]>> = await socket.timeout(timeoutMs).emitWithAck(evento, payload)
      if (!res.ok) throw new Error(res.error)
      return res.data
    },
  }
}

/** Suscribe `handlers` a los eventos del server `E`; devuelve la función que quita solo esos listeners. */
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

/** Algo que se engancha al socket: `montar` devuelve la función que lo desengancha. */
export interface Montable {
  montar: () => () => void
}

/** Monta cada handler y devuelve la función que desmonta todos. */
export function montarTodos(handlers: Record<string, Montable>): () => void {
  const desmontajes = Object.values(handlers).map((handler) => handler.montar())
  return () => desmontajes.forEach((desmontar) => desmontar())
}
