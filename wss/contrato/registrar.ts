import type { Socket } from 'socket.io'
import { z } from 'zod'
import { extractZodErrorMessages } from '../utils'
import type { Ack, Contrato, HandlersDe } from './definir'

/** Mensaje legible del error de un handler: los de validación de zod se resumen en sus `message`. */
const mensajeDe = (err: unknown) => {
  if (err instanceof z.ZodError) return extractZodErrorMessages(err)
  return err instanceof Error ? err.message : 'Error desconocido'
}

/**
 * Registra en `socket` un listener por cada handler, validando el payload con el schema del contrato
 * antes de llamarlo. Si el cliente mandó un callback de ack, el resultado (o el error) vuelve por
 * ahí como `Ack<R>`; si no, el error se le notifica por `wss:error`.
 *
 * Los listeners quedan registrados al retornar, así que conviene llamarlo antes de cualquier I/O
 * asincrónico de la conexión.
 */
export function registrar<C extends Contrato>(socket: Socket, contrato: C, handlers: HandlersDe<C>) {
  for (const [evento, handler] of Object.entries(handlers)) {
    const def = contrato[evento]
    if (!def || !handler) throw new Error(`Handler para evento fuera del contrato: ${evento}`)

    socket.on(evento, async (...args: unknown[]) => {
      const ultimo = args[args.length - 1]
      const ack = typeof ultimo === 'function' ? (ultimo as (res: Ack<unknown>) => void) : null
      // Un `undefined` en el medio de los argumentos viaja como `null`: se normaliza para que los
      // schemas de comandos sin payload (`sinPayload`) y los campos opcionales lo vean como ausente.
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
