import type { Socket } from 'socket.io'
import { z } from 'zod'
import { extractZodErrorMessages } from '../utils'
import type { Ack, Contrato, HandlersDe } from './definir'

/** Mensaje legible del error de un handler (los de zod se resumen en sus `message`). */
const mensajeDe = (err: unknown) => {
  if (err instanceof z.ZodError) return extractZodErrorMessages(err)
  return err instanceof Error ? err.message : 'Error desconocido'
}

/**
 * Registra un listener por handler: valida el payload con el schema del contrato y responde por ack
 * (`Ack<R>`) o, sin callback, notifica el error por `wss:error`. Llamarlo antes de cualquier `await` de
 * I/O de la conexión, para no perder comandos tempranos (ver docs/contrato-wss.md).
 */
export function registrar<C extends Contrato>(socket: Socket, contrato: C, handlers: HandlersDe<C>) {
  for (const [evento, handler] of Object.entries(handlers)) {
    const def = contrato[evento]
    if (!def || !handler) throw new Error(`Handler para evento fuera del contrato: ${evento}`)

    socket.on(evento, async (...args: unknown[]) => {
      const ultimo = args[args.length - 1]
      const ack = typeof ultimo === 'function' ? (ultimo as (res: Ack<unknown>) => void) : null
      // Un `undefined` viaja como `null`: se normaliza para `sinPayload` y los opcionales.
      const payload = args[0] === ack ? undefined : (args[0] ?? undefined)

      try {
        const data = await handler(def.input.parse(payload))
        ack?.({ ok: true, data })
      } catch (err: unknown) {
        console.error(`🚨 registrar: handler '${evento}' con payload:`, payload, 'emitió error:', err)
        const message = mensajeDe(err)
        if (ack) ack({ ok: false, error: message })
        else socket.emit('wss:error', { message })
      }
    })
  }
}

/**
 * Corre código de una conexión que no es un comando (init, `disconnect`): un error se loguea y se notifica
 * por `wss:error`, y nunca llega a ser una `unhandledRejection` (que tira el proceso, ver `wss/mount.ts`).
 * Dentro de un handler, envuelve un efecto secundario cuyo fallo no debe fallar al comando (ver docs/contrato-wss.md).
 */
export async function protegido(socket: Socket, fn: () => Promise<unknown> | unknown): Promise<void> {
  try {
    await fn()
  } catch (err: unknown) {
    console.error(`🚨 conexión ${socket.id}: error fuera de un comando:`, err)
    socket.emit('wss:error', { message: mensajeDe(err) })
  }
}

/** `socket.on('disconnect')` con el mismo manejo de errores que `protegido`. */
export function alDesconectar(socket: Socket, fn: (motivo: string) => Promise<unknown> | unknown) {
  socket.on('disconnect', (motivo) => protegido(socket, () => fn(motivo)))
}
