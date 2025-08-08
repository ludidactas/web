import { Socket } from "socket.io"

// Functiones de arquitectura, orquestan la ejecución de las otras:
type Middleware<T extends unknown[]> = (...args: T) => void

/** Wrapper de handlers que agrega error handling al socket */
export const conErrorHandling = (socket: Socket) =>
  <T extends unknown[]>(handler: Middleware<T>) => {
    return (...args: T) => {
      try {
        handler(...args)
      } catch (err: unknown) {
        if (!(err instanceof Error)) {
          throw err
        }
        // console.error('Error en el handler:', err.message)
        socket.emit('poll:error', { message: err.message })
        throw err
      }
    }
  }

