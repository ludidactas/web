import { ExtendedError, Socket } from 'socket.io'

// Functiones de arquitectura, orquestan la ejecución de las otras:
type Middleware<T extends unknown[]> = (...args: T) => Promise<void>

/**
 * Para el código de una conexión que no es un comando (init, `disconnect`): loguea el error y lo notifica
 * por `wss:error`. Sin él, un throw es una `unhandledRejection` que tira el proceso (ver `wss/mount.ts`).
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
