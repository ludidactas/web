import { ExtendedError, Socket } from 'socket.io'

// Functiones de arquitectura, orquestan la ejecución de las otras:
type Middleware<T extends unknown[]> = (...args: T) => Promise<void>

/**
 * Wrapper para el código de una conexión que no es un comando del cliente (init al conectar,
 * `disconnect`): si falla, se loguea y se le notifica al cliente por `wss:error`. Sin este wrapper, un
 * throw ahí es una `unhandledRejection` que tira el proceso (ver `wss/mount.ts`). Los comandos del
 * cliente se registran con `registrar` (`wss/contrato`).
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

export const conErrorLogging = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  socket.on('connect_error', (error) => {
    console.error(`❌ Error en ${socket.nsp.name}:`, error.message)
  })
  next()
}
