import { ExtendedError, Socket } from 'socket.io'

// Functiones de arquitectura, orquestan la ejecución de las otras:
type Middleware<T extends unknown[]> = (...args: T) => Promise<void>

/**
 * Wrapper de handlers que agrega error handling al socket.
 * Cuando ocurre un error, se lo notifica al cliente que emitió el evento y se loguea.
 */
export const conErrorHandling =
  (socket: Socket) =>
  <T extends unknown[]>(handler: Middleware<T>) => {
    return async (...args: T) => {
      try {
        await handler(...args)
      } catch (err: unknown) {
        // Si no es un Error, lo rethroweamos tal cual (no es un caso que sepamos reportar al FE)
        if (!(err instanceof Error)) {
          throw err
        }

        console.error(
          `🚨 error-handling.ts: Handler ${handler.name} con args:`,
          args,
          `y socket:`,
          socket.data,
          'emitió error:',
          err
        )

        socket.emit('wss:error', { message: err.message })
      }
    }
  }

/** Envelope de respuesta para comandos con ack. El cliente decide la UI según `ok`. */
export type Ack<T> = { ok: true; data: T } | { ok: false; error: string }

/**
 * Wrapper para handlers de comando que responden por ack (último argumento). Resultado y error
 * viajan por el callback, así el `emitWithAck` del cliente nunca queda colgado. El error se entrega
 * por el ack; solo cae a `wss:error` si no vino callback.
 */
export const conAck =
  (socket: Socket) =>
  <A extends unknown[], R>(handler: (...args: A) => Promise<R>) => {
    return async (...args: unknown[]) => {
      const posibleAck = args[args.length - 1]
      const ack = typeof posibleAck === 'function' ? (posibleAck as (res: Ack<R>) => void) : null
      const handlerArgs = (ack ? args.slice(0, -1) : args) as A
      try {
        const data = await handler(...handlerArgs)
        ack?.({ ok: true, data })
      } catch (err: unknown) {
        console.error(
          `🚨 error-handling.ts (ack): Handler ${handler.name} con args:`,
          handlerArgs,
          'emitió error:',
          err
        )
        const message = err instanceof Error ? err.message : 'Error desconocido'
        if (ack) ack({ ok: false, error: message })
        else socket.emit('wss:error', { message })
      }
    }
  }

export const conErrorLogging = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  socket.on('connect_error', (error) => {
    console.error(`❌ Error en ${socket.nsp.name}:`, error.message)
  })
  next()
}
