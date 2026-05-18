import { ExtendedError, Socket } from 'socket.io'

// Functiones de arquitectura, orquestan la ejecución de las otras:
type Middleware<T extends unknown[]> = (...args: T) => Promise<void>

/**
 * Wrapper de handlers que agrega error handling al socket.
 * Cuando ocurre un error, se lo notifica al cliente que emitió el evento y se throwea.
 */
export const conErrorHandling =
  (socket: Socket) =>
  <T extends unknown[]>(handler: Middleware<T>) => {
    return async (...args: T) => {
      try {
        await handler(...args)
      } catch (err: unknown) {

        console.log(`🎬 error-handling.ts: Handler: ${handler.name} ejecutándose con args:`, args, `y socket: `, socket.data, 'emitió error: ', err)

        // Si no es un Error, lo rethroweamos tal cual
        if (!(err instanceof Error)) {
          throw err
        }

        socket.emit('wss:error', { message: err.message })
        if (process.env.NODE_ENV === 'development') throw err
      }
    }
  }

export const conErrorLogging = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  socket.on('connect_error', (error) => {
    console.error(`❌ Error en ${socket.nsp.name}:`, error.message)
  })
  next()
}
