import { ExtendedError, Socket } from 'socket.io'

export const conErrorLogging = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  socket.on('connect_error', (error) => {
    console.error(`❌ Error en ${socket.nsp.name}:`, error.message)
  })
  next()
}
