import { ExtendedError, Socket } from 'socket.io'

export const conErrorLogging = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  socket.on('connect_error', (error) => {
    // Sin el mensaje: el de un login rechazado puede llevar el DNI/email del pasaporte.
    const tipo = (error as ExtendedError & { data?: { type?: string } }).data?.type
    console.error(`❌ Error en ${socket.nsp.name}:`, tipo ?? error.message)
  })
  next()
}
