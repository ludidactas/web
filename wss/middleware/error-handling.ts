import { ExtendedError, Socket } from 'socket.io'
import { avisarTelegram } from '../alertas'

export const conErrorLogging = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  socket.on('connect_error', (error) => {
    console.error(`❌ Error en ${socket.nsp.name}:`, error.message)
    avisarTelegram('connect-error', `Error de conexión en ${socket.nsp.name}: ${error.message}`)
  })
  next()
}
