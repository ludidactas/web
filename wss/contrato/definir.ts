import { z } from 'zod'

// Contrato server↔cliente: cada comando que el cliente puede mandar se declara una sola vez, con el
// schema zod de su payload y (si responde por ack) el tipo de su respuesta. El server registra
// handlers contra el contrato (`registrar`) y el cliente emite contra el mismo contrato
// (`wss-cli/contrato-cli.ts`), así que renombrar un evento o cambiar un payload rompe la compilación
// de ambos lados.

/** Envelope de respuesta de los comandos con ack. El cliente decide la UI según `ok`. */
export type Ack<T> = { ok: true; data: T } | { ok: false; error: string }

/** Un comando del cliente al server. `ack` indica si el server responde con un envelope `Ack<R>`. */
export interface Comando<I extends z.ZodTypeAny = z.ZodTypeAny, R = unknown, A extends boolean = boolean> {
  readonly input: I
  readonly ack: A
  /** Solo de tipo: el dato que viaja en `Ack<R>`. No existe en runtime. */
  readonly __respuesta?: R
}

/** Conjunto de comandos de un rol (o de una feature): nombre del evento → definición. */
export type Contrato = Record<string, Comando>

/** Marca de tipo para declarar la respuesta de un comando con ack: `comandoAck(schema, devuelve<Partida>())`. */
export const devuelve = <R>() => undefined as unknown as R

/** Schema de los comandos que no llevan payload. */
export const sinPayload = z.undefined()

/** Comando sin respuesta de datos: si el handler falla, el error le llega al cliente por `wss:error`. */
export const comando = <I extends z.ZodTypeAny>(input: I): Comando<I, never, false> => ({ input, ack: false })

/** Comando que responde por ack (`Ack<R>`): el cliente lo espera con `pedir`. */
export const comandoAck = <I extends z.ZodTypeAny, R>(input: I, _respuesta: R): Comando<I, R, true> => ({
  input,
  ack: true,
})

/** Lo que el cliente manda: el `input` del schema, antes de aplicar defaults/transforms. */
export type Entrada<D> = D extends Comando<infer I> ? z.input<I> : never

/** Lo que recibe el handler del server: el `output` del schema, ya parseado. */
export type Parseado<D> = D extends Comando<infer I> ? z.output<I> : never

/** Lo que devuelve el handler de un comando: el dato de su ack, o nada si no responde. */
export type Resultado<D> = D extends Comando<any, infer R, true> ? R : void

/** Un handler por comando, tipado contra el contrato. Cada rol registra el subconjunto que implementa. */
export type HandlersDe<C extends Contrato> = {
  [K in keyof C]?: (payload: Parseado<C[K]>) => Promise<Resultado<C[K]>>
}

/** Comandos del contrato en el formato `Record<evento, listener>` que usa socket.io para tipar sockets. */
export type EventosDeContrato<C extends Contrato> = {
  [K in keyof C]: C[K] extends Comando<infer I, infer R, infer A>
    ? A extends true
      ? (payload: z.input<I>, ack: (respuesta: Ack<R>) => void) => void
      : (payload: z.input<I>) => void
    : never
}

/** Eventos que el server emite al cliente: nombre → payload. Sin respuesta, sin schema. */
export type EventosServidor = object

/** Un map de payloads `{evento: payload}` en el formato `Record<evento, listener>` de socket.io. */
export type ListenersDe<E extends EventosServidor> = { [K in keyof E]: (payload: E[K]) => void }
