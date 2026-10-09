import { z } from 'zod'

// Contrato server↔cliente: ver docs/contrato-wss.md.

/** Respuesta de un comando con ack. */
export type Ack<T> = { ok: true; data: T } | { ok: false; error: string }

/** Un comando del cliente al server; `ack` indica si responde con `Ack<R>`. */
export interface Comando<I extends z.ZodTypeAny = z.ZodTypeAny, R = unknown, A extends boolean = boolean> {
  readonly input: I
  readonly ack: A
  /** Solo de tipo: el dato que viaja en `Ack<R>`. */
  readonly __respuesta?: R
}

/** Comandos de un rol o feature, por nombre de evento. */
export type Contrato = Record<string, Comando>

/** Declara el tipo de respuesta de un `comandoAck`: `comandoAck(schema, devuelve<Partida>())`. */
export const devuelve = <R>() => undefined as unknown as R

/** Schema de los comandos que no llevan payload. */
export const sinPayload = z.undefined()

/** Comando sin respuesta: si el handler falla, el error llega por `wss:error`. */
export const comando = <I extends z.ZodTypeAny>(input: I): Comando<I, never, false> => ({ input, ack: false })

/** Comando que responde por ack: el cliente lo espera con `pedir`. */
export const comandoAck = <I extends z.ZodTypeAny, R>(input: I, _respuesta: R): Comando<I, R, true> => ({
  input,
  ack: true,
})

/** Lo que manda el cliente: el `input` del schema. */
export type Entrada<D> = D extends Comando<infer I> ? z.input<I> : never

/** Lo que recibe el handler: el `output` del schema. */
export type Parseado<D> = D extends Comando<infer I> ? z.output<I> : never

/** Lo que devuelve el handler: el dato del ack, o nada si el comando no responde. */
export type Resultado<D> = D extends Comando<any, infer R, true> ? R : void

/** Un handler por comando; cada rol registra el subconjunto que implementa. */
export type HandlersDe<C extends Contrato> = {
  [K in keyof C]?: (payload: Parseado<C[K]>) => Promise<Resultado<C[K]>>
}

/** Eventos que el server emite al cliente: nombre → payload. */
export type EventosServidor = object

/** Mapa `{evento: payload}` en el formato `{evento: listener}` de socket.io. */
export type ListenersDe<E extends EventosServidor> = { [K in keyof E]: (payload: E[K]) => void }
