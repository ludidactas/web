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
          console.error('Error inesperado:', err)
          return
        }
        console.error('Error en el handler:', err.message)
        socket.emit('poll:error', { message: err.message })
      }
    }
  }

/** 
 * Función para derivar el id del socket. Por ahora usa la IP del cliente. 
 * 
 * En el futuro vamos a establecer una sesión de cookie/localStorage. 
 * Ver https://socket.io/get-started/private-messaging-part-2/.
 */
export function userId(socket: Socket) {
  // En prod usamos el IP forwardeado por nginx
  const forwarded = socket.handshake.headers['x-forwarded-for']
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : socket.handshake.address

  return ip
}

export const conUserId = (socket: Socket, next: () => void) => { 
  socket.data.userId = userId(socket)
  next()
}