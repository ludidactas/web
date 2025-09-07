import { Socket } from "socket.io"

// Functiones de arquitectura, orquestan la ejecución de las otras:
type Middleware<T extends unknown[]> = (...args: T) => void

/** 
 * Wrapper de handlers que agrega error handling al socket.
 * Cuando ocurre un error, se lo notifica al cliente que emitió el evento y se throwea.
 */
export const conErrorHandling = (socket: Socket) =>
  <T extends unknown[]>(handler: Middleware<T>) => {
    return (...args: T) => {
      try {
        handler(...args)
      } catch (err: unknown) {

        // Si no es un Error, lo rethroweamos tal cual
        if (!(err instanceof Error)) {
          throw err
        }

        socket.emit('poll:error', { message: err.message })
        // throw err
      }
    }
  }

